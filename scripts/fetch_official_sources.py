#!/usr/bin/env python3
"""Fetch official source files for MARKET BASE semiannual updates.

This is intentionally separated from the public app. GitHub Pages reads static JSON;
this script downloads official bulk files into raw/ for transform scripts.
"""
from __future__ import annotations
import json, pathlib, time, urllib.request, urllib.error, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
URLS = json.load(open(pathlib.Path(__file__).with_name("source_urls.json"), encoding="utf-8"))

HEADERS = {"User-Agent": "MARKET-BASE-data-updater/1.0"}

def download(url: str, dest: pathlib.Path, retries: int = 3) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    for attempt in range(1, retries + 1):
        try:
            print(f"[fetch] {url} -> {dest}")
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=180) as r, open(tmp, "wb") as f:
                while True:
                    chunk = r.read(1024 * 1024)
                    if not chunk:
                        break
                    f.write(chunk)
            tmp.replace(dest)
            print(f"[fetch] done: {dest} ({dest.stat().st_size:,} bytes)")
            return
        except Exception as e:
            print(f"[fetch] attempt {attempt}/{retries} failed: {e}", file=sys.stderr)
            if tmp.exists():
                tmp.unlink()
            if attempt == retries:
                raise
            time.sleep(5 * attempt)

def main() -> None:
    for key, url in URLS.get("faostat", {}).items():
        if not isinstance(url, str) or not url.startswith("http"):
            continue
        download(url, RAW / "faostat" / pathlib.Path(url).name)
        time.sleep(1)
    for key, url in URLS.get("wdi", {}).items():
        if not isinstance(url, str) or not url.startswith("http"):
            continue
        download(url, RAW / "wdi" / pathlib.Path(url).name)

if __name__ == "__main__":
    main()
