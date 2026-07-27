# 次担当者向け確認項目

1. R113.67通常フォルダ構成版の `GITHUB_UPLOAD_ROOT` をバックアップする。
2. 差分ZIPの `APPLY_TO_GITHUB_UPLOAD_ROOT` の中身を上書きする。
3. `DELETE_FROM_GITHUB_UPLOAD_ROOT.txt` の対象を削除する。
4. GitHub Pages公開後、Service Workerを更新またはサイトデータを再読込みする。
5. ホーム下部の「今日のコンビニ・スーパー紹介画像集」直後にロゴ一覧があることを確認する。
6. 8ページを左右スワイプ／前後ボタンで切り替えられることを確認する。
7. 各ページの左上・右下を含む16ロゴが押せることを確認する。
8. 直接リンクが小売詳細カードへスクロールすることを確認する。
9. Amazon FreshとAhold DelhaizeがDB検索結果へ移動することを確認する。
10. スマホ、半幅PC、通常PCで下部ナビや右下3ボタンと重ならないことを確認する。
11. `python scripts/test_retail_logo_directory.py` を実行する。
12. 主要回帰検査を再実行する。
