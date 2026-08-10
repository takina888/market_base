# V333.16 ラジオ・UI・初期表示の原因と修正

## 1. ラジオの早送り様再生

### 原因

旧playerの停止処理は`audio.pause()`だけで、MP3/AACの`src`、native HLS、hls.jsインスタンスを保持していました。再生時も同じ局IDと既存srcがあれば準備処理を省略したため、長時間停止後も古いライブ接続・媒体時刻・バッファから再開していました。Safariのライブ追従がこの遅れを埋める動作が、早送りのように聞こえる構造でした。

全ラジオストリームは外部originで、Service Workerは外部の非画像requestを処理しません。したがって音声streamそのものをCache APIから再生していた問題ではありません。

連続ON/OFFでは、先行する`audio.play()` Promiseの遅延rejectや古い`pause`/`playing`イベントが、後のユーザー操作後に到着し、最新状態を上書きできる競合もありました。bfcache復帰では`pagehide`の一回限りlistenerとBroadcastChannel再生成漏れもありました。

### 修正

- 明示停止時にHLS、src、媒体バッファを破棄し、次の再生を必ず新しいライブ接続にする
- 再生前に`defaultPlaybackRate`と`playbackRate`を1へ戻す
- 再生試行・transport・watchdogを世代番号で管理し、旧Promise/旧イベントを無視する
- hiddenになっただけでは中断扱いせず、実際のpause/stall時だけ復帰対象にする
- bfcacheのpersisted/non-persisted pagehideとpageshowを繰り返し処理できるようにする
- player stateの有効期限を明示し、現行stateでは期限切れを12時間延命しない
- Service Workerでaudio/video、Range、HLS/音声拡張子を明示的に非介入とする

## 2. メインページだけタブが右端へ移動する

### 原因

旧CSSの初期位置は右端から12px内側でしたが、JSの保存位置復元後は右端0pxへ補正していました。また、展開状態のDOMを挿入してから折りたたみへ変更し、0.24秒のtransition途中で表示していました。動的CSSの読込前にDOMを生成する経路もありました。

### 修正

- CSS初期位置とJSの最終位置を同じ右端0pxへ統一
- 折りたたみ状態をDOM挿入前に確定
- CSS読込、寸法計測、最終clampが終わるまでdockを非表示にするready gateを追加
- 初期配置中のtransitionを無効化
- メインページではdock CSSをheadで読み、重い末尾scriptより先に小さなdock bootstrapを実行

## 3. ドラッグ不能と矢印への重なり

### 原因

旧実装は約23×18pxのgripだけにpointer listenerがあり、見えている「RADIO」タブ中央は開閉clickのみでした。位置制約もviewportとsafe areaだけで、右側の上・戻る・下ボタンの実座標を考慮していませんでした。

### 修正

- タブ全体をドラッグ面に変更
- 6pxの移動閾値より小さい操作は従来どおり開閉、超えた操作はdragとしてclickを抑止
- 上矢印の実`getBoundingClientRect()`を取得し、dock下端を常に10px以上上へclamp
- 保存位置復元、drag、resize、orientationchangeを同じ制約関数へ統一
- ResizeObserver/MutationObserverで矢印railの表示・寸法変化を追跡
- 320×568、375×667、390×844、430×932のportrait契約を自動試験

## 4. メインページが重い

### 計測結果

- 国旗bundle: 176,096B、gzip約42.7KB
- 旧full横断検索index: 5,090,411B、gzip約806.5KB
- 新初期summary: 7,840B、gzip約2.2KB
- 初期ローカルscript合計: 13,496,019Bから8,448,668Bへ約5.05MB削減
- gzip換算: 2,753,386Bから1,957,892Bへ約0.80MB削減

国旗bundleにも負荷はありますが、主因は巨大なfull検索index、初期に不要な複数データ、非表示画面の国旗SVG/ランキングDOM生成、Service Workerがnetwork responseよりCacheStorage書込完了を優先していたことでした。

### 修正

- full横断検索indexを検索focus/submit時の遅延読込へ変更
- 初期は8 DBのsummaryだけを読込
- 国一覧、ランキング、比較、出典、QA、各domain viewを初回表示時に描画
- ホーム必須JSON 3件を先に反映し、任意domain JSON 10件を後段で取得
- 任意ランキングの到着時に現在値を保ったまま選択肢を再構築
- document prefetch 11件をload後のidleへ移動し、Save-Data/2Gでは実行しない
- version付きJS/CSS/JSONをexact-key cache-firstにし、runtime cache書込を`waitUntil`へ移してresponseを先に返す

## 5. 互換性

新規dockは`market-base-radio-dock-v333-16.js/css`として追加し、現行controllerだけが参照します。旧controllerはV335 shimとして残し、古いキャッシュからの更新経路を維持します。radio playerは再生中の強制reloadを避けるため、従来どおりglobal update controllerの対象外です。
