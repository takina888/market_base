#!/usr/bin/env python3
"""Regenerate embedded fallback JS from current data JSON files.

The public app normally fetches data/*.json. These embedded files are a fallback for
path/caching/CORS trouble and must be kept synchronized after every data update.
"""
from __future__ import annotations
import json, pathlib, datetime
ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
CREATED_AT = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'

def load(name, default=None):
    p = DATA / name
    if not p.exists():
        return default
    return json.load(open(p, encoding='utf-8'))

def write_js(path: pathlib.Path, var_name: str, obj) -> None:
    path.write_text(f"window.{var_name} = " + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ";\n", encoding='utf-8')
    print('[embed]', path.name, path.stat().st_size)

def main() -> None:
    embedded = {
        'meta': {'generated_at': CREATED_AT, 'generator': 'scripts/regenerate_embedded_assets.py'},
        'entities': load('market_base_entities_basic_stats_full196_rc.json', {'entities': []}),
        'rankings': load('market_base_rankings_basic_stats_full196_rc.json', {'rankings': {}}),
        'rice_data': load('market_base_rice_data_CURRENT.json') or load('market_base_rice_data_v2.json') or load('market_base_rice_data_v1.json'),
        'rice_rankings': load('market_base_rice_rankings_CURRENT.json') or load('market_base_rice_rankings_v2.json') or load('market_base_rice_rankings_v1.json'),
        'school_meals_data': load('market_base_school_meals_data_CURRENT.json') or load('market_base_school_meals_data_v1.json') or load('market_base_school_meals_data_v94.json'),
        'school_meals_rankings': load('market_base_school_meals_rankings_CURRENT.json') or load('market_base_school_meals_rankings_v1.json'),
        'priority4_ready': load('market_base_priority4_ready_staging_v92.json'),
        'wdi_country_metadata': load('market_base_wdi_country_metadata_v1.json'),
        'japan_related_data': load('market_base_japan_related_data_v1.json'),
        'japan_related_rankings': load('market_base_japan_related_rankings_v1.json'),
        'japanese_restaurants_overview': load('market_base_japanese_restaurants_overview_v1.json'),
        'overseas_japanese_residents_overview': load('market_base_overseas_japanese_residents_overview_v1.json'),
    }
    write_js(ROOT / 'embedded-data.js', 'MARKET_BASE_EMBEDDED_DATA', embedded)
    retail = load('market_base_retail_channels_full196_rc.json', {'records': []})
    presence = (load('market_base_retail_presence_master_CURRENT.json') or {'entities': []})
    write_js(ROOT / 'embedded-retail-data.js', 'MARKET_BASE_RETAIL_DATA', {'meta': {'generated_at': CREATED_AT}, 'retail': retail})
    write_js(ROOT / 'embedded-retail-presence-data.js', 'MARKET_BASE_RETAIL_PRESENCE_DATA', {'meta': {'generated_at': CREATED_AT}, 'retail_presence': presence})

if __name__ == '__main__':
    main()
