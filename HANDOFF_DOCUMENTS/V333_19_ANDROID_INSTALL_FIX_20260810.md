# V333.19 Samsung Internet／Androidインストール修正

実施日: 2026-08-10

## 現象

Samsung InternetでMARKET BASEをPWAとして追加しようとすると、Google Play Protectが「古いAndroid向けに作られている」「安全でないアプリ」として止める端末がありました。他のAndroidブラウザでは、リンクを開いてすぐインストール画面が出る場合もあり、端末やブラウザによって挙動が一致していませんでした。

## 原因

Samsung Internetは、インストール可能なPWAからAndroid用のWebAPKを生成する場合があります。警告対象の`targetSdk`はMARKET BASEのHTML、キャッシュ、Service Worker、国旗画像ではなく、Samsung Internetが生成したWebAPK側の値です。WebマニフェストにはAndroidの`targetSdk`を指定する項目がないため、サイト更新だけでSamsung生成WebAPKの対象APIを引き上げることはできません。

したがって、Play Protectを無効化する方法や、警告画面を利用者に強制突破させる方法は採用していません。AndroidパッケージをMARKET BASE側で管理する方式へ切り替えました。

## 修正1: Samsung InternetのWebAPK自動導線を使用しない

`assets/js/market-base-install-helper-v333-19.js`は`SamsungBrowser/`を検出した場合だけ`beforeinstallprompt`を抑止し、WebAPKの`prompt()`を呼びません。ChromeなどSamsung Internet以外のブラウザの通常動作には介入しません。

Samsung Internet自身がアドレスバー等に出すインストール表示まで、サイトから完全に消すことはできません。画面上でもこの制約を明記し、MARKET BASE内の公式Android版ボタンを推奨します。

PWAの`id`は、現在公開されているV333.10の次の値を固定して引き継ぎます。

`./?v=20260803-v333-10-cloudflare-web-analytics`

これはキャッシュ用の版番号ではなく、既存PWAとの更新互換を維持するアプリ識別子です。V333.19以降もリリースごとに変更しません。

## 修正2: API 36署名済み公式Android版

MARKET BASE専用のAndroidプロジェクトを`android/market-base-twa/`へ追加しました。

- applicationId: `io.github.takina888.marketbase`
- compileSdk / targetSdk: `36` / `36`
- minSdk: `23`
- versionCode / versionName: `33319` / `333.19`
- ソースで要求する端末機能権限: `android.permission.INTERNET`のみ
- 実装: Trusted Web Activity、検証前または非対応時はCustom Tabs
- WebView: 不使用

公式APK:

`downloads/android/MARKET_BASE_V333_19_ANDROID_API36_RELEASE_20260810.apk`

SHA-256:

`04d7dcd1098d9ba08d103927ec76e109d2a4b81e3c707b7f2807f28553313c2e`

このAPKはAndroid署名、applicationId、versionCode、実ファイルの`targetSdk=36`を検証済みです。今回の「古いAndroid向け」という警告原因に対するAPK側の修正です。ただし、ストア外APKの一般的なPlay Protectスキャンや、ブラウザに対する「この提供元を許可」は別の安全機能であり、表示される可能性があります。

完成APKの統合マニフェストには、AndroidX Browserが内部Receiverを他アプリから保護するために自動生成する、アプリ固有の署名レベル権限も1件あります。これは利用者へ許可を求めるカメラ・位置情報・ストレージ等の危険権限ではありません。削除すると内部保護を弱めるため維持しています。

署名に関する非公開情報はソース、APKダウンロードフォルダ、引き継ぎ文書へ含めていません。将来の更新では同じapplicationIdと同じアプリ署名証明書を維持し、versionCodeを増やす必要があります。

## 修正3: サイト内の設定案内

Samsung Internet用ダイアログに次の導線を追加しました。

1. 公式Android版をHTTPSからダウンロード
2. APKを使用しないホーム画面ショートカット
3. Chromeで開いてPWAをインストール

公式Android版が設定されている場合だけ、「Android版をインストールできない場合の設定」を表示します。案内内容は次の通りです。

1. APKを開く。
2. 「この提供元を許可」または「不明なアプリをインストール」が表示されたら設定を開く。
3. Samsung Internetを選び、「この提供元を許可」をオンにする。繁体字中国語では「允許此來源」。
4. 戻ってインストールし、完了後は提供元の許可をオフへ戻してよい。
5. Google Play Protectは無効にせず、通常の安全確認を有効のまま使用する。

APK URLはHTTPSだけを許可します。URL設定が空、不正、またはHTTPの場合は公式APKボタンを表示しないfail-closed構成です。公開時には、設定済みURLの実ファイルがHTTP 200で取得できることを別途確認します。

`install/samsung-shortcut.htm`はPWAマニフェストを読み込みません。この専用ページをホーム画面へ追加すると、WebAPKを生成しないブラウザショートカットとしてMARKET BASEを開きます。

## 修正4: Digital Asset Links

署名済みAPKと一致するDigital Asset Linksは次のファイルです。

`android/market-base-twa/digital-asset-links/assetlinks.json`

公開先は必ず次です。

`https://takina888.github.io/.well-known/assetlinks.json`

`https://takina888.github.io/market_base/.well-known/assetlinks.json`ではありません。MARKET BASEのサブフォルダだけを上書きしてもオリジンルートのファイルは配置されないため、GitHub Pagesのユーザーサイトルートへ別途配置します。

Digital Asset Linksがまだ公開されていない場合、APKはインストールできますが、TWA検証が完了せずCustom Tab表示になることがあります。公開後は、リダイレクトなしのHTTP 200、JSONのContent-Type、APK署名との一致を確認します。

## V333.10からの反映

V333.19の上書きZIPは公開正本V333.10との差分を累積収録します。V333.18を先に適用する必要はありません。

1. V333.10公開フォルダを削除しない。
2. 上書きZIPを展開し、フォルダ構造を維持して上書きする。
3. `downloads/android/`を含む新規ファイルが反映されたことを確認する。
4. `sw.js`と`version.txt`まで反映し、サイトの「更新」を一度押す。
5. `.well-known/assetlinks.json`だけは`/market_base/`ではなくサイトルートへ別途配置する。

## 解消範囲と残る確認

静的・ビルド検証では、署名済みAPK、API 36、サイト内リンク、Digital Asset Links、Service Worker、PWA ID互換を確認済みです。しかし、Play Protectの判定は端末、OS、Play Protectの版、配布経路によって変わります。「すべての警告が必ず消える」とは保証しません。

Samsung実機、Samsung以外のAndroid実機、提供元許可画面、Play Protectを有効にした状態でのインストール、公開後のTWA、ラジオ動作は未確認です。実機確認結果を残してから正式配布としてください。
