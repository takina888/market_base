#!/usr/bin/env python3
"""Regression checks for the currency converter's shared MARKET BASE shell."""

from html.parser import HTMLParser
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent
CONVERTER = ROOT / "market-base-currency-converter-v273-r29.html"
CONVERTER_CSS = ROOT / "assets/css/currency-standard-shell-r11335.css"
STANDARD_SHELL_CSS = ROOT / "assets/css/market-base-standard-shell-r11372.css"
INDEX = ROOT / "index.html"
SHELL_VERSION = "20260727-r11385-halfpc"
CONVERTER_LINK_VERSION = "20260727-r11385"
BUILD = "MARKET_BASE_R113_85_RESPONSIVE_FLAGS_GEOLOCATION_GALLERY_20260727"


def fail(message: str) -> None:
    raise SystemExit(f"CURRENCY ALIGNMENT TEST: FAIL — {message}")


class MarkupAudit(HTMLParser):
    """Collect elements with normalized attributes and ancestor class tokens."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.elements: list[dict[str, object]] = []
        self.stack: list[dict[str, object]] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        attributes = {name: value or "" for name, value in attrs}
        element: dict[str, object] = {
            "tag": tag,
            "attrs": attributes,
            "classes": frozenset(attributes.get("class", "").split()),
            "ancestor_classes": tuple(item["classes"] for item in self.stack),
            "text": [],
        }
        self.elements.append(element)
        self.stack.append(element)

    def handle_startendtag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        self.handle_starttag(tag, attrs)
        self.stack.pop()

    def handle_endtag(self, tag: str) -> None:
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]["tag"] == tag:
                del self.stack[index:]
                return

    def handle_data(self, data: str) -> None:
        if self.stack:
            self.stack[-1]["text"].append(data)


def parse(markup: str) -> MarkupAudit:
    audit = MarkupAudit()
    audit.feed(markup)
    audit.close()
    return audit


def elements_with_classes(
    audit: MarkupAudit, tag: str, required: set[str]
) -> list[dict[str, object]]:
    return [
        element
        for element in audit.elements
        if element["tag"] == tag and required <= element["classes"]
    ]


for required_file in (CONVERTER, CONVERTER_CSS, STANDARD_SHELL_CSS, INDEX):
    if not required_file.is_file():
        fail(f"required file is missing: {required_file.relative_to(ROOT)}")

converter = CONVERTER.read_text(encoding="utf-8")
converter_css = CONVERTER_CSS.read_text(encoding="utf-8")
index = INDEX.read_text(encoding="utf-8")
converter_audit = parse(converter)
index_audit = parse(index)

# The converter keeps its semantic specialist-page classification while sharing
# the primary header and page-width geometry.
bodies = [item for item in converter_audit.elements if item["tag"] == "body"]
if len(bodies) != 1:
    fail(f"expected one body element, found {len(bodies)}")
body_classes = bodies[0]["classes"]
required_body_classes = {
    "mb-unified-specialist-page",
    "mb-standard-page",
    "currency-standard-page",
}
if not required_body_classes <= body_classes:
    fail(f"converter body classes are incomplete: {sorted(body_classes)}")
if "mb-unified-main-page" in body_classes or "mb-unified-main-page" in converter:
    fail("converter was exposed to mb-unified-main-page rules")

header_hosts = elements_with_classes(
    converter_audit, "div", {"mb-primary-header-host"}
)
if len(header_hosts) != 1:
    fail(f"expected one mb-primary-header-host wrapper, found {len(header_hosts)}")

headers = elements_with_classes(
    converter_audit, "header", {"mb-global-header", "mb-primary-header"}
)
if len(headers) != 1:
    fail(f"expected one shared primary header, found {len(headers)}")
if not any(
    "mb-primary-header-host" in ancestor
    for ancestor in headers[0]["ancestor_classes"]
):
    fail("shared primary header is not inside mb-primary-header-host")

brands = [
    item
    for item in converter_audit.elements
    if "mb-global-brand" in item["classes"]
]
if len(brands) != 1:
    fail(f"expected one MARKET BASE brand, found {len(brands)}")
brand_text = "".join(brands[0]["text"]).strip()
if brands[0]["tag"] != "strong" or brand_text != "MARKET BASE":
    fail("MARKET BASE brand must be non-link <strong> text")
if any(
    item["tag"] == "a" and "mb-global-brand" in item["classes"]
    for item in converter_audit.elements
):
    fail("MARKET BASE brand remains an anchor and can regain an underline")
if "market-base-global-header-r1139.css" in converter:
    fail("legacy standalone global-header stylesheet is still linked")

mains = elements_with_classes(
    converter_audit,
    "main",
    {
        "mb-primary-currency-content",
        "currency-standard-shell",
        "mb-standard-content-shell",
    },
)
if len(mains) != 1:
    fail(f"expected one aligned currency main shell, found {len(mains)}")

standard_shell_href = (
    f"assets/css/market-base-standard-shell-r11372.css?v={SHELL_VERSION}"
)
desktop_shell_href = (
    "assets/css/market-base-desktop-icon-nav-r11337.css?v=20260727-r11371"
)
if standard_shell_href not in converter:
    fail("shared R113.72 standard shell stylesheet is not linked")
if converter.find(standard_shell_href) < converter.find(desktop_shell_href):
    fail("shared standard shell must load after the desktop icon-nav stylesheet")

# Compacting whitespace makes formatting changes harmless while preserving the
# values and selectors that define the shell contract.
css_without_comments = re.sub(r"/\*.*?\*/", "", converter_css, flags=re.S)
compact_css = re.sub(r"\s+", "", css_without_comments)
required_css_fragments = {
    "mobile 430px shell": "width:min(430px,100%)",
    "half-PC media range": "@media(min-width:431px)and(max-width:1199px)",
    "half-PC fluid width": "width:min(calc(100%-32px),1180px)!important",
    "desktop fluid width": "width:calc(100%-48px)",
    "1180px desktop tier": "max-width:1180px",
    "1360px desktop tier": "max-width:1360px",
    "1440px desktop tier": "max-width:1440px",
    "desktop header padding": (
        "body.currency-standard-page.mb-primary-header-host{padding:024px;"
    ),
    "PC icon-band override": (
        "body.currency-standard-page.mb-global-icon-band{"
        "width:calc(100%-48px);max-width:1180px;"
    ),
}
for label, fragment in required_css_fragments.items():
    if fragment not in compact_css:
        fail(f"missing {label}: {fragment}")

for label, pattern in (
    ("900px maximum", r"(?:^|[;{])max-width:900px(?:[;}])"),
    ("900px fixed width", r"(?:^|[;{])width:900px(?:[;}])"),
    ("900px min() cap", r"(?:^|[;{])width:min\(900px[,)]"),
    ("specialist width token", r"--mb-shell-specialist-width"),
):
    if re.search(pattern, compact_css):
        fail(f"legacy 900px/specialist width rule remains: {label}")

# Every converter reference on the home page must use the new release query.
converter_name = CONVERTER.name
expected_href = f"{converter_name}?v={CONVERTER_LINK_VERSION}"
converter_refs = [
    item
    for item in index_audit.elements
    if item["attrs"].get("href", "").startswith(converter_name)
]
if not converter_refs:
    fail("index has no converter link or prefetch")
stale_hrefs = sorted(
    {
        item["attrs"].get("href", "")
        for item in converter_refs
        if item["attrs"].get("href") != expected_href
    }
)
if stale_hrefs:
    fail(f"index has stale converter references: {', '.join(stale_hrefs)}")
prefetches = [
    item
    for item in converter_refs
    if item["tag"] == "link"
    and "prefetch" in item["attrs"].get("rel", "").split()
]
navigation_links = [item for item in converter_refs if item["tag"] == "a"]
if len(prefetches) != 1:
    fail(f"expected one current converter prefetch, found {len(prefetches)}")
if len(navigation_links) < 2:
    fail(
        "expected current converter links for both desktop and bottom navigation"
    )

if BUILD not in converter:
    fail("converter build marker is not R113.85")

required_ids = {"currencyToolPanel", "prismToolPanel", "cards"}
present_ids = {
    item["attrs"].get("id", "")
    for item in converter_audit.elements
    if item["attrs"].get("id")
}
missing_ids = sorted(required_ids - present_ids)
if missing_ids:
    fail(f"converter functionality IDs are missing: {', '.join(missing_ids)}")
for function_name in ("getRates", "activateTool"):
    if not re.search(
        rf"\b(?:async\s+)?function\s+{re.escape(function_name)}\s*\(",
        converter,
    ):
        fail(f"converter function was lost: {function_name}")

print(
    "CURRENCY ALIGNMENT TEST: PASS — "
    "shared header and 430/mobile + fluid half-PC + 1180/1360/1440 shells verified; "
    "brand underline source removed; converter functions retained"
)
