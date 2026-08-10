# V333.18 原因と修正

## 1. ラジオの長時間停止後の早送り

### 原因

- 停止処理が`audio.pause()`だけで、ライブ音声の`src`、HLS接続、古いバッファを残していた。
- 再生時に同じ局と既存`src`を検出すると、ライブ位置へ再接続せず旧接続を再利用していた。
- 連続ON／OFF時、古い`audio.play()` Promiseや遅れて届くpause／playingイベントが最新操作を上書きできた。

### 修正

- 明示停止時にHLSを破棄し、`src`を外して`load()`し、次回再生は新規接続にした。
- 再接続時に`defaultPlaybackRate`と`playbackRate`を1へ戻す。
- 再生世代番号とイベントガードを追加し、最後のユーザー操作だけを有効にした。
- iPhoneのnative HLSでは外部hls.jsを待たず、必要な端末／局だけ動的に読み込む。

## 2. ラジオタブの初期移動、ドラッグ不能、矢印との重なり

### 原因

- メインページだけbodyへ`transform`付きページ表示アニメーションを適用していた。
- 固定要素の基準が一時的に変わり、アニメーション途中でclassを外すため、端から離れた位置から右端へ飛んでいた。
- ドラッグ開始範囲が18px程度の小さなグリップだけだった。
- 保存位置・回転・画面幅変更時の位置制限に右下スクロール操作帯を含めていなかった。

### 修正

- body／html／rootのtransformを廃止し、固定UIを含まないmainのopacityだけを変える。
- ページ表示処理を通常`pageshow`一系統へ統一し、アニメーションを途中で切らない。
- RADIOタブ全体をドラッグ開始範囲にした。
- 上矢印の実座標を位置上限へ組み込み、初期・保存復元・ドラッグ・resizeで同じ制限を使う。

## 3. キャッシュ／オフライン更新

### 原因

- オフラインsentinelを消してもService Workerの1秒メモが残り、保存済み`version.txt`を実通信の回答として使えた。
- 通信失敗時にもcore cacheの`version.txt`へfallbackし、オンライン成功と誤認して保存内容を削除できた。
- 手動更新のnetwork修復期限がService Workerのメモリだけにあり、iOSでworkerが再起動すると遅延資産が旧キャッシュへ戻った。
- 画像・SVGはqueryを無視した旧世代一致を許し、最初の1回だけ旧画像を表示できた。

### 修正

- 接続確認用`version.txt`はService Workerのoffline判定より前に実ネットワークへ送り、cache fallbackを禁止。
- `OFFLINE_MODE_CHANGED`を世代番号付きACKにし、保存・削除はACK後だけ開始。
- 古い世代の非同期完了は新しいオフライン状態を上書きできない。
- 手動修復期限を小容量CacheStorageへ保存し、worker再起動後の遅延JS／JSON／画像／SVGにも適用。
- current-token資産はexact keyのみを使い、releaseをまたぐ`ignoreSearch`を禁止。
- canonical documentの同時通信を共有し、先読み直後の本遷移による二重通信を防止。

## 4. ページ切替とスクロール復元

- main内のHome／国一覧／ランキング／比較／学ぶは同一ページrouterで切り替える。
- `history.scrollRestoration='manual'`を使い、scroll／scrollend／遷移直前／pagehideで現在位置を保存。
- 戻る／進むは画面描画完了後に2フレーム待って位置を復元。
- iPhoneのtouchstart先読みを廃止し、スクロール操作だけで通信しない。
- PCのmouse hoverとkeyboard focusによる先読みは維持。

## 5. メインページの重さ

### 原因

- 国旗bundleは176KBで、主因ではなかった。
- 初期表示後に任意JSON 10本（約4.94MB）と国詳細3本（約1.25MB）を自動取得・解析していた。
- 横断検索欄をfocusしただけで約5MBの検索索引を読み込んでいた。
- 国一覧196件と多数のinline SVGを一括生成していた。

### 修正

- 任意JSONはrice／school／japan／rankings／compare／detail単位の初回利用時読込へ変更。
- ファイルごとに到着直後反映し、一時失敗は次回操作で再試行できる。
- 国詳細の自動idle読込を廃止。オフライン、非表示、Save-Data、2G、ラジオ再生中は非必須warmupを行わない。
- 5MB検索索引はfocusでは読み込まず、検索送信時に読み込み、busy状態を表示。
- 国一覧は最初の30件を表示し、残りは24件ずつ段階描画。
