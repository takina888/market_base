# 更新サイクル

- 定期実行: 半年に一度（GitHub Actions cron: `23 3 1 */6 *`）
- 手動実行: GitHub Actions の `workflow_dispatch`
- 公開反映: QA PASS後、生成JSON・embedded fallbackをコミット

## 更新対象
- FAOSTAT: 米生産・貿易・Food Balance系
- WDI: URLは管理。V102では取得保管対象、追加変換は次段階
- 学校給食: XLSX/CSV入力を自動変換。安定URL確認後に取得自動化
- 小売: 外部一括APIではなく、内部マスター・公式確認分を管理。
