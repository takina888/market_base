# V333.9 上書き更新手順

1. 現在のV333.8一式をバックアップします。
2. 上書き用ZIPを、既存のMARKET BASEルートへ展開します。
3. 同名ファイルはすべて上書きします。
4. ブラウザを再読み込みし、必要に応じてService Workerを更新します。
5. `version.txt` が `MARKET_BASE_V333_9_CATERING_EXTERNAL_SOURCE_20260803` であることを確認します。
6. `flight-kitchen-v273-db-title-r27.html` を開き、「ケータリング・機内食業者DB」、247社、追加調査件数、根拠リンクを確認します。
7. `python scripts/test_v333_9_catering_external_source.py` を実行します。

既存V333.8の日本食品機械メーカーDB更新内容は保持されます。
