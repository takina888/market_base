#!/usr/bin/env python3
"""Independent V333.10 -> V333.18 cumulative-delivery contract.

The source/baseline checks always run. Archive checks activate automatically
once the conventional V333.18 full and/or V333.10 overwrite ZIPs exist beside
the ``work`` directory, so the same command is useful before and after packing.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import zipfile
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlparse


TARGET = Path(__file__).resolve().parents[1]
WORK = TARGET.parent
WORKSPACE = WORK.parent
BASELINE_SOURCE = WORK / "V333_10_source"
BASELINE_ZIP = (
    WORK
    / "library_v333_10"
    / "MARKET_BASE_V333_10_FULL_HANDOFF_AND_DATA_20260803.zip"
)
BASELINE_ZIP_SHA256 = (
    "3e58f5475d941ffa0339b3ae23e777804b192bdf5f76319a58cbba1caeb53ced"
)
FULL_ZIP = WORKSPACE / "MARKET_BASE_V333_18_FULL_HANDOFF_AND_DATA_20260810.zip"
OVERWRITE_ZIP = (
    WORKSPACE / "MARKET_BASE_V333_18_OVERWRITE_FROM_V333_10_20260810.zip"
)
CHECKSUMS = WORKSPACE / "MARKET_BASE_V333_18_SHA256SUMS_20260810.txt"

EXCLUDED_DIRS = {".git", ".agents", ".codex", "__MACOSX", "__pycache__"}
EXCLUDED_SUFFIXES = {".pyc", ".pyo"}
EXPECTED_PUBLIC_HTML = 38
CONTROLLER_RE = re.compile(r"market-base-update-controller-v(\d+)\.js$")


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def is_excluded(relative: PurePosixPath) -> bool:
    return (
        any(part in EXCLUDED_DIRS for part in relative.parts)
        or relative.suffix.lower() in EXCLUDED_SUFFIXES
        or relative.name == ".DS_Store"
    )


def tree_manifest(base: Path) -> tuple[dict[str, str], list[str], list[str]]:
    """Return package-visible SHA manifest, unsafe symlinks, ignored artifacts."""

    manifest: dict[str, str] = {}
    symlinks: list[str] = []
    ignored: list[str] = []
    for directory, dirnames, filenames in os.walk(base, followlinks=False):
        current = Path(directory)
        kept_dirs: list[str] = []
        for name in dirnames:
            path = current / name
            relative = PurePosixPath(path.relative_to(base).as_posix())
            if path.is_symlink():
                symlinks.append(relative.as_posix())
                continue
            if is_excluded(relative):
                ignored.append(relative.as_posix() + "/")
                continue
            kept_dirs.append(name)
        dirnames[:] = kept_dirs
        for name in filenames:
            path = current / name
            relative = PurePosixPath(path.relative_to(base).as_posix())
            if path.is_symlink():
                symlinks.append(relative.as_posix())
                continue
            if is_excluded(relative):
                ignored.append(relative.as_posix())
                continue
            manifest[relative.as_posix()] = sha256_path(path)
    return manifest, sorted(symlinks), sorted(ignored)


def normalized_zip_name(raw_name: str) -> tuple[str | None, str | None]:
    if not raw_name:
        return None, "empty ZIP name"
    if "\\" in raw_name:
        return None, f"backslash ZIP path: {raw_name!r}"
    if raw_name.startswith(("/", "\\")) or re.match(r"^[A-Za-z]:", raw_name):
        return None, f"absolute ZIP path: {raw_name!r}"
    raw_parts = PurePosixPath(raw_name).parts
    if ".." in raw_parts:
        return None, f"ZIP traversal: {raw_name!r}"
    parts = [part for part in raw_parts if part not in ("", ".", "/")]
    if not parts:
        return None, f"empty normalized ZIP path: {raw_name!r}"
    return PurePosixPath(*parts).as_posix(), None


def audit_zip(path: Path) -> tuple[dict[str, str], list[str]]:
    """Audit path safety and return a SHA manifest for regular file entries."""

    manifest: dict[str, str] = {}
    problems: list[str] = []
    seen: set[str] = set()
    try:
        with zipfile.ZipFile(path) as archive:
            for info in archive.infolist():
                normalized, error = normalized_zip_name(info.filename)
                if error:
                    problems.append(error)
                    continue
                assert normalized is not None
                if normalized in seen:
                    problems.append(f"duplicate ZIP entry: {normalized}")
                    continue
                seen.add(normalized)
                relative = PurePosixPath(normalized)
                if is_excluded(relative):
                    problems.append(f"forbidden generated artifact: {normalized}")
                unix_mode = (info.external_attr >> 16) & 0xFFFF
                if stat.S_ISLNK(unix_mode):
                    problems.append(f"symlink ZIP entry: {normalized}")
                    continue
                if info.flag_bits & 0x1:
                    problems.append(f"encrypted ZIP entry: {normalized}")
                    continue
                if info.is_dir():
                    continue
                try:
                    manifest[normalized] = sha256_bytes(archive.read(info))
                except Exception as error_reading:  # CRC/decompression included
                    problems.append(f"unreadable ZIP entry {normalized}: {error_reading}")
            bad_crc = archive.testzip()
            if bad_crc:
                problems.append(f"bad ZIP CRC: {bad_crc}")
    except (OSError, zipfile.BadZipFile) as error:
        problems.append(f"cannot open ZIP: {error}")
    return manifest, problems


def apply_overwrite_zip(path: Path, destination: Path) -> None:
    """Extract an already-audited overwrite without using extractall()."""

    destination_resolved = destination.resolve()
    with zipfile.ZipFile(path) as archive:
        for info in archive.infolist():
            normalized, error = normalized_zip_name(info.filename)
            if error or normalized is None or info.is_dir():
                continue
            target = destination / Path(*PurePosixPath(normalized).parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            resolved = target.resolve()
            if not resolved.is_relative_to(destination_resolved):
                raise RuntimeError(f"overwrite escaped destination: {normalized}")
            with archive.open(info) as source, target.open("wb") as output:
                shutil.copyfileobj(source, output)


class LocalReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.urls: list[tuple[str, str]] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        values = {str(key).lower(): value or "" for key, value in attrs}
        for attribute in ("src", "href", "poster", "action"):
            if values.get(attribute):
                self.urls.append((f"{tag}[{attribute}]", values[attribute]))
        if values.get("srcset"):
            for candidate in values["srcset"].split(","):
                url = candidate.strip().split(maxsplit=1)[0]
                if url:
                    self.urls.append((f"{tag}[srcset]", url))


def local_reference_problems(html_files: list[Path]) -> tuple[list[str], int]:
    problems: list[str] = []
    checked = 0
    target_resolved = TARGET.resolve()
    for page in html_files:
        parser = LocalReferenceParser()
        try:
            parser.feed(page.read_text(encoding="utf-8"))
        except (OSError, UnicodeError) as error:
            problems.append(f"{page.relative_to(TARGET)}: unreadable HTML: {error}")
            continue
        for source, raw_url in parser.urls:
            value = raw_url.strip()
            if not value or value.startswith(("#", "//")):
                continue
            parsed = urlparse(value)
            if parsed.scheme or parsed.netloc:
                continue
            local_path = unquote(parsed.path)
            if not local_path:
                continue
            checked += 1
            candidate = (page.parent / local_path).resolve()
            if not candidate.is_relative_to(target_resolved):
                problems.append(
                    f"{page.relative_to(TARGET)}: {source} escapes package: {value!r}"
                )
                continue
            if candidate.is_dir():
                candidate = candidate / "index.html"
            if not candidate.is_file():
                problems.append(
                    f"{page.relative_to(TARGET)}: missing {source} reference {value!r}"
                )
    return problems, checked


def controller_contract(
    baseline_manifest: dict[str, str],
    target_manifest: dict[str, str],
    changed_or_new: set[str],
) -> tuple[list[str], str, list[str]]:
    problems: list[str] = []
    baseline_controllers = sorted(
        relative
        for relative in baseline_manifest
        if CONTROLLER_RE.search(PurePosixPath(relative).name)
        and PurePosixPath(relative).parent.as_posix() == "assets/js"
    )
    target_controllers = sorted(
        relative
        for relative in target_manifest
        if CONTROLLER_RE.search(PurePosixPath(relative).name)
        and PurePosixPath(relative).parent.as_posix() == "assets/js"
    )
    if not target_controllers:
        return ["no update controller found"], "", baseline_controllers
    current = max(
        target_controllers,
        key=lambda relative: int(CONTROLLER_RE.search(relative).group(1)),  # type: ignore[union-attr]
    )
    current_source = (TARGET / current).read_text(encoding="utf-8")
    token_match = re.search(
        r"\bASSET_VERSION\s*=\s*['\"]([^'\"]+)['\"]", current_source
    )
    current_token = token_match.group(1) if token_match else ""
    if not current_token:
        problems.append(f"{current}: ASSET_VERSION not found")

    legacy_controllers = sorted(set(target_controllers) - {current})
    for relative in baseline_controllers:
        if relative not in target_manifest:
            problems.append(f"V333.10 controller missing from target: {relative}")
        elif relative == current:
            problems.append(f"V333.10 controller unexpectedly remains current: {relative}")
    for relative in legacy_controllers:
        source = (TARGET / relative).read_text(encoding="utf-8")
        if current not in source:
            problems.append(f"{relative}: does not route to {current}")
        if "createElement('script')" not in source and 'createElement("script")' not in source:
            problems.append(f"{relative}: compatibility script injection is missing")
        if "appendChild(script)" not in source:
            problems.append(f"{relative}: compatibility script is not appended")
        shim_token = re.search(
            r"searchParams\.set\(\s*['\"]v['\"]\s*,\s*['\"]([^'\"]+)['\"]",
            source,
        )
        if current_token and (not shim_token or shim_token.group(1) != current_token):
            problems.append(f"{relative}: shim token does not match current controller")
    baseline_shims_missing_from_diff = sorted(
        set(baseline_controllers) - changed_or_new
    )
    if baseline_shims_missing_from_diff:
        problems.append(
            "V333.10 controllers absent from cumulative diff: "
            + ", ".join(baseline_shims_missing_from_diff)
        )
    return problems, current, baseline_controllers


def json_syntax_problems(paths: list[Path]) -> list[str]:
    problems: list[str] = []
    for path in paths:
        try:
            json.loads(path.read_text(encoding="utf-8-sig"))
        except Exception as error:
            problems.append(f"{path.relative_to(TARGET)}: {error}")
    return problems


def javascript_syntax_problems(paths: list[Path]) -> list[str]:
    node = shutil.which("node")
    if not node:
        return ["node executable is unavailable; JS syntax cannot be verified"]

    def check_one(path: Path) -> str | None:
        try:
            result = subprocess.run(
                [node, "--check", str(path)],
                capture_output=True,
                text=True,
                timeout=120,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired) as error:
            return f"{path.relative_to(TARGET)}: {error}"
        if result.returncode:
            detail = (result.stderr or result.stdout).strip().splitlines()
            return f"{path.relative_to(TARGET)}: {' | '.join(detail[-3:])}"
        return None

    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(check_one, paths))
    return [result for result in results if result]


def main() -> int:
    failures: list[str] = []

    def check(condition: bool, label: str, details: list[str] | None = None) -> None:
        print(f"{'PASS' if condition else 'FAIL'}  {label}")
        if not condition:
            failures.append(label)
            for detail in (details or [])[:30]:
                print(f"      {detail}")

    check(BASELINE_SOURCE.is_dir(), "V333.10 source baseline exists")
    check(TARGET.is_dir(), "V333.18 source target exists")
    check(BASELINE_ZIP.is_file(), "Library V333.10 canonical ZIP exists")
    if not (BASELINE_SOURCE.is_dir() and TARGET.is_dir() and BASELINE_ZIP.is_file()):
        return 1

    actual_baseline_zip_sha = sha256_path(BASELINE_ZIP)
    check(
        actual_baseline_zip_sha == BASELINE_ZIP_SHA256,
        "Library V333.10 ZIP SHA-256 matches the canonical value",
        [f"actual={actual_baseline_zip_sha}", f"expected={BASELINE_ZIP_SHA256}"],
    )

    baseline_zip_manifest, baseline_zip_problems = audit_zip(BASELINE_ZIP)
    check(
        not baseline_zip_problems,
        "Library V333.10 ZIP has no traversal, duplicate, symlink, pyc, or CRC issue",
        baseline_zip_problems,
    )
    baseline_manifest, baseline_symlinks, baseline_ignored = tree_manifest(BASELINE_SOURCE)
    target_manifest, target_symlinks, target_ignored = tree_manifest(TARGET)
    check(not baseline_symlinks, "V333.10 baseline source has no symlinks", baseline_symlinks)
    check(not target_symlinks, "V333.18 package source has no symlinks", target_symlinks)
    check(
        baseline_manifest == baseline_zip_manifest,
        "V333.10 source is byte-identical to the Library canonical ZIP",
        [
            *[f"missing/source:{name}" for name in sorted(set(baseline_zip_manifest) - set(baseline_manifest))[:10]],
            *[f"extra/source:{name}" for name in sorted(set(baseline_manifest) - set(baseline_zip_manifest))[:10]],
            *[
                f"hash:{name}"
                for name in sorted(set(baseline_manifest) & set(baseline_zip_manifest))
                if baseline_manifest[name] != baseline_zip_manifest[name]
            ][:10],
        ],
    )

    deleted = sorted(set(baseline_manifest) - set(target_manifest))
    changed_or_new = {
        relative
        for relative, digest in target_manifest.items()
        if baseline_manifest.get(relative) != digest
    }
    check(not deleted, "V333.10 -> V333.18 deletes zero package files", deleted)
    check(bool(changed_or_new), "V333.10 -> V333.18 has a cumulative changed/new set")

    controller_problems, current_controller, baseline_controllers = controller_contract(
        baseline_manifest, target_manifest, changed_or_new
    )
    check(
        not controller_problems,
        "V333.10 controllers and every compatibility shim route to the current controller",
        controller_problems,
    )

    mandatory = {
        "index.html",
        "version.txt",
        "sw.js",
        "manifest.json",
        "offline.html",
        "settings/index.html",
        "world-radio/index.html",
        "world-radio/player.html",
        "world-radio/assets/world-radio.js",
        "world-radio/assets/world-radio-player.js",
        "assets/js/market-base-build-v335.js",
        "assets/js/market-base-runtime-v335.js",
        "assets/js/market-base-offline-manifest-v335.js",
        "assets/js/market-base-navigation-v333-18.js",
        "assets/css/market-base-navigation-v333-18.css",
        "assets/js/market-base-home-deferred-v333-18.js",
        "assets/js/market-base-radio-dock-v333-16.js",
        "assets/css/market-base-radio-dock-v333-16.css",
        "assets/js/market-base-scroll-controls-v334.js",
        "scripts/build_v333_18_release.py",
        "scripts/test_v333_18_v333_10_upgrade.py",
    }
    if current_controller:
        mandatory.add(current_controller)
    missing_mandatory = sorted(mandatory - changed_or_new)
    check(
        not missing_mandatory,
        "version/SW/index/controller/radio/navigation and release tooling are cumulative diff files",
        missing_mandatory,
    )

    html_files = sorted(
        path
        for path in TARGET.rglob("*.html")
        if "HANDOFF_DOCUMENTS" not in path.parts
        and not any(part in EXCLUDED_DIRS for part in path.relative_to(TARGET).parts)
    )
    check(
        len(html_files) == EXPECTED_PUBLIC_HTML,
        f"public HTML count is {EXPECTED_PUBLIC_HTML}",
        [f"actual={len(html_files)}"],
    )
    reference_problems, reference_count = local_reference_problems(html_files)
    check(
        not reference_problems,
        "all public HTML local src/href/poster/action/srcset references exist",
        reference_problems,
    )

    package_paths = [TARGET / relative for relative in sorted(target_manifest)]
    json_paths = [path for path in package_paths if path.suffix.lower() == ".json"]
    js_paths = [
        path for path in package_paths if path.suffix.lower() in {".js", ".mjs"}
    ]
    json_problems = json_syntax_problems(json_paths)
    check(
        not json_problems,
        f"all {len(json_paths)} package JSON files parse",
        json_problems,
    )
    js_problems = javascript_syntax_problems(js_paths)
    check(
        not js_problems,
        f"all {len(js_paths)} package JS/MJS files pass node --check",
        js_problems,
    )

    archives_present = FULL_ZIP.is_file() or OVERWRITE_ZIP.is_file()
    if not archives_present:
        print("SKIP  V333.18 archives are not generated; source/baseline contract completed")
    else:
        if OVERWRITE_ZIP.is_file():
            overwrite_manifest, overwrite_problems = audit_zip(OVERWRITE_ZIP)
            check(
                not overwrite_problems,
                "V333.10 overwrite ZIP has no traversal, duplicate, symlink, pyc, or CRC issue",
                overwrite_problems,
            )
            missing_from_overwrite = sorted(changed_or_new - set(overwrite_manifest))
            unexpected_overwrite = sorted(set(overwrite_manifest) - set(target_manifest))
            mismatched_overwrite = sorted(
                relative
                for relative in set(overwrite_manifest) & set(target_manifest)
                if overwrite_manifest[relative] != target_manifest[relative]
            )
            check(
                not missing_from_overwrite,
                "overwrite ZIP contains every V333.10 -> V333.18 changed/new file",
                missing_from_overwrite,
            )
            check(
                not unexpected_overwrite and not mismatched_overwrite,
                "every overwrite ZIP file belongs to and matches the V333.18 full tree",
                [
                    *[f"extra:{name}" for name in unexpected_overwrite],
                    *[f"hash:{name}" for name in mismatched_overwrite],
                ],
            )
            with tempfile.TemporaryDirectory(prefix="v33310-to-v33318-test-") as temp:
                applied = Path(temp) / "applied"
                shutil.copytree(BASELINE_SOURCE, applied)
                apply_overwrite_zip(OVERWRITE_ZIP, applied)
                applied_manifest, applied_symlinks, _ = tree_manifest(applied)
                applied_missing = sorted(set(target_manifest) - set(applied_manifest))
                applied_extra = sorted(set(applied_manifest) - set(target_manifest))
                applied_hash = sorted(
                    relative
                    for relative in set(applied_manifest) & set(target_manifest)
                    if applied_manifest[relative] != target_manifest[relative]
                )
                check(
                    not applied_symlinks
                    and not applied_missing
                    and not applied_extra
                    and not applied_hash,
                    "Library V333.10 + overwrite ZIP equals the full V333.18 tree at every SHA",
                    [
                        *[f"symlink:{name}" for name in applied_symlinks],
                        *[f"missing:{name}" for name in applied_missing],
                        *[f"extra:{name}" for name in applied_extra],
                        *[f"hash:{name}" for name in applied_hash],
                    ],
                )
        else:
            print(f"SKIP  overwrite archive not generated: {OVERWRITE_ZIP.name}")

        if FULL_ZIP.is_file():
            full_manifest, full_problems = audit_zip(FULL_ZIP)
            check(
                not full_problems,
                "V333.18 full ZIP has no traversal, duplicate, symlink, pyc, or CRC issue",
                full_problems,
            )
            full_missing = sorted(set(target_manifest) - set(full_manifest))
            full_extra = sorted(set(full_manifest) - set(target_manifest))
            full_hash = sorted(
                relative
                for relative in set(full_manifest) & set(target_manifest)
                if full_manifest[relative] != target_manifest[relative]
            )
            check(
                not full_missing and not full_extra and not full_hash,
                "V333.18 full ZIP equals the source package tree at every SHA",
                [
                    *[f"missing:{name}" for name in full_missing],
                    *[f"extra:{name}" for name in full_extra],
                    *[f"hash:{name}" for name in full_hash],
                ],
            )
        else:
            print(f"SKIP  full archive not generated: {FULL_ZIP.name}")

        if CHECKSUMS.is_file():
            checksum_entries: dict[str, str] = {}
            for line in CHECKSUMS.read_text(encoding="utf-8").splitlines():
                match = re.fullmatch(r"([0-9a-fA-F]{64})\s+\*?(.+)", line.strip())
                if match:
                    checksum_entries[Path(match.group(2)).name] = match.group(1).lower()
            checksum_problems = []
            for archive_path in (FULL_ZIP, OVERWRITE_ZIP):
                if archive_path.is_file() and checksum_entries.get(archive_path.name) != sha256_path(archive_path):
                    checksum_problems.append(f"checksum:{archive_path.name}")
            check(
                not checksum_problems,
                "published SHA256SUMS matches every generated V333.18 archive",
                checksum_problems,
            )

    print()
    print(f"V333.10 canonical files: {len(baseline_manifest)}")
    print(f"V333.18 package files: {len(target_manifest)}")
    print(f"Changed/new: {len(changed_or_new)}")
    print(f"Deleted: {len(deleted)}")
    print(f"Public HTML local references checked: {reference_count}")
    print(f"V333.10 controllers covered: {len(baseline_controllers)}")
    if target_ignored:
        print(f"Ignored non-package artifacts: {len(target_ignored)}")
    if baseline_ignored:
        print(f"Ignored baseline artifacts: {len(baseline_ignored)}")
    if failures:
        print(f"FAIL — V333.10 -> V333.18 contract: {len(failures)} failed checks")
        return 1
    print(
        "PASS — V333.10 -> V333.18 source/baseline"
        + (" and archive" if archives_present else " pre-package")
        + " contract"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
