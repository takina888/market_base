#!/usr/bin/env python3
"""Verify the canonical MARKET BASE shell on specialist and Learn pages."""

from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
VERSION = "20260727-r11372"
CURRENCY_SHELL_VERSION = "20260727-r11385-halfpc"
BUILD = "MARKET_BASE_R113_72_STANDARD_SHELL_UNIFICATION_20260727"
SPECIALIST_BUILD = "MARKET_BASE_R113_85_RESPONSIVE_FLAGS_GEOLOCATION_GALLERY_20260727"
WORLD_ROUTE_BUILD = "MARKET_BASE_R113_81_WORLD_ROUTE_STANDALONE_RECOVERY_20260727"
PRIMARY_CSS = "market-base-primary-components-r11326.css"
DESKTOP_CSS = "market-base-desktop-icon-nav-r11337.css"
STANDARD_CSS_NAME = "market-base-standard-shell-r11372.css"
DESKTOP_JS = "market-base-desktop-icon-nav-r11337.js"

LEARN_PAGES = (
    "haccp-quiz/index.html",
    "international-logistics/guide.html",
    "world-route/index.html",
    "machine-container-packing/index.html",
    "hs-learning/index.html",
    "ul-ce-learning/index.html",
    "material-check/index.html",
    "classic-move/index.html",
)
SPECIALIST_PAGES = (
    "market-base-currency-converter-v273-r29.html",
    "world-compass.html",
)
ALL_PAGES = SPECIALIST_PAGES + LEARN_PAGES


def fail(message: str) -> None:
    raise SystemExit(f"STANDARD SHELL TEST: FAIL — {message}")


class Audit(HTMLParser):
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
            "ancestors": tuple(item["classes"] for item in self.stack),
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
                break

    def handle_data(self, data: str) -> None:
        for element in self.stack:
            element["text"].append(data)


def parse(markup: str) -> Audit:
    audit = Audit()
    audit.feed(markup)
    audit.close()
    return audit


def elements(
    audit: Audit, *, tag: str | None = None, class_name: str | None = None
) -> list[dict[str, object]]:
    return [
        item
        for item in audit.elements
        if (tag is None or item["tag"] == tag)
        and (class_name is None or class_name in item["classes"])
    ]


def text_of(element: dict[str, object]) -> str:
    return " ".join("".join(element["text"]).split())


