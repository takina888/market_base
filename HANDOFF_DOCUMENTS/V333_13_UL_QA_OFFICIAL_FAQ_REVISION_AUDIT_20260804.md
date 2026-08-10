# V333.13 UL・CE Q&A 公式FAQ照合・修正監査

## 結論

既存303問を削除せず、固定の「実務で行うこと」を全件から除去した。質問ごとの監査結果に応じ、意味、判断軸、次の確認のいずれか一つだけを表示する。公式FAQ由来の12問を追加し、Q&Aは315問になった。公式一次資料との再照合で51問の本文を修正した。

## 数量監査

- v074既存Q&A：303問
- 既存ID維持：303/303問
- 公式FAQ由来の追加：12問
- v075合計：315問
- 重複ID：0
- 本文事実修正：51問
- 旧`action`／`actionItems`／`template`／`completion`／`caution`フィールド：0件
- 内部監査用`reason`／`factualIssue`の公開データ混入：0件

## 補助欄監査

- `whatItMeans`：20問
- `decisionPoint`：78問
- `nextCheck`：177問
- 補助欄なし：28問
- 合計：303問

質問へ直接答える情報がない帳票、役職、承認順序は削除した。一方、SCCR、完全型式、設置条件、適合評価手順など、回答の判断に必要な確認事項は残した。

## 事実監査の重点

### 北米

- OSHAはNRTLを認定するが、個別製品を認証・推薦しない
- OSHAの権限は基本的に雇用主へ向く
- custom-made equipmentの別経路は限定的で、一般的な1台物免除ではない
- 他NRTLの成果は受入れ可能だが義務ではない
- 共通の一つのNRTLマークはない
- CEマークは米国のNRTL approvalを代替しない

### 電気・SCCR

- 盤SCCRは設置点の利用可能短絡電流以上が必要
- 高遮断容量ブレーカーの追加だけで盤SCCRは上がらない
- Interrupting RatingとCurrent-Limitingを区別
- 公開された組合せ定格は完全型式と条件を一致させる
- 制御盤認証と機械全体の認証・受入れを区別
- Listed部品だけを一律必須としない

### EU

- Notified Bodyは適用法令と評価手順で要否が決まる
- 2026年8月時点は機械指令が中心で、機械規則は原則2027年1月20日適用
- GARの工業プロセス除外は工場設置や1台物だけでは成立しない
- GAR対象機器の適合評価にはNotified Bodyが関与する
- PED対象外（PS 0.5 bar以下）とSEP（PS 0.5 bar超でCategory I未満）を区別
- IEC最新版とEU官報で引用されるEN版を区別

## 機械検査

- `scripts/build_ulce_qa_v075.py`：PASS
- `scripts/embed_ulce_data_v075.py`：PASS
- `scripts/test_v333_13_ul_qa_official_faq_revision.py`：PASS
- `data/ulce-data-v075.json`とHTML埋込みデータ：完全一致
- ULページ内JavaScript 3ブロック：構文PASS
- Cloudflare Web Analytics：38/38ページでtoken各1件
- オフラインマニフェスト：V333.13識別子と`data/ulce-data-v075.json`を収録
- 食品加工機械メーカーDB：112社、485機種、既存2ファイルのSHA-256一致
- ケータリング業者DB：247社、追加調査81社、出典311件を維持
- Half-PC静的検査：PASS

Playwrightパッケージは存在するが、実行環境にChromium本体がないため、ブラウザ画像試験は実行できなかった。公開後にスマートフォンで「公式FAQから追加」の12問表示、Q&A開閉、長文折返しを最終目視する。

## 回帰ハッシュ

- `data/japan_food_machinery_db_v075.json`：`f1a55fc8e73ac7246b0d37ba75053cfe00f765a210f372de543872c6b71ee6b9`
- `data/japan_food_machinery_export_research_v076.json`：`ce8433b647628d12272c450c885d1feea9cf5ceeca0c24ccc20939f9f170287b`
