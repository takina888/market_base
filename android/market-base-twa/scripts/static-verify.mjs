#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const gradle = read("app/build.gradle.kts");
const manifest = read("app/src/main/AndroidManifest.xml");
const strings = read("app/src/main/res/values/strings.xml");
const launcher = read(
  "app/src/main/java/io/github/takina888/marketbase/LauncherActivity.java",
);
const dalTemplate = read("digital-asset-links/assetlinks.json.template");
const releaseDal = read("digital-asset-links/assetlinks.json");
const workflow = read("github-actions/build-market-base-android.yml");
const wrapperJar = fs.readFileSync(path.join(root, "gradle/wrapper/gradle-wrapper.jar"));

check(/compileSdk\s*=\s*36\b/.test(gradle), "compileSdk must be 36");
check(/targetSdk\s*=\s*36\b/.test(gradle), "targetSdk must be 36");
check(
  /buildToolsVersion\s*=\s*"36\.0\.0"/.test(gradle),
  "Android Build Tools must be pinned to 36.0.0",
);
check(
  /applicationId\s*=\s*"io\.github\.takina888\.marketbase"/.test(gradle),
  "applicationId changed unexpectedly",
);
check(
  strings.includes("https://takina888.github.io/market_base/"),
  "launch URL changed unexpectedly",
);
check(
  strings.includes(">customtabs</string>"),
  "fallback must remain Custom Tabs",
);
check(
  launcher.includes("com.google.androidbrowserhelper.trusted.LauncherActivity"),
  "launcher must extend Android Browser Helper TWA LauncherActivity",
);
check(!/WebView/i.test(manifest), "AndroidManifest must not declare a WebView fallback");
check(
  createHash("sha256").update(wrapperJar).digest("hex") ===
    "2db75c40782f5e8ba1fc278a5574bab070adccb2d21ca5a6e5ed840888448046",
  "Gradle 8.11.1 wrapper JAR checksum is not the official value",
);
check(
  !workflow.includes("market-base-debug-apk"),
  "CI must not publish a debug APK artifact",
);
check(
  workflow.includes("app-release.apk.sha256") &&
    workflow.includes("app-release.aab.sha256"),
  "CI must publish SHA-256 checksums beside signed release artifacts",
);

const permissions = [
  ...manifest.matchAll(/<uses-permission\s+android:name="([^"]+)"\s*\/>/g),
].map((match) => match[1]);
check(
  permissions.length === 1 && permissions[0] === "android.permission.INTERNET",
  `unexpected Android permissions: ${permissions.join(", ") || "none"}`,
);

const sampleFingerprint = Array.from({ length: 32 }, () => "AA").join(":");
const renderedDal = dalTemplate.replace(
  "__MARKET_BASE_SHA256_CERT_FINGERPRINT__",
  sampleFingerprint,
);
try {
  const parsed = JSON.parse(renderedDal);
  const target = parsed?.[0]?.target;
  check(
    target?.package_name === "io.github.takina888.marketbase",
    "assetlinks package_name changed unexpectedly",
  );
  check(
    target?.sha256_cert_fingerprints?.[0] === sampleFingerprint,
    "assetlinks fingerprint placeholder is missing",
  );
} catch (error) {
  failures.push(`assetlinks template is not valid JSON: ${error.message}`);
}

try {
  const parsed = JSON.parse(releaseDal);
  const target = parsed?.[0]?.target;
  check(
    target?.package_name === "io.github.takina888.marketbase",
    "release assetlinks package_name changed unexpectedly",
  );
  check(
    target?.sha256_cert_fingerprints?.includes(
      "72:4B:15:77:8E:77:07:F2:4B:2A:54:46:80:6E:99:9C:92:E4:36:5D:F7:6B:A7:A3:D8:5D:36:1D:00:5E:4C:85",
    ),
    "release assetlinks fingerprint does not match the V333.19 signing certificate",
  );
} catch (error) {
  failures.push(`release assetlinks file is not valid JSON: ${error.message}`);
}

if (failures.length > 0) {
  console.error("MARKET BASE Android static verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("MARKET BASE Android static verification passed.");
console.log("- API: compileSdk 36 / targetSdk 36");
console.log("- Runtime: Trusted Web Activity / Custom Tabs fallback");
console.log("- Permissions: INTERNET only");
console.log("- Package: io.github.takina888.marketbase");