for relative in ALL_PAGES:
    path = ROOT / relative
    if not path.is_file():
        fail(f"{relative}: entry file is missing")

    markup = path.read_text(encoding="utf-8")
    audit = parse(markup)
    bodies = elements(audit, tag="body")
    if len(bodies) != 1:
        fail(f"{relative}: expected one body, found {len(bodies)}")
    body_classes = bodies[0]["classes"]
    if relative in LEARN_PAGES:
        if "mb-unified-learning-page" not in body_classes:
            fail(f"{relative}: Learn body marker is missing")
    else:
        required = {"mb-unified-specialist-page", "mb-standard-page"}
        if not required <= body_classes:
            fail(f"{relative}: specialist body markers are incomplete")

    header_hosts = elements(audit, class_name="mb-primary-header-host")
    if len(header_hosts) != 1:
        fail(
            f"{relative}: expected one canonical header host, "
            f"found {len(header_hosts)}"
        )
    headers = [
        item
        for item in elements(audit, tag="header")
        if {"mb-global-header", "mb-primary-header"} <= item["classes"]
    ]
    if len(headers) != 1:
        fail(
            f"{relative}: expected one canonical primary header, "
            f"found {len(headers)}"
        )
    if not any(
        "mb-primary-header-host" in ancestor
        for ancestor in headers[0]["ancestors"]
    ):
        fail(f"{relative}: canonical header is outside its host")

    brands = elements(audit, class_name="mb-global-brand")
    if len(brands) != 1:
        fail(f"{relative}: expected one global brand, found {len(brands)}")
    if brands[0]["tag"] != "strong" or text_of(brands[0]) != "MARKET BASE":
        fail(f"{relative}: MARKET BASE must be non-link <strong> text")

    shell_class = (
        "mb-learning-content-shell"
        if relative in LEARN_PAGES
        else "mb-standard-content-shell"
    )
    mains = elements(audit, tag="main", class_name=shell_class)
    if len(mains) != 1:
        fail(
            f"{relative}: expected one main.{shell_class}, found {len(mains)}"
        )

    navs = elements(audit, tag="nav", class_name="mb-primary-bottom-nav")
    if len(navs) != 1:
        fail(
            f"{relative}: expected one primary bottom nav, found {len(navs)}"
        )
    nav_links = [
        item
        for item in elements(audit, tag="a", class_name="mb-primary-bottom-tab")
        if any(
            "mb-primary-bottom-nav" in ancestor
            for ancestor in item["ancestors"]
        )
    ]
    if len(nav_links) != 4:
        fail(f"{relative}: primary bottom nav has {len(nav_links)} links")
    labels = [text_of(item) for item in nav_links]
    if labels != ["ホーム", "ツール", "学ぶ", "ランキング"]:
        fail(f"{relative}: primary bottom nav order is wrong: {labels}")

    active_links = [
        item
        for item in nav_links
        if "active" in item["classes"]
        and item["attrs"].get("aria-current") == "page"
    ]
    expected_active = (
        "ツール"
        if relative == "market-base-currency-converter-v273-r29.html"
        else "ホーム"
        if relative == "world-compass.html"
        else "学ぶ"
    )
    if len(active_links) != 1 or text_of(active_links[0]) != expected_active:
        fail(f"{relative}: expected {expected_active} as the sole active tab")

    if PRIMARY_CSS not in markup:
        fail(f"{relative}: primary component stylesheet is missing")
    expected_shell_version = (
        CURRENCY_SHELL_VERSION
        if relative in SPECIALIST_PAGES
        else VERSION
    )
    standard_css = f"{STANDARD_CSS_NAME}?v={expected_shell_version}"
    if standard_css not in markup and not (relative == "world-route/index.html" and STANDARD_CSS_NAME in markup):
        fail(f"{relative}: shared shell stylesheet is missing: {standard_css}")
    if DESKTOP_CSS not in markup and not (relative == "world-route/index.html" and "INLINE_DESKTOP_ICON_NAV_R11337" in markup):
        fail(f"{relative}: desktop icon-nav stylesheet is missing")
    if relative != "world-route/index.html" and markup.find(standard_css) < markup.find(DESKTOP_CSS):
        fail(f"{relative}: shared shell must load after desktop icon-nav CSS")
    if DESKTOP_JS not in markup and not (relative == "world-route/index.html" and "INLINE_DESKTOP_ICON_NAV_R11337" in markup):
        fail(f"{relative}: desktop icon-nav script is missing")
    expected_build = (WORLD_ROUTE_BUILD if relative == "world-route/index.html" else SPECIALIST_BUILD if relative in SPECIALIST_PAGES else BUILD)
    if expected_build not in markup:
        fail(f"{relative}: build marker is missing")

if "market-base-global-header-r1139.css" in (
    ROOT / "world-compass.html"
).read_text(encoding="utf-8"):
    fail("world-compass.html: legacy standalone header stylesheet remains")

index = (ROOT / "index.html").read_text(encoding="utf-8")
for relative in LEARN_PAGES + ("world-compass.html",):
    if relative == "world-route/index.html":
        expected = "world-route.html?v=20260727-r11381"
    else:
        expected_version = ("20260727-r11383" if relative == "classic-move/index.html" else "20260727-r11385" if relative == "world-compass.html" else VERSION)
        expected = f"{relative}?v={expected_version}"
    if expected not in index:
        fail(f"index.html: current link/prefetch is missing for {expected}")

print(
    "STANDARD SHELL TEST: PASS — currency, world compass and 8 Learn "
    "entries share one header, responsive shell and 4-tab navigation"
)
