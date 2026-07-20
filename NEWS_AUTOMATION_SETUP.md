# MARKET BASE 国別ニュース自動更新・R64拡張第1班

## 現在地

- 版：`V273_R64_NEWS_EXPANSION_BATCH1_POPUP_RC_20260719`
- 国別ニュース表示枠は196カ国の国詳細ページに共通実装済みです。
- 表示確認対象は15カ国です。
- 自動取得元を設定済みの国は10カ国です。
- 中国、ベトナム、インドネシア、マレーシア、フィリピンは試験データを保持し、取得形式の個別検証後に接続します。
- 自動翻訳は行いません。日本語以外の見出しは原文で表示し、日本語の短い案内文を付けます。

## 自動取得元を設定済みの10カ国

| 国・地域 | 主な取得元 | 方式 |
|---|---|---|
| 日本 | 農林水産省 | RSS |
| 台湾 | 衛生福利部食品藥物管理署 | RSS |
| 韓国 | 食品医薬品安全処 | RSS |
| タイ | Thai Food and Drug Administration | 公式HTML一覧 |
| シンガポール | Singapore Food Agency | RSS |
| アメリカ | U.S. Food and Drug Administration | RSS |
| イギリス | Food Standards Agency | RSS |
| カナダ | Canadian Food Inspection Agency | Atom |
| オーストラリア | Food Standards Australia New Zealand | RSS |
| ニュージーランド | Food Standards Australia New Zealand | RSS |

## 表示確認用の未接続5カ国

- 中国
- ベトナム
- インドネシア
- マレーシア
- フィリピン

無検証で `enabled: true` にしないでください。RSSがない国は、公式HTMLのDOM・日付・記事URLを確認し、必要なら取得スクリプト側へ専用処理を追加します。

## 記事リンクのポップアップ表示

- 国詳細ページと `news.html` の記事リンクは、同じページ内のポップアップで開きます。
- 外部記事はiframe表示を試みます。配信元が埋め込みを拒否した場合は、下部の「元の記事を開く」を使用します。
- 閉じ方は、右上の×、下部の「閉じる」、背景タップ、Escです。
- ポップアップを閉じるとiframeを `about:blank` に戻し、外部ページの再生・通信を停止します。
- 外部記事iframeにはsandboxを設定し、上位ページへの不要な操作を抑制します。

## GitHubへ配置した後の操作

1. 公開用ZIPの中身を、現在のGitHub Pages公開階層へ上書きします。
2. デフォルトブランチに `.github/workflows/update-news.yml` があることを確認します。
3. GitHubの **Actions** から `Update MARKET BASE country news` を開き、`Run workflow` を実行します。
4. 自己テスト、現在データ検証、公式取得、生成後検証がすべて成功したことを確認します。
5. 記事に変化がある場合、`data/news.json` のみが自動コミットされることを確認します。
6. GitHub Pages反映後、追加5カ国と既存5カ国の国詳細ページで「公式取得」表示を確認します。

ワークフローはUTC 00:17、06:17、12:17、18:17の1日4回実行します。APIキーや有料サービスは使用しません。

## 安全動作

- 公式取得元のみを許可
- 取得元ごとのホスト許可リスト
- HTTP/HTTPS以外を拒否
- 最大取得サイズ、タイムアウト、再試行回数を制限
- XMLのDTD・ENTITYを拒否
- HTMLタグとスクリプトを除去
- 不正URL、不正日時、未来日時を除外
- 公式記事URLによる重複除外
- 取得元単位で失敗を分離
- 取得失敗または有効記事0件の場合は既存データを保持
- 内容が変わらなければコミットしない

## 手元での確認

```bash
python scripts/update_news.py --self-test
python scripts/update_news.py --check
python scripts/update_news.py --dry-run
```

通常実行：

```bash
python scripts/update_news.py
```

## 次の拡張班

次はアジア優先で、中国、ベトナム、インドネシア、マレーシア、フィリピン、香港、インドなどを、公式ページの取得形式ごとにまとめて対応します。
