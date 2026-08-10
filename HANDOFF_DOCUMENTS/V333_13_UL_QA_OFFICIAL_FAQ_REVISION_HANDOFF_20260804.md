# V333.13 UL・CE Q&A 公式FAQ照合・構成見直し 引き継ぎ

## 修正理由

V333.12では主要38問の説明量を増やしたが、全Q&Aへ同じ形式の「実務で行うこと」を付ける構造が残っていた。質問への答えと関係が薄い担当者、社内帳票、承認手順まで規格上の要求のように見え、かえって分かりにくくなる項目があった。

また、既存Q&Aは公式サイトの解説を中心に作成していたが、公式FAQに実際に寄せられている質問との横断照合が不足していた。

## 新しい表示構造

Q&Aを開いたときは、存在する項目だけを次の順で表示する。

1. この質問が大切な理由（主要質問のみ）
2. 詳しい説明
3. 具体例（必要な質問のみ）
4. よくある誤解（必要な質問のみ）
5. つまりどういうこと？（意味の補足が必要な質問のみ）
6. 判断するときのポイント（案件条件で選択が変わる質問のみ）
7. 次に確認すること（具体的な確認対象がある質問のみ）
8. 難しい言葉の説明
9. 関連する詳しい解説
10. 根拠となる公式資料

固定の「実務で行うこと」、文例、完了条件、担当役職、帳票名は表示しない。規格・法令上の確認事項と、各社が自由に決める社内運用を混同させない。

## 303問の個別監査

北米制度、電気・SCCR・安全、CE・ガス・蒸気・食品機械実例の3群に分け、既存303問を全件監査した。

|表示方法|件数|用途|
|---|---:|---|
|つまりどういうこと？|20|短い回答だけでは意味を取り違えやすい|
|判断するときのポイント|78|市場、用途、方式など案件ごとの選択が必要|
|次に確認すること|177|型式、定格、設置条件など具体的な確認対象がある|
|補助欄なし|28|回答本文だけで完結する|

監査原本は`research/v075_north_action_audit.json`、`v075_electrical_action_audit.json`、`v075_ce_process_action_audit.json`に保存した。

## 公式FAQから追加した12問

### OSHA・NRTL

- OSHAが機械そのものを認証・推薦するのか
- OSHAが日本メーカーへ直接NRTL認証取得を義務付けるのか
- 別NRTLの認証部品や試験成果を別NRTLが受け入れるのか
- 共通の「NRTLマーク」があるのか

### UL Solutions

- 初期試験を日本のメーカー工場で行えるのか
- 試験後の完成機をそのまま販売できるのか
- 不適合が出たら申請は終了するのか
- OEM品を自社ブランドで販売する正式手続き
- 「UL規格適合」表示があるのにProduct iQで見つからない製品の扱い
- 現地評価を依頼できる人

### EU

- CE対象外の製品へ任意でCEマークを付けられるのか
- 日本メーカーが適合宣言を作ればEU輸入者は確認不要なのか

画面には「公式FAQから追加」フィルターと「公式FAQを基に整理」表示を追加した。原文の転載ではなく、公式FAQの論点を食品機械輸出向けの日本語Q&Aへ再構成している。

## 本文を修正した51問

事実監査で指摘された内容を、短い結論と説明本文へ直接反映した。主な対象は次のとおり。

- OSHA、NRTL、CEの関係
- UL 508A Panel Shopと機械全体の範囲
- Listed／Recognized部品と組込み条件
- SCCR、利用可能短絡電流、電流制限、組合せ定格
- 主電源遮断、プラグ、UL 508／UL 98／UL 489の用途
- Notified Body、適合宣言署名者、説明書言語
- Machinery Directive／Machinery Regulationの切替時期
- GARの対象外条件、適合評価モジュール、整合規格
- PEDのPS 0.5 bar境界とSound Engineering Practice
- IEC 60335厨房機器規格のScopeとEU官報引用EN版

最終置換案は`research/v075_*_corrections_final.json`へ保存し、ビルド時に内部監査理由を公開データへ混入させず、回答本文と一次資料だけを取り込む。

## 更新方法

Q&Aを修正するときは次の順で再生成する。

1. `python3 scripts/build_ulce_qa_v075.py`
2. `python3 scripts/embed_ulce_data_v075.py`
3. `node scripts/build_offline_manifest_v324.mjs`
4. `python3 scripts/test_v333_13_ul_qa_official_faq_revision.py`

データの正本は`data/ulce-data-v075.json`、画面で使う埋込みデータは`ul-ce-learning/index.html`内の`window.MARKET_BASE_ULCE_DATA`である。テストは両者の完全一致を確認する。

## 主な一次資料

- OSHA NRTL FAQ：<https://www.osha.gov/nationally-recognized-testing-laboratory-program/frequently-asked-questions>
- OSHA Products Requiring Approval：<https://www.osha.gov/nationally-recognized-testing-laboratory-program/products-requiring-approval>
- UL Solutions Submitting Products FAQ：<https://www.ul.com/resources/submitting-products-faq>
- UL Solutions Field Evaluations：<https://www.ul.com/services/field-evaluations>
- UL Code Authority FAQ：<https://code-authorities.ul.com/about/code-authority-faqs/>
- 欧州委員会 CE marking：<https://single-market-economy.ec.europa.eu/single-market/goods/ce-marking_en>
- 欧州委員会 Importers and distributors：<https://single-market-economy.ec.europa.eu/single-market/goods/ce-marking/importers-and-distributors_en>
- Machinery Regulation (EU) 2023/1230：<https://eur-lex.europa.eu/eli/reg/2023/1230/en>
- Gas Appliances Regulation (EU) 2016/426：<https://eur-lex.europa.eu/eli/reg/2016/426/2026-05-29/eng>
- Pressure Equipment Directive 2014/68/EU：<https://eur-lex.europa.eu/eli/dir/2014/68/2026-05-30/eng>
