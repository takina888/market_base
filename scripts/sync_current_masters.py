#!/usr/bin/env python3
"""Synchronize canonical CURRENT data files to compatibility filenames.

Rule: edit only *_CURRENT.json masters. This script copies CURRENT masters to legacy
v1/v2/v94 filenames still used by the public app or older scripts.
"""
from __future__ import annotations
import pathlib, shutil, hashlib, sys, json
ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
COPY_MAP = [
    ('market_base_rice_data_CURRENT.json', 'market_base_rice_data_v1.json'),
    ('market_base_rice_data_CURRENT.json', 'market_base_rice_data_v2.json'),
    ('market_base_rice_rankings_CURRENT.json', 'market_base_rice_rankings_v1.json'),
    ('market_base_rice_rankings_CURRENT.json', 'market_base_rice_rankings_v2.json'),
    ('market_base_school_meals_data_CURRENT.json', 'market_base_school_meals_data_v1.json'),
    ('market_base_school_meals_data_CURRENT.json', 'market_base_school_meals_data_v94.json'),
    ('market_base_school_meals_rankings_CURRENT.json', 'market_base_school_meals_rankings_v1.json'),
]
def sha(p: pathlib.Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()
def main() -> None:
    for src_name, dst_name in COPY_MAP:
        src, dst = DATA / src_name, DATA / dst_name
        if not src.exists():
            raise SystemExit(f'[sync FAIL] missing CURRENT master: {src_name}')
        shutil.copy2(src, dst)
        if sha(src) != sha(dst):
            raise SystemExit(f'[sync FAIL] hash mismatch: {src_name} -> {dst_name}')
        print(f'[sync] {src_name} -> {dst_name}')
if __name__ == '__main__':
    main()
