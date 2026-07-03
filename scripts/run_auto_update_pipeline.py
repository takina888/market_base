#!/usr/bin/env python3
"""Run MARKET BASE update pipeline in the intended order.

Default mode uses already available raw/ files. Use --fetch to download official
bulk sources first. This script is safe for local QA and GitHub Actions.
"""
from __future__ import annotations
import argparse, pathlib, subprocess, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]

def run(cmd):
    print('\n[pipeline]', ' '.join(cmd))
    subprocess.check_call([sys.executable if cmd[0].endswith('.py') else cmd[0], *cmd[1:]], cwd=ROOT)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--fetch', action='store_true', help='download official source files before transforming')
    args=ap.parse_args()
    if args.fetch:
        run(['scripts/fetch_official_sources.py'])
    run(['scripts/update_faostat_rice_metrics.py'])
    
    if (ROOT / 'raw' / 'school_meals').exists():
        run(['scripts/validate_school_meals_sources.py'])
    run(['scripts/update_school_meals_metrics.py'])
    run(['scripts/build_rankings.py'])
    run(['scripts/regenerate_embedded_assets.py'])
    run(['scripts/qa_public_data.py'])
    print('\n[pipeline] complete')
if __name__ == '__main__':
    main()
