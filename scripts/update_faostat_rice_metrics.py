#!/usr/bin/env python3
"""Generate MARKET BASE rice data and rice rankings from FAOSTAT bulk files.

Inputs:
  raw/faostat/Production_Crops_Livestock_E_All_Data_(Normalized).zip or CSV
  raw/faostat/Trade_CropsLivestock_E_All_Data_(Normalized).zip or CSV
  raw/faostat/FoodBalanceSheets_E_All_Data_(Normalized).zip or CSV
  raw/faostat/FoodBalanceSheetsHistoric_E_All_Data_(Normalized).zip or CSV

Outputs:
  data/market_base_rice_data_CURRENT.json
  data/market_base_rice_data_v1.json / v2.json compatibility copies
  data/market_base_rice_rankings_CURRENT.json
  data/market_base_rice_rankings_v1.json / v2.json compatibility copies
"""
from __future__ import annotations
import csv, io, json, pathlib, zipfile, datetime, re
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
RAW = ROOT / "raw" / "faostat"
CREATED_AT = datetime.date.today().isoformat()

METRICS = {
    'rice_production_paddy_tonnes': {'label':'米生産量','unit':'t'},
    'rice_area_harvested_ha': {'label':'米収穫面積','unit':'ha'},
    'rice_yield_kg_per_ha': {'label':'米単収','unit':'kg/ha'},
    'rice_import_quantity_tonnes': {'label':'米輸入量','unit':'t'},
    'rice_export_quantity_tonnes': {'label':'米輸出量','unit':'t'},
    'rice_import_value_1000_usd': {'label':'米輸入額','unit':'1000 USD'},
    'rice_export_value_1000_usd': {'label':'米輸出額','unit':'1000 USD'},
    'rice_domestic_supply_tonnes': {'label':'国内供給量','unit':'t'},
    'rice_food_use_tonnes': {'label':'食品用途量','unit':'t'},
    'rice_feed_use_tonnes': {'label':'飼料用途量','unit':'t'},
    'rice_processing_use_tonnes': {'label':'加工用途量','unit':'t'},
    'rice_seed_use_tonnes': {'label':'種子用途量','unit':'t'},
    'rice_losses_tonnes': {'label':'損失量','unit':'t'},
    'rice_stock_variation_tonnes': {'label':'在庫変動量','unit':'t'},
    'rice_other_uses_tonnes': {'label':'その他用途量','unit':'t'},
    'rice_food_supply_kg_capita_year': {'label':'1人当たり米供給量','unit':'kg/capita/year'},
    'rice_kcal_supply_capita_day': {'label':'1人当たりカロリー供給','unit':'kcal/capita/day'},
    'rice_protein_supply_g_capita_day': {'label':'1人当たりタンパク質供給','unit':'g/capita/day'},
    'rice_fat_supply_g_capita_day': {'label':'1人当たり脂質供給','unit':'g/capita/day'},
}

PROD_MAP = {
    'Production': ('rice_production_paddy_tonnes', 't'),
    'Area harvested': ('rice_area_harvested_ha', 'ha'),
    'Yield': ('rice_yield_kg_per_ha', 'kg/ha'),
}
FBS_MAP = {
    'Domestic supply quantity': ('rice_domestic_supply_tonnes','t'),
    'Food': ('rice_food_use_tonnes','t'),
    'Feed': ('rice_feed_use_tonnes','t'),
    'Processing': ('rice_processing_use_tonnes','t'),
    'Seed': ('rice_seed_use_tonnes','t'),
    'Losses': ('rice_losses_tonnes','t'),
    'Stock Variation': ('rice_stock_variation_tonnes','t'),
    'Other uses (non-food)': ('rice_other_uses_tonnes','t'),
    'Food supply (kcal/capita/day)': ('rice_kcal_supply_capita_day','kcal/capita/day'),
    'Protein supply quantity (g/capita/day)': ('rice_protein_supply_g_capita_day','g/capita/day'),
    'Fat supply quantity (g/capita/day)': ('rice_fat_supply_g_capita_day','g/capita/day'),
    'Food supply quantity (kg/capita/yr)': ('rice_food_supply_kg_capita_year','kg/capita/year'),
    'Import quantity': ('rice_import_quantity_tonnes','t'),
    'Export quantity': ('rice_export_quantity_tonnes','t'),
}
TRADE_ELEMENTS = {
    'Import Quantity': ('rice_import_quantity_tonnes', 't'),
    'Export Quantity': ('rice_export_quantity_tonnes', 't'),
    'Import quantity': ('rice_import_quantity_tonnes', 't'),
    'Export quantity': ('rice_export_quantity_tonnes', 't'),
    'Import Value': ('rice_import_value_1000_usd', '1000 USD'),
    'Export Value': ('rice_export_value_1000_usd', '1000 USD'),
    'Import value': ('rice_import_value_1000_usd', '1000 USD'),
    'Export value': ('rice_export_value_1000_usd', '1000 USD'),
}
RICE_ITEM_CODES = {'27','28','31','32'}

