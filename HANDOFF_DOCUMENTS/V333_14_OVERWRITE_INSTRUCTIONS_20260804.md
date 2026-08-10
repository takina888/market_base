# V333.13からV333.14への上書き手順

## 使用するファイル

`MARKET_BASE_V333_14_OVERWRITE_FROM_V333_13_20260804.zip`

## 手順

1. ZIPを展開します。
2. 展開した内容を、現在のMARKET BASE公開リポジトリのルートへ、フォルダ構造を維持して上書きします。
3. GitHub Pagesの場合は、追加・変更ファイルを同じコミットで反映してください。
4. Pagesのデプロイ完了後、公開サイトのトップを開きます。
5. ヘッダーの「更新」を一度押します。
6. 更新後にボタンが「更新」へ戻り、URLへ `refresh`、`autoRefresh`、`v` が残らないことを確認します。
7. 為替換算、UL/CE、国際物流ガイド、設定ページを一度開き、表示が通常どおりであることを確認します。

## 重要

- `assets/js/market-base-update-controller-v334.js` など、V334名の新規ファイルを必ず含めてください。
- 旧 `market-base-update-controller-v322.js`、`v331.js`、`v332.js`、`v333.js` は削除しないでください。古いキャッシュから新制御へ移行するための互換ファイルです。
- `version.txt`、`manifest.json`、`sw.js` は必ず同時に上書きしてください。
- `settings/assets/offline-settings-v334.js` と、互換用の `settings/assets/offline-settings.js` の両方を上書きしてください。
- 一部ファイルだけ先行公開すると、HTMLとService Workerの版が一時的にずれるため、可能な限り一括反映してください。

## フル置換する場合

既存リポジトリ全体を置き換える場合は、`MARKET_BASE_V333_14_FULL_HANDOFF_AND_DATA_20260804.zip` を使用してください。ZIP直下が公開ルート構成です。

## 初回確認の目安

- 更新ボタンが長時間「更新中」のままにならない
- 更新後、ボタンが「更新」へ戻る
- ページごとに版の反映差が出ない
- 設定ページを開いても旧Service Workerへ戻らない
- ラジオ再生専用ページにはグローバル更新制御が入っていない
