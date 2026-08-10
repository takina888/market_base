# MARKET BASE Android（TWA / API 36）

Samsung Internet が PWA のインストール時に生成する WebAPK には依存せず、MARKET BASE
自身が管理する Android アプリを作るためのプロジェクトです。WebView は使用しません。
Digital Asset Links の検証に成功したブラウザでは Trusted Web Activity（TWA）、未対応の
ブラウザまたは検証前は Custom Tab で `https://takina888.github.io/market_base/` を開きます。

## 固定する識別情報

- applicationId: `io.github.takina888.marketbase`
- compileSdk / targetSdk: `36`
- versionCode: `33319`
- versionName: `333.19`
- ソースで要求する端末機能権限: `INTERNET` のみ

完成 APK には AndroidX Browser が内部 Receiver を保護するために自動生成する、アプリ固有の署名レベル権限も含まれます。これは利用者へ許可を求める危険権限ではありません。
- 配布版の署名鍵: 初回リリースから同じ鍵を永続的に使用

applicationId または署名鍵を変えると、既存アプリへの上書き更新ができません。署名鍵は
公開リポジトリへ置かず、安全なバックアップを二重に保管してください。

## 1. 静的確認

Android SDK がない環境でも、次の契約テストを実行できます。

```sh
node scripts/static-verify.mjs
```

SDK / JDK 17 がある環境では次も実行します。

```sh
./gradlew :app:lintRelease :app:assembleDebug
```

## 2. リリース署名鍵を初回だけ作る

すでに MARKET BASE の正式な署名鍵がある場合は、新規作成せず必ずその鍵を使います。
新しいアプリとして初回発行するときだけ、手元の安全な端末で作成します。

```sh
keytool -genkeypair \
  -keystore market-base-release.jks \
  -alias marketbase \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000
```

パスワードはコマンドに直接書かず、対話入力してください。`*.jks` は `.gitignore` 済みです。

ローカルで署名ビルドする場合は、コマンド行に秘密値を残さないよう環境変数などから
Gradle プロパティを渡します。

```sh
./gradlew \
  -PMARKET_BASE_STORE_FILE=/secure/path/market-base-release.jks \
  -PMARKET_BASE_STORE_PASSWORD='(secret)' \
  -PMARKET_BASE_KEY_ALIAS=marketbase \
  -PMARKET_BASE_KEY_PASSWORD='(secret)' \
  :app:assembleRelease :app:bundleRelease
```

実運用では、下記 GitHub Actions の暗号化 Secrets を使用してください。

## 3. GitHub Actions で署名ビルドする

`github-actions/build-market-base-android.yml` をリポジトリ直下の
`.github/workflows/build-market-base-android.yml` へコピーします。GitHub の
`android-release` Environment に次の Secrets を登録します。

- `MARKET_BASE_KEYSTORE_BASE64`: `base64 -w 0 market-base-release.jks` の結果
- `MARKET_BASE_STORE_PASSWORD`
- `MARKET_BASE_KEY_ALIAS`
- `MARKET_BASE_KEY_PASSWORD`

通常の push / pull request では静的検査・Android Lint・debug APK のコンパイル確認だけを行い、
誤配布を防ぐため debug APK は成果物として公開しません。
手動実行（workflow_dispatch）のときだけ署名済み APK / AAB を作り、署名証明書から
`assetlinks.json` とダウンロード検証用の `.sha256` も生成します。秘密鍵は成果物へ含めません。

## 4. Digital Asset Links を公開する（TWA に必須）

署名済み APK から SHA-256 fingerprint を取得します。

```sh
apksigner verify --verbose --print-certs app/build/outputs/apk/release/app-release.apk
```

表示された fingerprint を大文字・コロン区切りにして生成スクリプトへ渡します。

```sh
MARKET_BASE_SHA256_CERT_FINGERPRINT='AA:BB:...:FF' \
  scripts/render-assetlinks.sh \
  digital-asset-links/assetlinks.json.template \
  digital-asset-links/assetlinks.json
```

V333.19 の直接配布用リリース証明書 fingerprint は次の値です（fingerprint は公開情報で、
秘密鍵やパスワードではありません）。同梱の `digital-asset-links/assetlinks.json` はこの値を
設定済みです。

`72:4B:15:77:8E:77:07:F2:4B:2A:54:46:80:6E:99:9C:92:E4:36:5D:F7:6B:A7:A3:D8:5D:36:1D:00:5E:4C:85`

生成ファイルは必ず次の URL で、リダイレクトなし・HTTP 200・
`Content-Type: application/json` として公開します。

`https://takina888.github.io/.well-known/assetlinks.json`

MARKET BASE は `/market_base/` 配下ですが、Digital Asset Links は
`/market_base/.well-known/` ではありません。GitHub Pages の user site
（通常は `takina888/takina888.github.io` リポジトリ）のルートに
`.well-known/assetlinks.json` を置く必要があります。

Google Play App Signing を使う場合は、アップロード鍵ではなく Play Console に表示される
**アプリ署名鍵**の fingerprint も登録します。直接配布 APK とストア版で証明書が異なる場合、
`sha256_cert_fingerprints` 配列へ両方を入れます。

## 5. 実機で確認する

```sh
adb install -r app/build/outputs/apk/release/app-release.apk
adb shell dumpsys package io.github.takina888.marketbase
adb shell pm get-app-links io.github.takina888.marketbase
```

確認項目:

1. `targetSdk=36` である。
2. 同じ署名鍵・より大きい versionCode で上書き更新できる。
3. アプリを開くと `/market_base/` が表示される。
4. Digital Asset Links の検証後はブラウザのツールバーがない TWA になる。
5. TWA 非対応ブラウザでも WebView ではなく Custom Tab で安全に開く。
6. ラジオ再生、別ウィンドウ、共有、位置情報など Web 側の主要機能を実機確認する。

この targetSdk 36 ビルドは「古い Android 向け」という警告原因を解消するためのものです。
ただし GitHub から APK を直接配布する場合、端末側の「この提供元を許可」や Play Protect の
一般的なスキャンまで無効化するものではありません。警告を最小化する最終配布先は Google
Play または Galaxy Store です。

## 公式資料

- TWA: https://developer.chrome.com/docs/android/trusted-web-activity/
- TWA quick start / Custom Tab fallback: https://developer.chrome.com/docs/android/trusted-web-activity/quick-start
- Android API 36 対応 AGP: https://developer.android.com/build/releases/agp-8-10-0-release-notes
- Digital Asset Links: https://developers.google.com/digital-asset-links/