def load_json(path: pathlib.Path):
    return json.load(open(path, encoding='utf-8'))

def save_json(path: pathlib.Path, obj) -> None:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

def m49_int(v):
    if v is None: return None
    s = str(v).strip().replace("'", "")
    if not s or s in {'—','-','nan'}: return None
    try: return int(float(s))
    except Exception: return None

def num(v):
    if v is None: return None
    s = str(v).strip().replace(',', '')
    if not s or s in {'—','-','nan','NaN'}: return None
    try: return float(s)
    except Exception: return None

def open_csv_candidates(patterns):
    files=[]
    for pat in patterns:
        files.extend(RAW.glob(pat))
    # Prefer smaller pre-filtered csv if present, otherwise zip.
    files=sorted(set(files), key=lambda p: (0 if p.suffix.lower()=='.csv' else 1, len(p.name)))
    return files

def iter_csv_rows(path: pathlib.Path, encoding='utf-8'):
    if path.suffix.lower() == '.zip':
        with zipfile.ZipFile(path) as z:
            names=[n for n in z.namelist() if n.lower().endswith('.csv') and 'all_data' in n.lower()]
            if not names:
                names=[n for n in z.namelist() if n.lower().endswith('.csv')]
            if not names:
                return
            name=names[0]
            with z.open(name) as bf:
                # UTF-8 first, latin-1 fallback.
                try:
                    text=io.TextIOWrapper(bf, encoding=encoding, newline='')
                    reader=csv.DictReader(text)
                    for row in reader: yield row
                except UnicodeDecodeError:
                    bf.close()
                    with z.open(name) as bf2:
                        text=io.TextIOWrapper(bf2, encoding='latin-1', newline='')
                        reader=csv.DictReader(text)
                        for row in reader: yield row
    else:
        try:
            f=open(path, encoding=encoding, newline='')
            reader=csv.DictReader(f)
            for row in reader: yield row
            f.close()
        except UnicodeDecodeError:
            f=open(path, encoding='latin-1', newline='')
            reader=csv.DictReader(f)
            for row in reader: yield row
            f.close()

def is_rice_item(row):
    code=str(row.get('Item Code') or row.get('Item Code (CPC)') or '').strip()
    item=str(row.get('Item') or '').lower()
    return code in RICE_ITEM_CODES or 'rice' in item

def unit_adjust(value, raw_unit):
    if value is None: return None
    u=str(raw_unit or '').strip()
    if u == '1000 t': return value * 1000.0
    return value

def latest_insert(store, m49, key, obj):
    if not m49 or not key: return
    prev=store.get((m49,key))
    year=obj.get('year') or 0
    if prev is None or year >= (prev.get('year') or 0):
        store[(m49,key)] = obj

def process_production(paths, valid_m49):
    out={}
    for path in paths[:1]:
        print(f"[rice] production source: {path}")
        for row in iter_csv_rows(path):
            if not is_rice_item(row): continue
            elem=row.get('Element')
            if elem not in PROD_MAP: continue
            m=m49_int(row.get('Area Code (M49)'))
            if m not in valid_m49: continue
            val=unit_adjust(num(row.get('Value')), row.get('Unit'))
            if val is None: continue
            key, unit=PROD_MAP[elem]
            latest_insert(out, m, key, {
                'value': round(val,4), 'year': int(float(row.get('Year'))), 'unit': unit,
                'source': 'FAOSTAT Production: Crops and livestock products',
                'source_url': 'https://www.fao.org/faostat/en/#data/QCL',
                'item': row.get('Item'), 'element': elem,
                'note': 'Generated by scripts/update_faostat_rice_metrics.py from FAOSTAT bulk data.'
            })
    return out

