# MARKET BASE V333.15 「この国ならでは」全196件 引き継ぎ書

## 版情報

| 項目 | 内容 |
|---|---|
| 表示版 | MARKET BASE V.333.15 |
| ビルドID | `MARKET_BASE_V333_15_COUNTRY_DISTINCTIVE_FACTS_20260809` |
| アセット識別子 | `20260809-v333-15-country-distinctive-facts` |
| 基準版 | V333.14 |
| 作成日 | 2026-08-09 |

## 今回の反映内容

国別詳細196件すべてに、短く興味を引く情報欄 **「この国ならでは」** を1件ずつ追加しました。

表示順は次のとおりです。

1. 国別プロフィールの概要
2. 首都・公用語・通貨・政治体制など既存の基本情報
3. **この国ならでは**
4. 概要・基本統計
5. 電源、宗教、産業、食文化、歴史、現地ルール、出典

既存の国別プロフィール本文、基本統計、各DBデータは削除・置換していません。

## 表示仕様

各項目は横幅いっぱいの読み物形式で、次を表示します。

- 見出し: `この国ならでは`
- 分類: 暦・時間、国の仕組み、言語・文字、通貨・お金など
- 短いタイトル
- 39～80文字の説明本文
- 個別の参照元リンク

PCではタイトル24px・本文18px、スマートフォンではタイトル22px・本文17.5pxを基準にしています。小さなカードを並べず、1件を横長で読みやすく表示します。

## 代表例

- エチオピア: **1年が13か月ある**
- 台湾: **1912年が「民国元年」**
- 中国: **広い国土でも標準時は一つ**
- 香港: **郵便番号がない**
- マレーシア: **国王は9人の君主から選ばれる**
- サモア: **2011年12月30日が存在しなかった**

パキスタンは、方向が異なっていた「トラックアート」を採用せず、**国語はウルドゥー語、行政では英語も使われる**という言語制度の情報に差し替えています。

## 正規ファイル

- データ: `data/country-distinctive-facts-v333-15.js`
- データ生成元: `scripts/build_country_distinctive_facts_v333_15.py`
- 表示レンダラー: `assets/js/app-v273-country-profile-r28-refresh-route-header-r96.js`
- 専用CSS: `assets/css/country-distinctive-facts-v333-15.css`
- 一覧CSV: `HANDOFF_DOCUMENTS/V333_15_COUNTRY_DISTINCTIVE_FACTS_INDEX_20260809.csv`
- 一覧JSON: `HANDOFF_DOCUMENTS/V333_15_COUNTRY_DISTINCTIVE_FACTS_INDEX_20260809.json`

## データ構造

```javascript
window.MARKET_BASE_COUNTRY_DISTINCTIVE_FACTS = {
  version: "MARKET_BASE_COUNTRY_DISTINCTIVE_FACTS_V333_15_20260809",
  updated: "2026-08-09",
  count: 196,
  items: {
    ET: {
      category: "暦・時間",
      title: "1年が13か月ある",
      body: "…",
      source_name: "エチオピア大使館",
      source_url: "https://…"
    }
  }
};
```

既存の巨大な国別プロフィールデータとは分離しているため、今後の差し替えや文章修正はこのデータだけで行えます。編集後は生成スクリプトを実行し、テストを再実行してください。

## 更新・オフライン対応

V333.14のキャッシュ・更新安定化を維持し、V333.15用のビルド、更新コントローラー、オフラインマニフェストへ更新しました。新しいデータ、CSS、レンダラーはService Workerの必須ファイルに含めています。

- `market-base-build-v335.js`
- `market-base-runtime-v335.js`
- `market-base-update-controller-v335.js`
- `market-base-offline-manifest-v335.js`
- `offline-settings-v335.js`

旧V334以前の更新制御ファイルは、古いキャッシュからV333.15へ移動する互換シムとして残しています。削除しないでください。

## データ監査結果

- MARKET BASEの国・地域コードとの一致: 196／196
- 既存プロフィールとの一致: 196／196
- 欠落: 0
- 重複コード: 0
- 空タイトル・空本文・空出典: 0
- `http` / `https`以外の出典URL: 0
- 出典ドメイン: 184種類
- タイトル長: 8～26文字
- 本文長: 39～80文字

詳細な試験結果は `V333_15_TEST_REPORT_20260809.md` を参照してください。
