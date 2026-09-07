# V333.19 累積上書き手順

対象ZIP: `MARKET_BASE_V333_19_JFM_V077_CURRENCY_HF2_INTEGRATED_OVERWRITE_20260907.zip`

このZIPは、元の `MARKET_BASE_V333_19_FULL_HANDOFF_AND_DATA_20260810` に対する累積差分です。
為替HF2だけでなく、日本の食品機械メーカーDB V077統合、検索index、ホーム件数、JFM UI、キャッシュ世代、Service Worker、offline manifest、回帰テスト更新を含みます。

## 手順

1. 現在のV333.19公開フォルダをバックアップ。
2. ZIPをV333.19のルートへ展開。
3. 同名ファイルはすべて上書き。
4. 削除するファイルはありません。
5. 公開後、オンライン状態でMARKET BASEの「更新」を1回実行。

## 目視確認

- ホーム: 日本の食品機械メーカー `191メーカー / 2,528製品・型式`
- JFM詳細: 追加情報・関連型式が必要な製品だけ表示される
- JFM検索: 旧型式検索も可能
- 為替換算: 最新確認が走り、基準通貨変更後も数値が破綻しない
- オフライン/PWA: 更新後に通常起動できる

## 重要

以前の `MARKET_BASE_V333_19_CURRENCY_RATE_HF2_OVERWRITE_20260907.zip` は為替修正だけの小差分です。
日本食品機械V077を含む最新累積状態へする場合は、今回のINTEGRATED OVERWRITEを使用してください。