def process_fbs(paths, valid_m49, historic=False):
    out={}
    for path in paths[:1]:
        print(f"[rice] food balance source: {path}")
        for row in iter_csv_rows(path, encoding='latin-1' if historic else 'utf-8'):
            if not is_rice_item(row): continue
            elem=row.get('Element')
            if elem not in FBS_MAP: continue
            m=m49_int(row.get('Area Code (M49)'))
            if m not in valid_m49: continue
            val=unit_adjust(num(row.get('Value')), row.get('Unit'))
            if val is None: continue
            key, unit=FBS_MAP[elem]
            latest_insert(out, m, key, {
                'value': round(val,4), 'year': int(float(row.get('Year'))), 'unit': unit,
                'source': 'FAOSTAT Food Balance Sheets Historic' if historic else 'FAOSTAT Food Balance Sheets',
                'source_url': 'https://www.fao.org/faostat/en/#data/FBSH' if historic else 'https://www.fao.org/faostat/en/#data/FBS',
                'item': row.get('Item'), 'element': elem,
                'note': 'Historic fallback value.' if historic else 'Current Food Balance value.'
            })
    return out

def process_trade(paths, valid_m49):
    # Aggregate rice commodity forms by m49, element, year.
    by_year=defaultdict(float)
    raw_unit={}
    source_path=None
    for path in paths[:1]:
        source_path=path
        print(f"[rice] trade source: {path}")
        for row in iter_csv_rows(path):
            if not is_rice_item(row): continue
            elem=row.get('Element')
            if elem not in TRADE_ELEMENTS: continue
            m=m49_int(row.get('Area Code (M49)'))
            if m not in valid_m49: continue
            val=num(row.get('Value'))
            if val is None: continue
            year=int(float(row.get('Year')))
            key, unit=TRADE_ELEMENTS[elem]
            by_year[(m,key,year)] += unit_adjust(val, row.get('Unit')) or 0
            raw_unit[(m,key,year)] = unit
    out={}
    grouped=defaultdict(list)
    for (m,k,y),v in by_year.items(): grouped[(m,k)].append((y,v))
    for (m,k), vals in grouped.items():
        y,v=sorted(vals)[-1]
        out[(m,k)]={
            'value': round(v,4), 'year': y, 'unit': raw_unit.get((m,k,y)) or METRICS[k]['unit'],
            'source': 'FAOSTAT Trade: rice commodity forms aggregate',
            'source_url': 'https://www.fao.org/faostat/en/#data/TCL',
            'item': 'Rice commodity forms', 'element': k,
            'note': 'Aggregates rice-related commodity forms. Used as fallback or value metric source.'
        }
    return out

def build_rankings(records):
    rankings={'meta':{'dataset':'market_base_rice_rankings','version':'v101_auto_update_implemented','created_at':CREATED_AT,'source_primary':'FAOSTAT','ranking_policy':'Generated from market_base_rice_data_CURRENT.json; missing values excluded.'},'rankings':{}}
    for key,cfg in METRICS.items():
        items=[]
        for r in records:
            obj=r.get(key)
            if not isinstance(obj, dict) or obj.get('value') is None: continue
            try: v=float(obj['value'])
            except Exception: continue
            items.append({'entity_id':r.get('entity_id'),'iso3':r.get('iso3'),'name_ja':r.get('name_ja'),'name_en':r.get('name_en'),'value':v,'year':obj.get('year'),'source':obj.get('source'),'unit':obj.get('unit') or cfg['unit']})
        items.sort(key=lambda x: x['value'], reverse=True)
        for i,it in enumerate(items,1): it['rank']=i
        rankings['rankings'][key]={'metric_name_ja':cfg['label'],'unit':cfg['unit'],'items':items}
    return rankings

