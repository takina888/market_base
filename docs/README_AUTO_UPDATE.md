# MARKET BASE 自動更新（V102）

## 目的
GitHub Pages本体は静的JSONを読むだけにし、半年に一度の更新処理で公式データを取得・変換・ランキング生成・QA・埋め込みfallback再生成まで行います。

## 実行順
```bash
python scripts/run_auto_update_pipeline.py --fetch
```

内部では以下を順番に実行します。

1. `fetch_official_sources.py` 公式bulkデータ取得
2. `update_faostat_rice_metrics.py` 米データ生成
3. `update_school_meals_metrics.py` 学校給食データ生成
4. `build_rankings.py` ランキング再生成
5. `regenerate_embedded_assets.py` embedded fallback再生成
6. `qa_public_data.py` Full196・ランキング同期・fallback確認

## 学校給食データ
School Meals Coalition/WFP/GCNF はFAOSTATほど安定した一括URLが固定されにくいため、V102では `raw/school_meals/` に配置されたXLSX/CSVを自動変換します。安定URLが確認できたものは `source_urls.json` に追加して取得対象化します。

## 公開時の注意
`.github/` と `scripts/` は更新運用のために含めます。公開サイト表示には必須ではありませんが、半年更新をGitHub Actionsで動かすために必要です。


## V103 school-meals hardening

School-meals data is less stable than FAOSTAT because the public portal exports may be XLSX/CSV snapshots rather than fixed bulk ZIP URLs. V103 therefore treats `raw/school_meals/` as a controlled source snapshot folder.

Expected files or equivalent CSV exports:

- `SML_TOTAL_CHILDREN*.xlsx` — children receiving school meals
- `EDU_ENR_PRI*.xlsx` — primary enrolment
- `EDU_ENR_PRE*.xlsx` — pre-primary enrolment
- `QLT_GDQS_MENU*.xlsx` — menu quality / GDQS score

Run order:

```bash
python scripts/validate_school_meals_sources.py
python scripts/update_school_meals_metrics.py
python scripts/build_rankings.py
python scripts/regenerate_embedded_assets.py
python scripts/qa_public_data.py
```

The transformer never lets blank or dash values overwrite existing valid values. It selects the latest valid year per ISO3 and indicator, writes a source manifest, and writes a coverage report. The derived school-meals-to-primary-enrolment ratio is explicitly marked as indicative only.
