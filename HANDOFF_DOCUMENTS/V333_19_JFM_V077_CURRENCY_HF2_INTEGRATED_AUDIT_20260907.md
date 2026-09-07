# MARKET BASE V333.19 累積統合再監査報告

作成日: 2026-09-07  
対象: MARKET BASE V333.19 + 日本の食品機械メーカーDB V077 日本語版 + 為替計算機 HF2

## 結論

V333.19へ上書きする差分は、為替計算機1ファイルだけでは不十分です。
今回、日本の食品機械メーカーDB V077の更新内容をV333.19本体へ実装し、表示・検索・キャッシュ・オフラインmanifest・横断検索・固定件数・回帰テストまで連動更新した累積差分を作成しました。

公開表示の版名は `V.333.19` を維持し、内部ビルド世代だけを次へ更新しています。

- BUILD_ID: `MARKET_BASE_V333_19_JFM_V077_CURRENCY_HF2_20260907`
- ASSET_VERSION: `20260907-v333-19-jfm-v077-currency-hf2`
- Offline Manifest: `MARKET_BASE_OFFLINE_MANIFEST_V333_19_JFM_V077_CURRENCY_HF2_20260907`

## 日本の食品機械メーカーDB 統合内容

最終データ:

- メーカー: 191社
- 製品・型式: 2,528件
- 製品ありメーカー: 169社
- 製品なしメーカー: 22社
- 数値能力あり: 1,309件
- 旧製品ID `JFM-0001`〜`JFM-0485`: 485件すべて保持
- `additional_information_public`: 1,744件
- `legacy_search_terms`: 25件
- `legacy_information_public`: 25件

横断検索:

- JFM検索レコード: 2,719件
- 全DB横断検索: 5,175件

主な本体側連動修正:

1. `data/japan_food_machinery_db_v075.json` をV077互換マージデータへ更新。
2. オフライン用JSミラーも同一内容へ更新。
3. 横断検索index/summaryを更新。
4. ホーム固定件数を `112 / 485` から `191 / 2,528` へ更新。
5. JFM検索へ `additional_information_public` / `legacy_search_terms` / `legacy_information_public` を接続。
6. 製品詳細へ「追加情報」「関連型式・名称」「関連型式・旧情報」を条件付き表示。
7. 削除済みの `輸出情報調査注記` を参照していた「調査上の注記」行を撤去。
8. 191社分の公式サイトプレビュー候補を再生成。既存の検証済みallowlistは維持し、新規候補は未検証のままfail-closed。
9. キャッシュ世代・`version.txt`・Service Worker・offline manifestを同一世代へ更新。
10. 旧V333.19回帰テストの固定ビルドトークンを新しい内部世代へ更新。

## 為替計算機 HF2 統合内容

HF2で、以下を含む誤計算経路を修正済みです。

- 保存レートが新しくてもオンライン最新確認を止めない。
- レートに基準通貨を紐付け、別基準のレートを誤使用しない。
- 基準通貨切替時の古いAPI応答競合を遮断。
- 新基準レートが取れないときに旧基準レートで計算しない。
- カード並べ替え中の非同期取得結果を正しく反映。
- 非同期更新で入力フォーカス・入力値を失わない。
- オンライン復帰・15分経過後に再確認。
- 「レート日」と「取得日時」を分離表示。

## 自動監査結果

### 日本の食品機械メーカーDB統合監査

`32 / 32 PASS`

主な確認:

- 191社 / 2,528製品
- ID重複なし
- メーカー参照切れなし
- 旧485製品ID全保持
- JSONとJSミラー完全一致
- 横断検索 2,719 / 5,175
- ホーム固定件数更新済み
- 旧型式 `FRT-10` 検索可能
- 追加情報が製品詳細へ表示される
- 旧「調査上の注記」非表示

### 為替計算機 HF2 再監査

`44 / 44 PASS`

基準通貨切替、API競合、保存キャッシュ、部分レート、未知通貨、15分更新、入力保持、37通貨選択などを含めて確認済みです。

### V333.19 全体回帰

以下すべてPASS:

- Release Integrity
- Samsung Internet Install Helper Contract
- Offline Manifest Hardening
- Cache Coherence
- Cache/Runtime Lifecycle
- Android Install Contract
- Navigation/Performance Contract

Release Integrity実測:

- Public HTML: 38ページ
- Update Controller対象: 37ページ
- Service Worker参照: 202
- Offline text assets: 339
- 現行JavaScript: Node構文検査PASS

## 互換性とキャッシュ

公開名 `V.333.19` は変更していませんが、内部のBUILD_ID/ASSET_VERSIONを更新しています。これにより、既存のV333.19を使っている端末でも更新世代を識別できます。

PWAの既存アプリidentityはV333.10互換のまま維持しています。Androidラッパー、Samsung用導線、ラジオ仕様を別物へ置換していません。

## 上書き方法

上書きZIPは、余分な親フォルダを持たずV333.19のルート相対パスで作成します。
V333.19の公開フォルダにそのまま展開・上書きしてください。

削除対象ファイルはありません。

上書き後:

1. オンライン状態でMARKET BASEを開く。
2. MARKET BASE内の「更新」を1回実行。
3. ホームの日本食品機械メーカー件数が `191 / 2,528` であることを確認。
4. 為替換算を開き、オンライン更新表示が正常であることを確認。
5. 可能ならiPhone Safari / Chrome / Samsung Internetで各1回スモーク確認。

## 補足

日本食品機械V077の元検証資料では、旧版で公開対象外扱いの注記があった株式会社クレオについて、新Excel側には11製品が収録されています。今回の互換マージは「新Excelを優先」の方針に従い収録しています。データ破損ではなく公開方針上の確認事項です。
