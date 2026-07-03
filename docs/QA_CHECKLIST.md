# QAチェックリスト V102

## 自動QA
```bash
python scripts/qa_public_data.py
```

確認項目:
- Full196維持
- 台湾・香港・マカオ・日本の保持
- 米データ196件
- 学校給食データ196件
- ランキングIDがFull196内に収まること
- embedded fallbackの存在
- プレースホルダー実装文言が残っていないこと

## 実機QA
- 国から探す
- ランキングから探す
- 地域から探す
- 最近見た国
- 国旗/国カードクリック
- 詳細ページ横幅
- 米データ/学校給食ランキング
- 小売表示（台湾・日本・中国・インドネシア・米国）


## V103 school-meals QA additions

- Confirm `raw/school_meals/` contains the four source snapshots or updated equivalent exports.
- Run `scripts/validate_school_meals_sources.py` before transformation.
- Confirm `data/market_base_school_meals_coverage_report_v103.json` exists.
- Confirm `data/market_base_school_meals_source_manifest_v103.json` records file names, SHA-256 hashes and metadata.
- Confirm `school_meals_total_children` coverage remains above 140 countries/regions unless the source export changed.
- Confirm no public UI shows internal keys such as `school_meal_system` or `school_meal_target`.
