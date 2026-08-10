# V333.11 UL Q&A 再設計 監査結果

## 結論

V333.11のUL Q&A再設計は、データ保持、内容構造、公式根拠、画面実装、既存機能の回帰確認に合格した。

## Q&Aデータ

- データ版：`v073 / 2026-08-03`
- 旧Q&A保持：300問
- 新規追加：3問
- 合計：303問
- まず見るQ&A：8問
- 実務優先Q&A：38問
- 専門Q&A：303問すべてを表示・検索可能
- ID重複：0

実務優先Q&Aの段階別件数は次のとおり。

- 必要か判断：9問
- 顧客・見積：8問
- 設計・部品：7問
- 申請・試験：4問
- 製造・出荷：5問
- 据付・改造：5問

## 表現と実務性

主要38問は、次の要素を満たすことを機械検査した。

- なぜ知る必要があるか
- 専門語に依存しない説明
- 誰が、いつ、何を、どこへ記録するか
- 次工程へ進める完了条件
- 条件によって変わる点
- 難しい言葉の日本語説明
- 公式一次資料

固定見出し「実務で行うこと」は廃止し、「見積前に顧客へ確認すること」「営業資料へ書くこと」など、質問ごとの行動名へ変更した。

## 重要な事実確認

次の論点をOSHAおよびUL Solutionsの一次資料と照合した。

- ULだけが米国で一律に必須という説明を避け、OSHAのNRTL制度と顧客・設置地の要求を分けた。
- 認証部品やUL 508A制御盤を使っても、完成機械全体が自動的に認証済みにはならない。
- 認証部品は、組込み時の使用条件を確認する。
- 「UL対応」は正式な認証区分として扱わない。
- 米国向けの認証をカナダ向け認証と自動的に同一視しない。
- 現地評価後も、設置地の最終受入れは別に確認する。
- 接続点の利用可能短絡電流を確認し、メーカー側で機械のSCCRを設計・表示する流れへ修正した。

確認した主な一次資料：

- https://www.osha.gov/nationally-recognized-testing-laboratory-program/frequently-asked-questions
- https://www.ul.com/resources/preparing-your-ul-mark-evaluation-us-and-canada
- https://www.ul.com/resources/does-ul-certified-industrial-control-panel-certification-cover-equipment-it-controls
- https://www.ul.com/thecodeauthority/knowledge/ul-component-recognition-classification
- https://www.ul.com/services/field-evaluations
- https://www.ul.com/resources/follow-up-services
- https://www.ul.com/news/put-ul-mark-your-marketing

## 画面・データ検査

- `scripts/test_v333_11_ul_qa_rewrite.py`：PASS
- JSON 68ファイル：全件解析PASS
- ULページ内JavaScript 3ブロック：構文PASS
- 主要JavaScript：構文PASS
- Q&Aの埋込みデータと`data/ulce-data-v073.json`：完全一致
- オフラインマニフェスト：V333.11識別子と`./data/ulce-data-v073.json`を収録
- モバイル向けCSS：1列表示、横スクロール式の段階ボタン、長文折返しを実装

この実行環境にはブラウザ本体がなく、Playwright用Chromiumの取得先も遮断されたため、ブラウザ画像による最終目視だけは未実施。公開後に390px前後の実機で、段階ボタンと長いQ&Aを1件開いて最終確認する。

## 既存機能の回帰

- Cloudflare Web Analytics：公開HTML 38/38ページで正規コードとtokenが各1件
- ケータリング業者DB：247社、追加調査81社、出典311件を維持
- 食品加工機械メーカーDB：112社、485機種、調査74社を維持
- 食品加工機械DBおよび調査JSON：既存ハッシュ一致
- V333.10の旧識別子：公開中に使う実行ファイルから検出なし

旧版テストの一部はV333.8〜V333.10の固定ビルドIDを期待するため、そのままでは版番号差のみで失敗する。検査内容をV333.11識別子へ読み替えた同一確認はすべて合格した。

