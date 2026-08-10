# V333.12 UL Q&A 説明拡充 監査結果

## 結論

V333.11の回答は実務手順が具体的になった一方、主要38問の説明本文が72〜114文字で、初心者向けの背景説明として不足していた。V333.12では、主要38問すべてを再構成し、説明本文、具体例、よくある誤解を追加した。

## 説明量の検査

- Q&A総数：303問
- 既存ID保持：303問
- まず見るQ&A：8問
- 実務優先Q&A：38問
- 説明拡充済み：38問
- 説明本文：最短223文字、最長308文字
- 具体例：38/38問
- よくある誤解：38/38問
- 具体的行動3項目以上：38/38問
- 完了条件：38/38問

全303問のうち299問は、Q&Aから関連する長い学習記事へ移動できる。残る4問は食品機械ケースカードに紐付くため、既存の具体例画面で確認する。

## 画面構造

主要Q&Aを開いたときの表示順を確認した。

1. なぜ大事か
2. 背景と仕組みをわかりやすく説明
3. 具体例
4. よくある誤解
5. 実際の確認手順
6. 文例
7. 完了条件
8. 条件により変わる点
9. 用語説明
10. 関連する詳しい解説
11. 公式資料

## 重要内容の確認

- 認証部品や認証済み制御盤を使っても、完成機械が自動的に認証済みになるとは説明していない。
- UL 508A制御盤の範囲と、盤が制御するモーター・ヒーター・機械的危険を分けた。
- SCCRを通常運転電流や主遮断器単体の遮断容量と混同していない。
- 接続点の利用可能短絡電流を確認し、メーカー側が盤・機械のSCCRを設計する流れを維持した。
- UL SolutionsをOSHAが認めるNRTLの一つとして説明し、顧客契約のUL指定とは分けた。
- 米国向け、カナダ向け、現地評価、最終受入れの範囲を分けた。

確認した主な一次資料：

- https://www.osha.gov/nationally-recognized-testing-laboratory-program/frequently-asked-questions
- https://www.osha.gov/nationally-recognized-testing-laboratory-program/
- https://www.ul.com/thecodeauthority/knowledge/ul-component-recognition-classification
- https://www.ul.com/resources/does-ul-certified-industrial-control-panel-certification-cover-equipment-it-controls
- https://www.ul.com/services/field-evaluations

## 機械検査

- `scripts/test_v333_12_ul_qa_explanation_depth.py`：PASS
- `data/ulce-data-v074.json`とHTML埋込みデータ：完全一致
- 全JSON 69ファイル：解析PASS
- ULページ内JavaScript 3ブロック：構文PASS
- 主要JavaScript：構文PASS
- Cloudflare Web Analytics：38/38ページでtoken各1件
- オフラインマニフェスト：V333.12識別子と`data/ulce-data-v074.json`を収録
- 食品加工機械メーカーDB：112社、485機種、既存ハッシュ一致
- ケータリング業者DB：247社、追加調査81社、出典311件を維持

この実行環境ではブラウザ本体を取得できないため、ブラウザ画像による最終目視は未実施。公開後にスマートフォンで主要Q&Aを1件開き、長文の折返しと関連解説ボタンを最終確認する。