def main():
    entities=load_json(DATA/'market_base_entities_basic_stats_full196_rc.json')['entities']
    rice_path=DATA/'market_base_rice_data_CURRENT.json'
    rice=load_json(rice_path if rice_path.exists() else DATA/'market_base_rice_data_v2.json')
    by_entity={r['entity_id']: r for r in rice.get('records', [])}
    records=[]
    for e in entities:
        rec=by_entity.get(e['entity_id']) or {'entity_id':e['entity_id']}
        rec.update({'iso3':e.get('iso3'), 'iso2':e.get('iso2'), 'numeric_code':e.get('numeric_code'), 'name_ja':e.get('names',{}).get('ja') or e.get('name_ja'), 'name_en':e.get('names',{}).get('en') or e.get('name_en')})
        records.append(rec)
    rec_by_m49={m49_int(r.get('numeric_code')): r for r in records if m49_int(r.get('numeric_code')) is not None}
    valid_m49=set(rec_by_m49)

    prod_paths=open_csv_candidates(['*Production*Crops*Livestock*Normalized*.csv','*Production*Crops*Livestock*Normalized*.zip','*prod*rice*.csv'])
    fbs_paths=open_csv_candidates(['*FoodBalanceSheets_E_All_Data*Normalized*.csv','*FoodBalanceSheets_E_All_Data*Normalized*.zip','*fbs_rice*.csv'])
    hist_paths=open_csv_candidates(['*FoodBalanceSheetsHistoric*Normalized*.csv','*FoodBalanceSheetsHistoric*Normalized*.zip','*fbshist_rice*.csv'])
    trade_paths=open_csv_candidates(['*Trade*Crops*Livestock*Normalized*.csv','*Trade*CropsLivestock*Normalized*.zip','*trade*rice*.csv'])

    if prod_paths:
        for (m,k), obj in process_production(prod_paths, valid_m49).items(): rec_by_m49[m][k]=obj
    if fbs_paths:
        for (m,k), obj in process_fbs(fbs_paths, valid_m49).items(): rec_by_m49[m][k]=obj
    if hist_paths:
        for (m,k), obj in process_fbs(hist_paths, valid_m49, historic=True).items():
            if not rec_by_m49[m].get(k): rec_by_m49[m][k]=obj
    if trade_paths:
        trade=process_trade(trade_paths, valid_m49)
        for (m,k), obj in trade.items():
            # trade quantities fill gaps or provide more recent direct trade quantity; values are always added.
            if 'value_1000_usd' in k or not rec_by_m49[m].get(k):
                rec_by_m49[m][k]=obj

    coverage={}
    for k in METRICS:
        coverage[k]=sum(1 for r in records if isinstance(r.get(k), dict) and r[k].get('value') is not None)
    for r in records:
        loaded=sum(1 for k in METRICS if isinstance(r.get(k), dict) and r[k].get('value') is not None)
        r['data_status']='loaded_full' if loaded>=10 else ('loaded_partial' if loaded else 'not_loaded')
        r['rice_metric_count']=loaded
        if not loaded:
            r['rice_supply_note']='FAOSTATに一致する最新値なし。Full196枠は維持。'
    rice['records']=records
    rice.setdefault('meta',{}).update({'version':'v101_auto_update_implemented','created_at':CREATED_AT,'core_metrics':list(METRICS),'metric_coverage':coverage,'auto_update_policy':'Generated by scripts/update_faostat_rice_metrics.py from official FAOSTAT bulk files.','ranking_policy':'Rice rankings are generated from this JSON; missing values are excluded.'})
    save_json(DATA/'market_base_rice_data_CURRENT.json', rice)
    save_json(DATA/'market_base_rice_data_v1.json', rice)
    save_json(DATA/'market_base_rice_data_v2.json', rice)
    rankings=build_rankings(records)
    save_json(DATA/'market_base_rice_rankings_CURRENT.json', rankings)
    save_json(DATA/'market_base_rice_rankings_v1.json', rankings)
    save_json(DATA/'market_base_rice_rankings_v2.json', rankings)
    print('[rice] coverage:', coverage)

if __name__ == '__main__':
    main()
