# V333.10 Cloudflare Web Analytics 実装内容

## 実装方針

MARKET BASEは複数HTMLで構成されているため、トップページだけでなく、公開対象の全38 HTMLへCloudflare Web Analyticsの公式計測コードを追加した。コードは各ファイルの `</body>` 直前に1回だけ配置している。

## 使用した計測コード

```html
<!-- Cloudflare Web Analytics --><script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"8cd800af9e2541f2ba41adb0d3c46a75"}'></script><!-- End Cloudflare Web Analytics -->
```

## 反映範囲

- ルートHTML: 19ページ
- サブディレクトリ内HTML: 19ページ
- 合計: 38ページ
- `index.html`: 1回
- 各DB、読み物、物流、ラジオ、設定、ツール、オフラインページ: 各1回

## 既存機能への配慮

- 計測スクリプトは `type="module"` の外部スクリプトとして読み込む。
- 同一オリジン用Service WorkerはCloudflareの外部スクリプト要求を処理しないため、既存キャッシュを汚さない。
- ネット接続がない場合は計測されないが、保存済みHTML・DB・画像のオフライン利用には影響しない。
- 管理画面や個人識別機能はMARKET BASE本体へ追加していない。

## 元資料

`MARKET_BASE_Cloudflare_Web_Analytics_引き継ぎ書_20260803.docx`
