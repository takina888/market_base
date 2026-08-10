#!/usr/bin/env python3
"""Embed the canonical v074 UL/CE JSON into the standalone learning page."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "ulce-data-v074.json"
HTML_PATH = ROOT / "ul-ce-learning" / "index.html"


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    compact = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    html = HTML_PATH.read_text(encoding="utf-8")
    pattern = re.compile(
        r"window\.MARKET_BASE_ULCE_DATA=\{.*?\};(?=\s*</script>)",
        re.S,
    )
    replacement = "window.MARKET_BASE_ULCE_DATA=" + compact + ";"
    updated, count = pattern.subn(lambda _: replacement, html, count=1)
    if count != 1:
        raise RuntimeError(f"Expected one embedded data block, replaced {count}")
    HTML_PATH.write_text(updated, encoding="utf-8")
    print(
        json.dumps(
            {
                "status": "ok",
                "version": data["version"],
                "qaCount": len(data["qas"]),
                "html": str(HTML_PATH),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
