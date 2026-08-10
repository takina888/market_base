# V333.17 キャッシュ・ページ切替 原因と修正

## 判定

国旗bundleは176,096 bytesで寄与はありますが、主因ではありません。メインページはV333.16で36本・8,448,668 bytesのローカルJavaScriptを初期読込し、世界史4.38MB、Journey画像manifest、写真台帳、国詳細データ等を表示前に評価していました。加えて、ホームだけ独自の更新確認を待った後に共通controllerが再確認していました。

ラジオ音声streamはcross-origin mediaであり、Service Workerはaudio/video/Range/HLSを明示的に通過させます。早送り様再生の原因はV333.16で修正済みの古いライブ接続・バッファ再利用で、Cache APIではありません。

## キャッシュ問題

1. `version.txt?check=<時刻>`を毎回別CacheStorageキーへ保存していた。
2. HTMLは常にnetwork/no-storeで、先読みしても実遷移で使われなかった。
3. 手動更新が現在世代のcacheを温存し、同一buildの古いJS/CSSを修復できなかった。
4. 新workerのactivate前に旧cacheを削除でき、低速回線や部分公開で回復cacheを失う可能性があった。
5. オフライン保存を通常runtime cacheと専用cacheへ二重保存していた。
6. 複数タブが同時に更新確認・worker更新・online復帰処理を競合していた。
7. 旧flight/rail fallbackに全SW解除と広範cache削除が残っていた。

## V333.17の修正

- version/no-store/一時確認URLはCacheStorageへ保存しない。
- 現行buildのHTMLはpathname単位で正規化し、cache-first + background revalidate。
- `mb-prefetch=1`の意図先読みを正規化cacheへ保存し、実遷移で再利用。
- 現行tokenのJS/CSS/JSONはexact-key cache-first、missは`cache: reload`。
- 手動更新は2分間のnetwork-first修復窓をService Workerへ通知。
- staging installでversion.txtとHTML build markerを検証し、成功後だけ新世代をactivate。
- worker handshakeとactivate完了前には旧世代cacheを削除しない。
- オフライン保存は`mb-offline-save=1`でruntime cacheへの二重書込みを回避。
- `navigator.locks`と共有TTLで複数タブの確認・更新をleader化。
- BFCache復帰、長時間hidden復帰、期限切れcross-tab signalで再確認。
- flight/railの`unregister()`と広範cache削除を撤去。
- audio/video/Range/m3u8等は将来same-origin局を追加してもSW対象外。

## ページ切替・初期表示

- Home/countries/global-search/rankings/compare/learn/rice/school/japanを共通in-page routerへ統一。
- user操作は`pushState`、初期正規化は`replaceState`、`popstate`で画面とscroll位置を復元。
- Home/back/desktop icon/右側BACKが同一ページ内では全再読込しない。
- `prefers-reduced-motion`を尊重し、View Transition APIは対応環境だけ使用。
- heavy viewは選択状態を先に描画してから2回の`requestAnimationFrame`後に生成。
- 世界史、国詳細、Journey画像、photo registryをIntersectionObserver/操作時まで遅延。
- optional JSONは`Promise.allSettled`で部分成功を利用し、1件失敗で5.39MB一括fallbackを追加読込しない。

## 定量結果

- 初期ローカルJS: 36本 / 8,448,668 bytes → 25本 / 910,186 bytes（89.2%削減）
- オフラインtext manifest: 367件 → 336件
- 現行text payload: 82,960,137 bytes
- 反復version probe 25回: runtime cacheへのput 0件
- 公開HTML: 38件、controller 37件、radio playerのみcontrollerなし
- SW local reference: 199件、全て存在・現行token

## 残る実機確認

Chromium/Safariの実ブラウザが自動試験環境になかったため、iOS Safariで初回描画、BFCache、長時間background、View Transition、FCP/INPを確認してください。
