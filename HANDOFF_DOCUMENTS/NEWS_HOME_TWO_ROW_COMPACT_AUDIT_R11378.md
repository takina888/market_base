# R113.78 ホームニュース2行小型化監査

## 要求と反映

- 「ニュース」と「自動切替を停止／再開」を1行へ統合。
- 「海外ニュース」以下5カテゴリーを3行から2行へ変更。
- 上段は海外ニュース・食品機械・食品工場、下段は小売店・規制関連。
- 下段2項目は均等幅。
- タブを小型化し、370px以下でも文字・枠のはみ出しを防止。

## 変更ファイル

- `assets/css/market-base-news-tabs-v1.css`
- `index.html`
- `assets/js/market-base-build.js`
- `manifest.json`
- `sw.js`
- `scripts/test_todays_journey_images.mjs`
- `scripts/test_news_home_compact_layout.py`（追加）

## 検査結果

- 専用レイアウト検査: 11/11 PASS
- ニュース取得・障害時保持検査: PASS
- HTML: 28/28 HTTP PASS
- ローカル参照欠落: 0
- JavaScript構文エラー: 0
- JSON構文エラー: 0
- Service Worker CORE欠落: 0
