#!/usr/bin/env python3
"""QA runner for MARKET BASE public data and auto-update outputs."""
from __future__ import annotations
import json, pathlib, sys, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data'

def load(p): return json.load(open(p, encoding='utf-8'))
def fail(msg): print('[QA FAIL]', msg, file=sys.stderr); raise SystemExit(1)
def warn(msg): print('[QA WARN]', msg)
def ok(msg): print('[QA PASS]', msg)
def count(records, key): return sum(1 for r in records if isinstance(r.get(key), dict) and r[key].get('value') is not None)

def main():
    entities_obj=load(DATA/'market_base_entities_basic_stats_full196_rc.json')
    entities=entities_obj['entities']
    if len(entities)!=196: fail(f'Full196 broken: {len(entities)}')
    ids={e['entity_id'] for e in entities}
    iso3={e.get('iso3') for e in entities}
    for code in ['TW','HK','MO','JP']:
        if code not in ids: fail(f'missing required entity {code}')
    ok('Full196 and TW/HK/MO/JP')

    rice=load(DATA/'market_base_rice_data_CURRENT.json')
    if len(rice.get('records',[]))!=196: fail('rice records must be 196')
    rr=load(DATA/'market_base_rice_rankings_CURRENT.json')
    if len(rr.get('rankings',{}))<15: fail('rice rankings too few')
    prod=count(rice['records'],'rice_production_paddy_tonnes')
    imports=count(rice['records'],'rice_import_quantity_tonnes')
    food=count(rice['records'],'rice_food_supply_kg_capita_year')
    if prod<100: warn(f'rice production coverage low: {prod}')
    if imports<150: warn(f'rice import coverage low: {imports}')
    if food<150: warn(f'rice food supply coverage low: {food}')
    ok(f'rice data records=196 production={prod} import={imports} food_supply={food}')

    school=load(DATA/'market_base_school_meals_data_CURRENT.json')
    if len(school.get('records',[]))!=196: fail('school meal records must be 196')
    sr=load(DATA/'market_base_school_meals_rankings_CURRENT.json')
    if len(sr.get('rankings',{}))<4: fail('school rankings too few')
    sm=count(school['records'],'school_meals_total_children')
    if sm<100: warn(f'school meals coverage low: {sm}')
    
    # V103 hardened school-meals checks: keep Full196, rankings, source manifest and coverage report aligned.
    cov_path=DATA/'market_base_school_meals_coverage_report_v103.json'
    src_path=DATA/'market_base_school_meals_source_manifest_v103.json'
    if cov_path.exists():
        cov=load(cov_path)
        cov_sm=cov.get('metric_coverage',{}).get('school_meals_total_children',0)
        if cov_sm != sm: fail(f'school coverage report mismatch: {cov_sm} != {sm}')
        if cov.get('country_status_counts',{}).get('not_loaded',0) > 20: warn('many countries have no school-meals metrics')
    else:
        warn('missing V103 school-meals coverage report')
    if src_path.exists():
        src=load(src_path)
        if len(src.get('sources',[])) < 4: warn('school-meals source manifest has fewer than 4 source files')
    else:
        warn('missing V103 school-meals source manifest')
    ok(f'school meals records=196 target_children={sm}')

    retail=load(DATA/'market_base_retail_presence_master_CURRENT.json')
    # Accept either list-style or entities-style retail presence.
    retail_records=[]
    if isinstance(retail.get('records'), list): retail_records=retail['records']
    elif isinstance(retail.get('entities'), list):
        for ent in retail['entities']:
            for rec in ent.get('chains') or ent.get('chain_presence') or []:
                rec=dict(rec); rec.setdefault('entity_id', ent.get('entity_id')); retail_records.append(rec)
    if len(retail_records)<200: warn(f'retail presence looks small after GMS/convenience additions: {len(retail_records)}')
    else: ok(f'retail presence records={len(retail_records)}')

    for dataset, rank_obj in [('rice', rr), ('school', sr)]:
        for metric, block in rank_obj.get('rankings',{}).items():
            for item in block.get('items',[]):
                if item.get('entity_id') not in ids: fail(f'{dataset} ranking {metric} has unknown entity {item.get("entity_id")}')
    ok('ranking entity IDs synchronized')


    # V113 master unification checks: CURRENT files must exist and match compatibility copies.
    import hashlib
    def file_sha(name):
        return hashlib.sha256((DATA/name).read_bytes()).hexdigest()
    sync_pairs=[
        ('market_base_rice_data_CURRENT.json','market_base_rice_data_v1.json'),
        ('market_base_rice_data_CURRENT.json','market_base_rice_data_v2.json'),
        ('market_base_rice_rankings_CURRENT.json','market_base_rice_rankings_v1.json'),
        ('market_base_rice_rankings_CURRENT.json','market_base_rice_rankings_v2.json'),
        ('market_base_school_meals_data_CURRENT.json','market_base_school_meals_data_v1.json'),
        ('market_base_school_meals_data_CURRENT.json','market_base_school_meals_data_v94.json'),
        ('market_base_school_meals_rankings_CURRENT.json','market_base_school_meals_rankings_v1.json'),
    ]
    for cur, compat in sync_pairs:
        if not (DATA/cur).exists(): fail(f'missing CURRENT master {cur}')
        if not (DATA/compat).exists(): fail(f'missing compatibility file {compat}')
        if file_sha(cur) != file_sha(compat): fail(f'CURRENT/compat mismatch: {cur} != {compat}')
    if not (DATA/'market_base_data_master_map_CURRENT.json').exists(): fail('missing data master map')
    ok('CURRENT masters synchronized with compatibility files')

    # Embedded fallback sync: these files must exist and contain the generated variables.
    checks=[('embedded-data.js','MARKET_BASE_EMBEDDED_DATA'),('embedded-retail-data.js','MARKET_BASE_RETAIL_DATA'),('embedded-retail-presence-data.js','MARKET_BASE_RETAIL_PRESENCE_DATA')]
    for name,var in checks:
        p=ROOT/name
        if not p.exists(): fail(f'missing embedded fallback {name}')
        txt=p.read_text(encoding='utf-8', errors='ignore')[:200]
        if var not in txt: fail(f'{name} does not define {var}')
    ok('embedded fallback files present')

    # No placeholder implementation text in scripts.
    for p in (ROOT/'scripts').glob('*.py'):
        if p.name == 'qa_public_data.py':
            continue
        txt=p.read_text(encoding='utf-8', errors='ignore')
        bad_markers=['placeholder is kept intentionally', 'See V95 package build script for full transformation logic']
        if any(marker in txt for marker in bad_markers): fail(f'placeholder text remains in {p.name}')
    ok('no known placeholder implementation text remains')

if __name__=='__main__': main()
