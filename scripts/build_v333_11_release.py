#!/usr/bin/env python3
"""Build the cumulative V333.11 full and V333.8-overwrite packages."""

from __future__ import annotations

import hashlib
import json
import shutil
import tempfile
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parents[1]
OUTPUT = WORKSPACE / "outputs" / "final"
BASELINE_ZIP = OUTPUT / "MARKET_BASE_V333_8_FULL_HANDOFF_AND_DATA_20260803.zip"
FULL_ZIP = OUTPUT / "MARKET_BASE_V333_11_FULL_HANDOFF_AND_DATA_20260803.zip"
OVERWRITE_ZIP = OUTPUT / "MARKET_BASE_V333_11_OVERWRITE_FROM_V333_8_20260803.zip"
REPORT = ROOT / "HANDOFF_DOCUMENTS" / "V333_11_CHANGED_FILES_FROM_V333_8_20260803.txt"
EXCLUDED_PARTS = {"__pycache__", ".git", ".agents", ".codex"}
EXCLUDED_SUFFIXES = {".pyc", ".pyo"}


def public_files(base: Path) -> dict[str, Path]:
    result: dict[str, Path] = {}
    for path in base.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(base)
        if any(part in EXCLUDED_PARTS for part in relative.parts):
            continue
        if path.suffix in EXCLUDED_SUFFIXES:
            continue
        result[relative.as_posix()] = path
    return result


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def make_zip(target: Path, files: dict[str, Path], selected: list[str]) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        target.unlink()
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for relative in sorted(selected):
            archive.write(files[relative], relative)


def main() -> None:
    if not BASELINE_ZIP.exists():
        raise FileNotFoundError(BASELINE_ZIP)

    with tempfile.TemporaryDirectory(prefix="market-base-v33311-") as temporary:
        base_root = Path(temporary) / "v333_8"
        base_root.mkdir()
        with zipfile.ZipFile(BASELINE_ZIP) as archive:
            archive.extractall(base_root)

        current = public_files(ROOT)
        baseline = public_files(base_root)
        changed = [
            relative
            for relative, path in current.items()
            if relative not in baseline or digest(path) != digest(baseline[relative])
        ]
        deleted = sorted(set(baseline) - set(current))
        if deleted:
            raise RuntimeError("Unexpected deleted files relative to V333.8: " + ", ".join(deleted[:20]))

        report_relative = REPORT.relative_to(ROOT).as_posix()
        changed = sorted(set(changed) | {report_relative})
        report_lines = [
            "MARKET BASE V333.11 cumulative changed files from public V333.8",
            f"changed_or_added={len(changed)}",
            "deleted=0",
            "",
            *changed,
            "",
        ]
        REPORT.write_text("\n".join(report_lines), encoding="utf-8")

        # Re-read because the report itself must be included in both packages.
        current = public_files(ROOT)
        make_zip(FULL_ZIP, current, list(current))
        make_zip(OVERWRITE_ZIP, current, changed)

        # Validate that overwriting V333.8 recreates every current file exactly.
        applied = Path(temporary) / "applied"
        shutil.copytree(base_root, applied)
        with zipfile.ZipFile(OVERWRITE_ZIP) as archive:
            archive.extractall(applied)
        applied_files = public_files(applied)
        mismatches = [
            relative
            for relative, path in current.items()
            if relative not in applied_files or digest(path) != digest(applied_files[relative])
        ]
        if mismatches:
            raise RuntimeError("Overwrite validation failed: " + ", ".join(mismatches[:20]))

    print(
        json.dumps(
            {
                "full": str(FULL_ZIP),
                "overwrite": str(OVERWRITE_ZIP),
                "changed_or_added": len(set(changed)),
                "deleted": 0,
                "validation": "PASS",
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
