#!/usr/bin/env python3
"""V333.11 UL Q&A plain-language and workflow regression checks."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "ulce-data-v073.json"
HTML_PATH = ROOT / "ul-ce-learning" / "index.html"
FEATURED_IDS = [
    "QA-INT-001",
    "QA-INT-002",
    "QA-COM-006",
    "QA-COM-009",
    "QA-COM-008",
    "QA-INT-019",
    "QA-INT-011",
    "QA-COM-010",
]
STAGES = {"judge", "estimate", "design", "apply", "produce", "install"}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    html = HTML_PATH.read_text(encoding="utf-8")
    qas = data["qas"]
    by_id = {qa["id"]: qa for qa in qas}

    require(data["version"].startswith("v073"), "data version is not v073")
    require(len(qas) == data["summary"]["qaCount"], "summary Q&A count mismatch")
    require(len(qas) >= 303, "new high-value questions were not added")
    require(len(by_id) == len(qas), "duplicate Q&A IDs")

    featured = sorted(
        (qa for qa in qas if qa.get("featured")),
        key=lambda qa: int(qa.get("priority", 9999)),
    )
    require([qa["id"] for qa in featured] == FEATURED_IDS, "featured 8 order mismatch")

    starters = [qa for qa in qas if qa.get("starter")]
    require(len(starters) >= 30, "too few rewritten starter questions")
    for qa in starters:
        require(qa.get("stage") in STAGES, f"invalid stage: {qa['id']}")
        require(qa.get("why"), f"missing why: {qa['id']}")
        require(qa.get("actionLabel"), f"missing action label: {qa['id']}")
        require(len(qa.get("actionItems", [])) >= 2, f"weak actions: {qa['id']}")
        require(qa.get("audience"), f"missing audience: {qa['id']}")

    require("Conditions of Acceptabilityも確認します" not in by_id["QA-COM-006"]["action"], "old unexplained CoA action remains")
    require("組込み時の使用条件" in " ".join(by_id["QA-COM-006"].get("plainTerms", [])), "CoA plain-language definition missing")
    require("UL対応" in by_id["QA-INT-001"]["question"], "customer UL request is not the first question")
    require("利用可能短絡電流" in json.dumps(by_id["QA-INT-007"], ensure_ascii=False), "AFC-to-SCCR flow not corrected")

    require("まず見る8問" in html, "featured entry UI missing")
    require("専門Q&A（全件）" in html, "full expert Q&A access missing")
    require("実務で行うこと：" not in html, "fixed internal action label remains")
    require("なぜ大事？" in html and "ここまで決まれば次へ" in html, "new card explanation blocks missing")
    require(html.count("data-cf-beacon") == 1, "Cloudflare analytics block changed on UL page")

    match = re.search(r"window\.MARKET_BASE_ULCE_DATA=(\{.*?\});\s*</script>", html, re.S)
    require(match is not None, "embedded Q&A data not found")
    embedded = json.loads(match.group(1))
    require(embedded == data, "embedded data differs from v073 JSON")

    print(
        json.dumps(
            {
                "version": data["version"],
                "qaCount": len(qas),
                "featured": len(featured),
                "starter": len(starters),
                "stages": {stage: sum(1 for qa in starters if qa["stage"] == stage) for stage in sorted(STAGES)},
                "result": "PASS",
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
