#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "market-base-code-tool.html").read_text(encoding="utf-8")
JS_PATH = ROOT / "assets/js/market-base-code-tool-v332.js"
JS = JS_PATH.read_text(encoding="utf-8")
CSS = (ROOT / "assets/css/market-base-code-tool-v332.css").read_text(encoding="utf-8")
TOKEN = "20260803-v333-7-2-work-code-controls"
BUILD = "MARKET_BASE_V333_7_2_WORK_CODE_CONTROLS_20260803"


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    # 1. Help
    require('id="mbCodeHelp"' in HTML, "help button missing")
    require('id="mbCodeHelpModal"' in HTML, "help modal missing")
    require("openHelp" in JS and "closeOverlay" in JS, "help behavior missing")

    # 2. Fullscreen preview
    require('id="mbCodeFullscreen"' in HTML, "fullscreen button missing")
    require('id="mbCodeFullscreenModal"' in HTML, "fullscreen overlay missing")
    require("canvas.toDataURL('image/png')" in JS, "fullscreen image generation missing")
    require(".mb-code-modal,.mb-code-fullscreen{position:fixed" in CSS, "fullscreen viewport CSS missing")

    # 3. Share scanned contents
    require('id="mbCodeResultShare"' in HTML, "scanned-result share button missing")
    require("async function shareScanResult" in JS, "scanned-result share handler missing")
    require("navigator.share" in JS and "data.url=href" in JS, "Web Share path missing")

    # 4. Camera light and zoom, hidden when unsupported
    for control in ("mbCodeCameraTools", "mbCodeTorch", "mbCodeZoom"):
        require(f'id="{control}"' in HTML, f"camera control missing: {control}")
    require("getCapabilities" in JS, "camera capability detection missing")
    require("torchButton.hidden=!hasTorch" in JS, "unsupported torch is not hidden")
    require("zoomWrap.hidden=!hasZoom" in JS, "unsupported zoom is not hidden")
    require("applyConstraints" in JS and "torch:false" in JS, "camera constraint cleanup missing")

    # Existing compatibility retained without expanding the business-card feature.
    require('<option value="vcard">名刺（vCard）</option>' in HTML, "existing vCard option removed")
    require("mbQrVcardName" in HTML and "mbQrVcardEmail" in HTML, "existing vCard fields broken")

    # Build/cache consistency.
    require(BUILD in HTML, "WORK CODE build metadata missing")
    require(TOKEN in HTML, "WORK CODE asset token missing")
    require((ROOT / "version.txt").read_text(encoding="utf-8").strip() == BUILD, "version.txt mismatch")
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    require(manifest.get("version") == "V333.7.2", "manifest version mismatch")
    require(manifest.get("build_id") == BUILD, "manifest build mismatch")
    sw = (ROOT / "sw.js").read_text(encoding="utf-8")
    require(BUILD in sw and TOKEN in sw, "service worker build/token mismatch")
    require("market-base-code-tool-v332.js" in sw and "market-base-code-tool-v332.css" in sw,
            "WORK CODE assets missing from service worker")

    subprocess.run(["node", "--check", str(JS_PATH)], check=True)
    print("V333.7.2 WORK CODE controls QA: PASS")


if __name__ == "__main__":
    main()
