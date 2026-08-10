#!/usr/bin/env python3
"""Build and verify MARKET BASE V333.18 delivery archives.

The overwrite archive is calculated from the exact public V333.10 full ZIP,
then applied to that baseline and byte-compared with the full V333.18 tree.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import tempfile
import zipfile
from pathlib import Path, PurePosixPath


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parents[1]
DATE = "20260810"
BASELINE_ZIP = (
    WORKSPACE
    / "work/library_v333_10/MARKET_BASE_V333_10_FULL_HANDOFF_AND_DATA_20260803.zip"
)
BASELINE_SHA256 = "3e58f5475d941ffa0339b3ae23e777804b192bdf5f76319a58cbba1caeb53ced"
FULL_ZIP = WORKSPACE / f"MARKET_BASE_V333_18_FULL_HANDOFF_AND_DATA_{DATE}.zip"
OVERWRITE_ZIP = WORKSPACE / f"MARKET_BASE_V333_18_OVERWRITE_FROM_V333_10_{DATE}.zip"
CHECKSUMS = WORKSPACE / f"MARKET_BASE_V333_18_SHA256SUMS_{DATE}.txt"
REPORT = ROOT / "HANDOFF_DOCUMENTS/V333_18_CHANGED_FILES_FROM_V333_10_20260810.txt"

EXCLUDED_PARTS = {"__pycache__", ".git", ".agents", ".codex", "__MACOSX"}
EXCLUDED_SUFFIXES = {".pyc", ".pyo"}


def public_files(base: Path) -> dict[str, Path]:
    result: dict[str, Path] = {}
    for path in base.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(base)
        if any(part in EXCLUDED_PARTS for part in relative.parts):
            continue
        if path.suffix.lower() in EXCLUDED_SUFFIXES or path.name == ".DS_Store":
            continue
        result[relative.as_posix()] = path
    return result


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


def safe_extract(archive: zipfile.ZipFile, destination: Path) -> None:
    seen: set[str] = set()
    for info in archive.infolist():
        name = info.filename.replace("\\", "/")
        parts = PurePosixPath(name).parts
        if not name or name in seen or name.startswith("/") or ".." in parts:
            raise RuntimeError(f"Unsafe or duplicate ZIP entry: {name!r}")
        seen.add(name)
        unix_mode = (info.external_attr >> 16) & 0o170000
        if unix_mode == 0o120000:
            raise RuntimeError(f"Symlink ZIP entry is not allowed: {name!r}")
    archive.extractall(destination)


def make_zip(target: Path, files: dict[str, Path], selected: list[str]) -> None:
    # The conversation workspace may observe user-facing files as soon as they
    # appear. Build under a non-deliverable name, validate it, then publish it
    # with one atomic rename so no consumer can see a ZIP without its central
    # directory.
    staging = target.with_name(f".{target.name}.building")
    if staging.exists():
        staging.unlink()
    with zipfile.ZipFile(
        staging,
        "w",
        compression=zipfile.ZIP_DEFLATED,
        compresslevel=9,
        allowZip64=True,
    ) as archive:
        for relative in sorted(selected):
            archive.write(files[relative], relative)
    with zipfile.ZipFile(staging) as archive:
        bad_entry = archive.testzip()
        if bad_entry:
            raise RuntimeError(f"CRC failure in {target.name}: {bad_entry}")
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise RuntimeError(f"Duplicate ZIP entries in {target.name}")
    staging.replace(target)


def compare_trees(expected: dict[str, Path], actual: dict[str, Path]) -> list[str]:
    problems: list[str] = []
    for relative in sorted(set(expected) | set(actual)):
        if relative not in expected:
            problems.append(f"extra:{relative}")
        elif relative not in actual:
            problems.append(f"missing:{relative}")
        elif digest(expected[relative]) != digest(actual[relative]):
            problems.append(f"hash:{relative}")
    return problems


def main() -> None:
    if not BASELINE_ZIP.is_file():
        raise FileNotFoundError(BASELINE_ZIP)
    if digest(BASELINE_ZIP) != BASELINE_SHA256:
        raise RuntimeError("The V333.10 baseline ZIP does not match the Library master SHA-256")

    with tempfile.TemporaryDirectory(prefix="market-base-v33318-") as temporary:
        temporary_root = Path(temporary)
        baseline_root = temporary_root / "v333_10"
        baseline_root.mkdir()
        with zipfile.ZipFile(BASELINE_ZIP) as archive:
            safe_extract(archive, baseline_root)

        current = public_files(ROOT)
        baseline = public_files(baseline_root)
        deleted = sorted(set(baseline) - set(current))
        if deleted:
            raise RuntimeError(
                "Overwrite ZIP cannot remove V333.10 files: " + ", ".join(deleted[:20])
            )

        changed = sorted(
            relative
            for relative, path in current.items()
            if relative not in baseline or digest(path) != digest(baseline[relative])
        )
        report_relative = REPORT.relative_to(ROOT).as_posix()
        changed = sorted(set(changed) | {report_relative})
        REPORT.parent.mkdir(parents=True, exist_ok=True)
        REPORT.write_text(
            "\n".join(
                [
                    "MARKET BASE V333.18 cumulative changed files from public V333.10",
                    f"baseline_sha256={BASELINE_SHA256}",
                    f"changed_or_added={len(changed)}",
                    "deleted=0",
                    "",
                    *changed,
                    "",
                ]
            ),
            encoding="utf-8",
        )

        current = public_files(ROOT)
        changed = sorted(set(changed) | {report_relative})
        make_zip(FULL_ZIP, current, list(current))
        make_zip(OVERWRITE_ZIP, current, changed)

        applied_root = temporary_root / "applied"
        shutil.copytree(baseline_root, applied_root)
        with zipfile.ZipFile(OVERWRITE_ZIP) as archive:
            safe_extract(archive, applied_root)
        problems = compare_trees(current, public_files(applied_root))
        if problems:
            raise RuntimeError("V333.10 overwrite validation failed: " + ", ".join(problems[:20]))

        with zipfile.ZipFile(FULL_ZIP) as archive:
            full_root = temporary_root / "full"
            full_root.mkdir()
            safe_extract(archive, full_root)
        problems = compare_trees(current, public_files(full_root))
        if problems:
            raise RuntimeError("Full ZIP validation failed: " + ", ".join(problems[:20]))

    checksum_lines = [
        f"{digest(FULL_ZIP)}  {FULL_ZIP.name}",
        f"{digest(OVERWRITE_ZIP)}  {OVERWRITE_ZIP.name}",
    ]
    CHECKSUMS.write_text("\n".join(checksum_lines) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "full": str(FULL_ZIP),
                "overwrite": str(OVERWRITE_ZIP),
                "checksums": str(CHECKSUMS),
                "full_files": len(current),
                "changed_or_added": len(changed),
                "deleted": 0,
                "v333_10_overwrite_equals_full": True,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
