# MARKET BASE 公開アップロード用 CLEAN FINAL

このフォルダの「中身だけ」を GitHub リポジトリ `market_base` の直下へアップロードしてください。

## 先に削除推奨
GitHub直下に以下が残っている場合は削除してください。

- `UPLOAD_FOLDERS/`
- `UPLOAD_BATCHES/`
- `01_CORE_DATA_APP_UPLOAD_FIRST/`
- `02_FLAGS_SVG_PART_1_UPLOAD_SECOND/`
- `03_FLAGS_SVG_PART_2_UPLOAD_THIRD/`
- `assets/flags/svg/`
- `assets/flags/svg_part_1/`
- `assets/flags/svg_part_2/`
- `MB_V82...`、`MB_V83...`、`MB_V84...` などの親フォルダ

## アップロードするもの
このフォルダ内の以下を直下に置きます。

- `index.html`
- `.nojekyll`
- `manifest.json`
- `sw.js`
- `version.txt`
- `embedded-data.js`
- `embedded-retail-data.js`
- `embedded-retail-presence-data.js`
- `assets/`
- `data/`

## 分けて入れる場合の順番
一括で入れられない場合は以下の順番にしてください。

1. `data/`
2. `assets/`
3. `embedded-data.js`
4. `embedded-retail-data.js`
5. `embedded-retail-presence-data.js`
6. `manifest.json`
7. `sw.js`
8. `version.txt`
9. `.nojekyll`
10. `index.html`

最後に `index.html` を入れるのが安全です。

## アップロード後確認

- `https://takina888.github.io/market_base/?v=clean-final-20260701`
- `https://takina888.github.io/market_base/assets/js/app.js`
- `https://takina888.github.io/market_base/assets/flags/flag-svg-data.js`
- `https://takina888.github.io/market_base/data/market_base_entities_basic_stats_full196_rc.json`
- `https://takina888.github.io/market_base/embedded-data.js`

