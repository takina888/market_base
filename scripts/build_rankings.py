#!/usr/bin/env python3
"""Regenerate derived rankings from current generated data JSON files.

This keeps detail pages and ranking pages synchronized. Do not hand-edit ranking JSON.
"""
from __future__ import annotations
import json, pathlib, datetime
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
CREATED_AT=datetime.date.today().isoformat()

def load(p): return json.load(open(p, encoding='utf-8'))
def save(p,o):
    with open(p,'w',encoding='utf-8') as f: json.dump(o,f,ensure_ascii=False,indent=2)

RICE_METRICS={
 'rice_production_paddy_tonnes':('米生産量','t'), 'rice_area_harvested_ha':('米収穫面積','ha'), 'rice_yield_kg_per_ha':('米単収','kg/ha'),
 'rice_import_quantity_tonnes':('米輸入量','t'), 'rice_export_quantity_tonnes':('米輸出量','t'), 'rice_import_value_1000_usd':('米輸入額','1000 USD'), 'rice_export_value_1000_usd':('米輸出額','1000 USD'),
 'rice_domestic_supply_tonnes':('国内供給量','t'), 'rice_food_use_tonnes':('食品用途量','t'), 'rice_feed_use_tonnes':('飼料用途量','t'), 'rice_processing_use_tonnes':('加工用途量','t'), 'rice_seed_use_tonnes':('種子用途量','t'), 'rice_losses_tonnes':('損失量','t'), 'rice_stock_variation_tonnes':('在庫変動量','t'), 'rice_other_uses_tonnes':('その他用途量','t'),
 'rice_food_supply_kg_capita_year':('1人当たり米供給量','kg/capita/year'), 'rice_kcal_supply_capita_day':('1人当たりカロリー供給','kcal/capita/day'), 'rice_protein_supply_g_capita_day':('1人当たりタンパク質供給','g/capita/day'), 'rice_fat_supply_g_capita_day':('1人当たり脂質供給','g/capita/day')}
SCHOOL_METRICS={'school_meals_total_children':('学校給食対象児童数','children'),'primary_enrollment_children':('小学校就学者数','children'),'pre_primary_enrollment_children':('就学前教育在籍者数','children'),'school_meal_menu_gdqs_score':('メニュー品質スコア','score'),'school_meal_children_per_primary_enrollment_pct':('学校給食対象児童数 / 小学校就学者数','%')}

def make_rankings(records, metrics, dataset, version):
    out={'meta':{'dataset':dataset,'version':version,'created_at':CREATED_AT,'ranking_policy':'Generated from country-level JSON; missing values excluded.'},'rankings':{}}
    for key,(label,unit) in metrics.items():
        items=[]
        for r in records:
            obj=r.get(key)
            if not isinstance(obj, dict) or obj.get('value') is None: continue
            try: v=float(obj['value'])
            except Exception: continue
            items.append({'entity_id':r.get('entity_id'),'iso3':r.get('iso3'),'name_ja':r.get('name_ja'),'name_en':r.get('name_en'),'value':v,'year':obj.get('year'),'source':obj.get('source'),'unit':obj.get('unit') or unit})
        items.sort(key=lambda x:x['value'], reverse=True)
        for i,it in enumerate(items,1): it['rank']=i
        out['rankings'][key]={'metric_name_ja':label,'unit':unit,'items':items}
    return out

def main():
    rice=load(DATA/'market_base_rice_data_CURRENT.json')
    rr=make_rankings(rice['records'], RICE_METRICS, 'market_base_rice_rankings','v101_auto_update_implemented')
    save(DATA/'market_base_rice_rankings_CURRENT.json',rr); save(DATA/'market_base_rice_rankings_v1.json',rr); save(DATA/'market_base_rice_rankings_v2.json',rr)
    school=load(DATA/'market_base_school_meals_data_CURRENT.json')
    sr=make_rankings(school['records'], SCHOOL_METRICS, 'market_base_school_meals_rankings','v101_auto_update_implemented')
    save(DATA/'market_base_school_meals_rankings_CURRENT.json',sr); save(DATA/'market_base_school_meals_rankings_v1.json',sr)
    print('[rankings] rice metrics', len(rr['rankings']), 'school metrics', len(sr['rankings']))
if __name__=='__main__': main()
