#!/usr/bin/env python3
"""Assemble a clean public upload folder from the current repository tree.

Usage:
  python scripts/build_public_upload.py --out dist/market_base_upload
"""
from __future__ import annotations
import argparse, pathlib, shutil, json
ROOT=pathlib.Path(__file__).resolve().parents[1]
DEFAULT_ITEMS=['index.html','assets','data','embedded-data.js','embedded-retail-data.js','embedded-retail-presence-data.js','manifest.json','sw.js','version.txt','.nojekyll','docs','scripts','.github']

def copy_item(src, dst):
    if src.is_dir():
        if dst.exists(): shutil.rmtree(dst)
        shutil.copytree(src,dst, ignore=shutil.ignore_patterns('raw','*.part','__pycache__','.DS_Store'))
    elif src.exists():
        dst.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(src,dst)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--out', default='dist/market_base_upload')
    args=ap.parse_args(); out=(ROOT/args.out).resolve()
    if out.exists(): shutil.rmtree(out)
    out.mkdir(parents=True)
    for name in DEFAULT_ITEMS:
        copy_item(ROOT/name, out/name)
    manifest={'file_count':sum(1 for p in out.rglob('*') if p.is_file()),'root_items':DEFAULT_ITEMS,'note':'Upload contents of this folder to GitHub Pages repository root.'}
    (out/'PACKAGE_MANIFEST_BUILT.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2), encoding='utf-8')
    print('[build_public_upload]', out, manifest)
if __name__=='__main__': main()
