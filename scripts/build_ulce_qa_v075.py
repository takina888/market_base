#!/usr/bin/env python3
"""Build v075: official-FAQ additions, factual corrections and lean guidance.

v074 made the 38 starter answers easier to understand, but every Q&A still
carried a uniform action block.  v075 removes that legacy structure from all
existing questions.  A reviewed item may instead have one of three optional
blocks: what the answer means, a decision point, or the next fact to check.

The release also adds questions reconstructed in Japanese from official OSHA,
UL Solutions and European Commission FAQ pages.  No source wording is copied.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "ulce-data-v074.json"
OUTPUT = ROOT / "data" / "ulce-data-v075.json"
VERSION = "v075 / 2026-08-04"
AUDIT_FILES = [
    ROOT / "research" / "v075_north_action_audit.json",
    ROOT / "research" / "v075_electrical_action_audit.json",
    ROOT / "research" / "v075_ce_process_action_audit.json",
]
CORRECTION_FILES = [
    ROOT / "research" / "v075_north_corrections_final.json",
    ROOT / "research" / "v075_electrical_corrections_final.json",
    ROOT / "research" / "v075_ce_process_corrections_final.json",
]
CORRECTION_FIELDS = {
    "question",
    "shortAnswer",
    "answer",
    "why",
    "example",
    "misunderstanding",
    "whatItMeans",
    "decisionPoint",
    "nextCheck",
    "sources",
    "plainTerms",
    "related",
    "tags",
}

OSHA_FAQ = "https://www.osha.gov/nationally-recognized-testing-laboratory-program/frequently-asked-questions"
OSHA_PRODUCTS = "https://www.osha.gov/nationally-recognized-testing-laboratory-program/products-requiring-approval"
OSHA_1910_399 = "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.399"
UL_SUBMIT_FAQ = "https://www.ul.com/resources/submitting-products-faq"
UL_FIELD = "https://www.ul.com/services/field-evaluations"
UL_CODE_FAQ = "https://code-authorities.ul.com/about/code-authority-faqs/"
UL_COMPONENT = "https://www.ul.com/thecodeauthority/knowledge/ul-component-recognition-classification"
UL_COMPONENT_DATA = "https://www.ul.com/services/digital-marketplace-ul-certification-data"
EU_CE = "https://single-market-economy.ec.europa.eu/single-market/goods/ce-marking_en"
EU_IMPORTERS = "https://single-market-economy.ec.europa.eu/single-market/goods/ce-marking/importers-and-distributors_en"
EU_MACHINERY = "https://eur-lex.europa.eu/eli/reg/2023/1230/en"


CORRECTIONS = {
    "QA-COM-001": {
        "shortAnswer": "いいえ。ULは法律名ではなく、UL Solutionsは民間の試験・認証機関です。",
        "answer": (
            "米国の職場で使う一部の機器について、OSHAの規則は『承認された機器』を求めています。"
            "その適合を示す代表的な方法が、OSHAから認定された民間機関（NRTL）による試験・認証です。"
            "UL SolutionsはNRTLの一つですが、ULという名前自体が法律なのではありません。\n\n"
            "また、OSHAの規定には、どのNRTLも扱わない種類の設備や、特定顧客向けの特注設備について限定的な別経路があります。"
            "ただし、これは『特注なら自由に免除』という意味ではなく、適用条件、試験データの保管、設置地の受入れを個別に確認する必要があります。"
        ),
        "sources": [OSHA_FAQ, OSHA_PRODUCTS, OSHA_1910_399],
    },
    "QA-COM-002": {
        "shortAnswer": "OSHAが、一定の規格・拠点・業務範囲について認定した民間の試験・認証機関です。",
        "answer": (
            "NRTLはNationally Recognized Testing Laboratoryの略です。OSHAは機関全体を無制限に認めるのではなく、"
            "その機関が扱える試験規格、認定された拠点、利用できる補助プログラムを範囲として認定します。\n\n"
            "したがって、NRTLの名前だけで依頼先を決めるのではなく、対象となる食品機械・制御盤の規格を、その拠点が認証できるかを確認します。"
            "各NRTLはそれぞれの登録認証マークを使用し、共通の一つの『NRTLマーク』があるわけではありません。"
        ),
        "sources": [OSHA_FAQ],
    },
    "QA-COM-011": {
        "shortAnswer": "1台という理由だけでは省略できません。ただし、OSHAには特注設備の限定的な別経路があります。",
        "answer": (
            "通常は、限定台数を出荷前に扱う認証、設置後の現地評価、通常の製品認証などから案件に合う方法を検討します。"
            "一方、OSHAの電気規則には、特定の顧客向けに設計・製作された特注設備について、メーカーが試験データに基づいて用途上安全と判断し、"
            "雇用主がそのデータを保管して検査時に提示できる場合の限定的な扱いも示されています。\n\n"
            "これは輸出者が一方的に選べる一般免除ではありません。製品種類、顧客が雇用主として負う義務、契約条件、設置地のコードと受入れを確認し、"
            "必要に応じてNRTLや設置地の関係者へ相談します。"
        ),
        "sources": [OSHA_FAQ, OSHA_1910_399, UL_FIELD],
    },
    "QA-COM-015": {
        "shortAnswer": "公式データベースだけでなく、実機の認証マーク、完全型式、認証状態を一組で照合します。",
        "answer": (
            "UL認証ならProduct iQなど認証機関の公式データベースで、会社名、File番号、製品カテゴリー、完全な型式、対象国、現在の認証状態を確認します。"
            "そのうえで、実機または許可された最小包装に正しい認証マークと認証会社の識別があるかを照合します。\n\n"
            "データベースに会社名やFile番号があるだけでは、目の前の型式が認証範囲に入るとは限りません。"
            "反対に、登録直後でデータベース反映前の場合もあるため、見つからなければ認証機関が発行した文書をメーカーへ求めます。"
        ),
        "sources": [UL_CODE_FAQ, UL_COMPONENT_DATA],
    },
    "QA-INT-008": {
        "shortAnswer": "必要台数は製品と試験計画で変わります。破壊・消耗する試験もあるため、販売機とは分けて考えます。",
        "answer": (
            "必要な完成機・部品サンプルの数は、対象型式、代表モデル、予定される試験、破壊試験の有無によって変わります。"
            "UL Solutionsの公式FAQでも、必要数は試験計画により決まり、担当者から案内されると説明されています。\n\n"
            "試験後に返却されても、分解、温度試験、異常試験などで販売できない状態になる場合があります。"
            "認証機関から正式な試験計画を受ける前に、販売予定の完成機を唯一の試験機として固定しない方が安全です。"
        ),
        "sources": [UL_SUBMIT_FAQ],
    },
    "QA-INT-010": {
        "shortAnswer": "一律の月数では決まりません。範囲、資料、サンプル、試験、是正、工場準備で分けて見ます。",
        "answer": (
            "認証期間は製品の種類と評価範囲だけでなく、必要資料とサンプルがそろっているか、試験量、試験所の予定、製造工場への訪問、"
            "不適合後の設計変更と再試験によって変わります。認証機関が製品情報を確認し、調査範囲を決めてから現実的な期間が見えてきます。\n\n"
            "『ULは通常3か月』のような一つの数字ではなく、社内資料準備、認証機関の評価、試験、是正、認証文書、初回生産確認を別々に置いて納期を組みます。"
        ),
        "sources": [UL_SUBMIT_FAQ],
    },
    "QA-LST-002": {
        "shortAnswer": "製品カテゴリーによって、適用規格、評価範囲、認証マークの意味が変わるためです。",
        "answer": (
            "認証機関は営業上の商品名だけではなく、製品の意図した用途と、候補規格の適用範囲を比べて製品カテゴリーを決めます。"
            "同じ『加熱機』でも、卓上調理機器、工業プロセス装置、制御盤などでは評価する危険と規格が異なります。\n\n"
            "カテゴリーを誤ると、必要な試験、部品条件、表示、工場管理が途中で変わります。申請前に用途、使用者、設置環境、熱源、処理工程を具体的に説明します。"
        ),
        "sources": [UL_SUBMIT_FAQ],
    },
    "QA-FLD-001": {
        "shortAnswer": "未認証・改造済みなどの特定機器を、使用する場所で確認する評価です。",
        "answer": (
            "Field Evaluation（現地評価）は、設置済み、認証表示がない、または現場で改造された特定の機器を、実際の用途と設置条件に合わせて評価するサービスです。"
            "一般的な流れは、資料確認、外観・機械構造の確認、採用された設置コードへの適合確認、可能な現地試験、技術報告です。\n\n"
            "適合した場合は対象個体へ現地評価ラベルが付くことがありますが、同じ型式の量産品全体を認証するListingとは異なります。"
            "また、現地評価は設置地の最終受入れを支援するもので、AHJなどの判断を自動的に置き換えるものではありません。"
        ),
        "sources": [UL_FIELD],
    },
    "QA-FLD-006": {
        "shortAnswer": "適合した対象個体には現地評価ラベルが付く場合があり、評価内容は報告書で確認します。",
        "answer": (
            "UL Solutionsの現地評価では、対象機器が適用要求へ適合した場合、UL Evaluated Labelがその機器へ適用されます。"
            "適合しない場合は、指摘事項と関連要求を示す予備報告が提示され、是正や再確認が必要になることがあります。\n\n"
            "ラベルだけで評価範囲を推測せず、報告書、対象シリアル、設置場所、評価した条件を一緒に確認します。"
        ),
        "sources": [UL_FIELD],
    },
    "QA-PNL-006": {
        "shortAnswer": "自由には使えません。部品ごとの組込み条件も確認します。",
        "answer": (
            "認証済み部品には、単体で使用する完成品と、最終製品へ組み込むことを前提に評価された部品があります。"
            "組込部品には、使用電圧、周囲温度、必要な筐体、保護装置、配線、取付方向、間隔などの『組込み条件（Conditions of Acceptability）』が付く場合があります。\n\n"
            "カタログ定格内でも、その条件から外れれば完成機で追加評価が必要になることがあります。完全型式と公式認証情報を、実際の回路・環境へ照らして確認します。"
        ),
        "sources": [UL_COMPONENT, UL_COMPONENT_DATA],
    },
    "QA-PNL-057": {
        "shortAnswer": "部品ごとの組込み条件（Conditions of Acceptability）を満たす場合に使用できます。",
        "answer": (
            "UL Recognized Componentは、原則として完成品へ組み込む部品を対象にした認証です。"
            "筐体、温度、配線、保護、間隔、端子、短絡条件など、最終製品で守る『組込み条件』が設定されることがあります。\n\n"
            "部品マークや電気定格だけで採否を決めず、完全型式の認証情報と組込み条件を、実際の機械設計へ照合します。"
        ),
        "sources": [UL_COMPONENT, UL_COMPONENT_DATA],
    },
    "QA-PNL-058": {
        "question": "UL認証部品の『組込み条件』は、どこで確認しますか？",
        "shortAnswer": "Product iQ、個別認証情報、ULレポート、部品メーカーの正式資料で型式ごとに確認します。",
        "answer": (
            "組込み条件は英語でConditions of Acceptabilityと呼ばれます。Product iQ上の認証情報や個別のCertificate of Compliance、"
            "ULレポートには、製品カテゴリー、定格、設計上の注意、組込み条件などが示される場合があります。\n\n"
            "公開情報だけで必要条件が分からなければ、部品メーカーまたは認証機関へ完全型式を示して確認します。似た型式や同じFile番号だけで流用しません。"
        ),
        "sources": [UL_COMPONENT_DATA, UL_COMPONENT],
    },
    "QA-FUS-015": {
        "shortAnswer": "文字が同じでも、ラベル材料、印刷方法、貼付面、使用環境の条件を確認します。",
        "answer": (
            "安全表示や認証マークを載せるラベルは、表示内容だけでなく、剥がれにくさや判読性も評価条件になります。"
            "貼付面、温度、油・水・薬品、屋外曝露、印刷色、寸法など、認証されたラベル材料と表示方法の条件を守る必要があります。\n\n"
            "同じ文字を別のプリンターや一般ラベルへ印刷しただけでは、承認された表示と同じ扱いになるとは限りません。"
        ),
    },
    "QA-FUS-016": {
        "shortAnswer": "File番号だけでは不足です。完全型式、認証種類、定格、対象市場、組込み条件まで確認します。",
        "answer": (
            "一つのFile番号には複数の製品系列や型式が含まれることがあります。目の前の部品を使えるか判断するには、"
            "製品カテゴリー、認証種類、完全型式、定格、米国・カナダの対象範囲、Guide Information、部品の組込み条件を照合します。\n\n"
            "完成品認証の量産では、公開データベースだけでなく、自社製品の認証手順書に認められた部品・条件とも一致させます。"
        ),
        "sources": [UL_COMPONENT_DATA, UL_COMPONENT],
    },
    "QA-CEB-001": {
        "shortAnswer": "いいえ。多くの場合、メーカーが適合を宣言する表示で、EU当局の合格シールではありません。",
        "answer": (
            "CEマークは、製品へ適用されるEU法令の要求を満たしているとメーカーが宣言する表示です。"
            "メーカーは適合評価を行い、技術文書を作成し、EU適合宣言を発行してCEマークを付けます。対象製品によって第三者機関が関与する場合はありますが、"
            "CEマーク自体がEU当局による製品承認や安全推奨を意味するわけではありません。"
        ),
        "sources": [EU_CE],
    },
    "QA-CEB-002": {
        "shortAnswer": "製品の適合を成立させる中心的な責任はメーカーにあります。EU輸入者にも別の確認義務があります。",
        "answer": (
            "メーカーは、適用法令の特定、適合評価、技術文書、EU適合宣言、CE表示を管理します。試験や文書作成を外部へ委託しても、"
            "それだけでメーカーの責任が試験所へ移るわけではありません。\n\n"
            "日本などEU域外から輸出する場合、EU側の輸入者にも、メーカーが必要な手続きを行ったこと、適合宣言や技術文書を入手できること、"
            "メーカーへ連絡できることを確認する役割があります。"
        ),
        "sources": [EU_CE, EU_IMPORTERS],
    },
    "QA-CEB-004": {
        "shortAnswer": "機械規則（EU）2023/1230は原則2027年1月20日から適用されます。",
        "answer": (
            "2026年8月時点では、一般の機械について機械指令2006/42/ECが引き続き中心です。"
            "機械規則（EU）2023/1230は、一部条文の先行適用を除き、原則として2027年1月20日から適用され、機械指令を置き換えます。\n\n"
            "設計開始日だけで決めず、EUで市場投入または使用開始する日、製品区分、経過措置、適用される規格の状況を案件ごとに確認します。"
        ),
        "sources": [EU_MACHINERY, "https://eur-lex.europa.eu/eli/dir/2006/42/oj/eng"],
    },
    "QA-CEB-010": {
        "question": "CEマークは、一つのEU法令だけ確認すれば付けられますか？",
        "shortAnswer": "いいえ。製品へ同時に適用されるEU法令をすべて特定します。",
        "answer": (
            "食品機械には、機械安全だけでなく、電磁両立性、低電圧、圧力、ガス、爆発性雰囲気など複数のEU法令が関係する場合があります。"
            "CEマークは、製品に適用される法令の要求を満たしたうえで付けます。\n\n"
            "一方、CEマークが扱う製品要求とは別に、仕向国の言語、建物側工事、消防、ガス・蒸気の設置検査、使用時の労働安全などが残ることがあります。"
            "『CE取得済みだから追加確認はない』とは考えません。"
        ),
        "sources": [EU_CE],
    },
}


OFFICIAL_FAQ_ADDITIONS = [
    {
        "id": "QA-COM-021",
        "category": "共通・制度",
        "subcategory": "OSHAと認証",
        "question": "OSHAが機械そのものを審査し、『OSHA認証品』として推薦するのですか？",
        "shortAnswer": "いいえ。OSHAはNRTLを認定しますが、個々の製品を推薦する認証機関ではありません。",
        "answer": (
            "OSHAは、民間の試験・認証機関が一定の能力と独立性を持つかを審査し、NRTLとして認定します。"
            "個々の製品を試験して認証するのは、その製品規格を認定範囲に持つNRTLです。"
            "OSHA自身が製品の性能を保証したり、特定製品を推奨したりするわけではありません。"
        ),
        "example": "例：営業資料では『OSHA認証』ではなく、『○○NRTLにより、対象規格について認証』のように実際の認証主体と範囲を示します。",
        "misunderstanding": "OSHAがNRTLを認定することと、OSHAが各製品を認証することは別です。",
        "decisionPoint": "証明を確認するときは、NRTL名、登録認証マーク、対象規格、完全型式、認証拠点を見ます。",
        "related": "UL-INTRO-01",
        "difficulty": "基礎",
        "tags": "OSHA,NRTL,認証主体",
        "sources": [OSHA_FAQ],
        "stage": "judge",
    },
    {
        "id": "QA-COM-022",
        "category": "共通・制度",
        "subcategory": "法的責任",
        "question": "日本の機械メーカーへ、OSHAが直接NRTL認証の取得を義務付けるのですか？",
        "shortAnswer": "OSHAの権限は基本的に雇用主へ向きます。ただし、顧客側が承認済み機器を必要とするため認証が重要になります。",
        "answer": (
            "OSHAの公式FAQでは、OSHAの権限は雇用主に限られるため、メーカーや供給者へ直接『必ず認証を取得せよ』と要求するものではないと説明されています。"
            "しかし、米国の顧客は雇用主として、対象となる機器を承認済みの状態で使用する必要があります。\n\n"
            "そのため輸出メーカーにとっては、法令の宛先だけでなく、顧客契約、NRTL認証、設置地の受入れを満たせる製品を供給できるかが実務上の問題になります。"
        ),
        "misunderstanding": "『OSHAがメーカーへ直接命令しない＝認証なしで輸出してよい』という意味ではありません。",
        "decisionPoint": "製品種類と使用条件がOSHAの承認要求に該当するか、顧客が何を受入れ証拠とするかを分けて確認します。",
        "related": "UL-INTRO-01",
        "difficulty": "基礎実務",
        "tags": "OSHA,メーカー,雇用主,法的責任",
        "sources": [OSHA_FAQ, OSHA_PRODUCTS],
        "stage": "judge",
    },
    {
        "id": "QA-COM-023",
        "category": "共通・制度",
        "subcategory": "NRTL間の扱い",
        "question": "あるNRTLの認証部品を使い、別のNRTLへ完成機械の認証を依頼できますか？",
        "shortAnswer": "依頼はできますが、別NRTLの試験・認証情報を受け入れるかは認証機関ごとの判断です。",
        "answer": (
            "OSHAは、NRTLが別のNRTLによる試験、認証、承認などを受け入れることを認めています。"
            "ただし、受入れを義務付けてはいません。完成機械を担当するNRTLが、部品の認証情報をそのまま利用するか、追加資料や評価を求めるかを決めます。\n\n"
            "部品マークだけで『どのNRTLでも受入れ可能』と見積もらず、主要部品の一覧と認証情報を申請先へ早めに提示します。"
        ),
        "example": "例：別NRTLのモーターや電源を採用する場合、完成機の申請先が証明書、規格、型式、組込み条件を受け入れるか先に確認します。",
        "nextCheck": "申請先NRTLへ、主要部品の認証機関、完全型式、規格、認証番号、組込み条件を示して受入れ可否を確認します。",
        "related": "UL-INTRO-04",
        "difficulty": "実務",
        "tags": "NRTL,他機関,部品認証,受入れ",
        "sources": [OSHA_FAQ],
        "stage": "design",
    },
    {
        "id": "QA-COM-024",
        "category": "共通・制度",
        "subcategory": "認証マーク",
        "question": "製品では、共通の『NRTLマーク』を探せばよいですか？",
        "shortAnswer": "いいえ。共通マークはなく、各NRTLの登録認証マークを確認します。",
        "answer": (
            "OSHAは、すべての認証機関が使う一つのNRTLマークを定めていません。各NRTLはそれぞれの登録認証マークを使用します。"
            "マークにNRTLという文字を添える機関もありますが、その表示は必須ではありません。\n\n"
            "見慣れないマークでも直ちに無効とは判断せず、OSHAの現行NRTL一覧、認定規格、マークの所有者、製品の完全型式を確認します。"
        ),
        "decisionPoint": "ロゴの形だけでなく、そのNRTLが対象規格を認証できる範囲と、実機の型式・マークを照合します。",
        "related": "UL-INTRO-01",
        "difficulty": "基礎",
        "tags": "NRTL Mark,認証マーク,OSHA",
        "sources": [OSHA_FAQ],
        "stage": "judge",
    },
    {
        "id": "QA-INT-020",
        "category": "UL導入・営業・見積",
        "subcategory": "試験場所",
        "question": "UL Solutionsの初期試験を、日本の自社工場で行うことはできますか？",
        "shortAnswer": "依頼により可能な場合がありますが、試験設備と出張費などの条件を確認します。",
        "answer": (
            "UL Solutionsの公式FAQでは、依頼によりメーカー工場で初期試験を行える場合があると説明されています。"
            "ただし、メーカー側が適切な試験設備を用意し、技術者の旅費・滞在費が評価費へ加わります。\n\n"
            "すべての製品・試験を自社工場で実施できるとは限りません。必要な設備、校正、試験環境、立会者、試験所でしかできない項目を見積前に確認します。"
        ),
        "example": "例：大型の連続加熱機を試験所へ運べない場合でも、現地で実施できる項目と、部品サンプルを試験所へ送る項目に分かれることがあります。",
        "nextCheck": "認証機関へ製品寸法、試験項目候補、自社設備一覧、校正状態を示し、工場試験の可否と追加費用を確認します。",
        "related": "UL-INTRO-08",
        "difficulty": "実務",
        "tags": "試験場所,メーカー工場,出張試験",
        "sources": [UL_SUBMIT_FAQ],
        "stage": "apply",
    },
    {
        "id": "QA-INT-021",
        "category": "UL導入・営業・見積",
        "subcategory": "試験サンプル",
        "question": "認証試験に出した完成機は、返却後そのまま販売できますか？",
        "shortAnswer": "販売できるとは限りません。破壊・分解・消耗を伴う試験があるためです。",
        "answer": (
            "認証試験では、温度、異常運転、耐久、強度など、製品を分解したり、部品を消耗・破損させたりする試験が行われる場合があります。"
            "UL SolutionsのFAQではサンプル返却の扱いも示されていますが、返却されることと販売可能な状態で戻ることは同じではありません。\n\n"
            "試験機、予備機、顧客へ出荷する販売機を分け、試験後の復旧、再検査、廃棄の費用と日程を最初から見積もります。"
        ),
        "decisionPoint": "試験計画が確定するまで、顧客へ納める唯一の完成機を試験後そのまま出荷できる前提にしません。",
        "related": "UL-INTRO-08",
        "difficulty": "実務",
        "tags": "試験機,サンプル,破壊試験,返却",
        "sources": [UL_SUBMIT_FAQ],
        "stage": "apply",
    },
    {
        "id": "QA-INT-022",
        "category": "UL導入・営業・見積",
        "subcategory": "不適合対応",
        "question": "認証試験で不適合が出たら、その時点で申請は終了ですか？",
        "shortAnswer": "通常は指摘内容を確認し、設計変更と必要な再試験・再審査を進めます。",
        "answer": (
            "不適合が見つかると、試験結果や適合しなかった構造について報告が示されます。メーカーは原因と影響範囲を確認し、"
            "部品、回路、構造、表示などを修正します。変更内容と新しいサンプルを提出し、必要な再試験・再審査を受けます。\n\n"
            "不適合は自動的な永久失格ではありませんが、設計変更、再製作、再試験、追加費用、納期延長が発生します。"
            "指摘を部分修正だけで閉じず、同じ設計を使う派生型式への影響も確認します。"
        ),
        "nextCheck": "指摘項目ごとに、原因、修正案、影響する型式、追加試験、費用・納期を認証機関と確認します。",
        "related": "UL-INTRO-08",
        "difficulty": "実務",
        "tags": "不適合,再試験,設計変更",
        "sources": [UL_SUBMIT_FAQ],
        "stage": "apply",
    },
    {
        "id": "QA-LST-016",
        "category": "UL Listing",
        "subcategory": "別ブランド販売",
        "question": "他社が製造するUL認証品を、自社ブランド名で販売できますか？",
        "shortAnswer": "元の認証をそのまま名義変更するのではなく、Multiple Listingなどの正式手続きを相談します。",
        "answer": (
            "UL Solutionsには、別会社が製造する認証品を自社ブランドで販売するためのMultiple Listing Serviceがあります。"
            "ただし、元製品へ自社ラベルを貼るだけで、自社名のUL認証品になるわけではありません。\n\n"
            "対象製品、製造会社、ブランド名、型式、認証マーク、変更の有無を示し、利用できる手続きと表示条件をUL Solutionsへ確認します。"
            "構造や部品を変更する場合は、同一製品として扱えないことがあります。"
        ),
        "example": "例：OEM製の包装機を自社型式で販売する場合、銘板だけ変更せず、元認証との関係と自社名義の認証表示を正式に登録します。",
        "nextCheck": "元認証の会社名、File番号、完全型式、自社で変更する表示・構造をそろえ、Multiple Listingの適用可否を確認します。",
        "related": "UL-10",
        "difficulty": "実務",
        "tags": "OEM,別ブランド,Multiple Listing,UL Mark",
        "sources": [UL_SUBMIT_FAQ],
        "stage": "apply",
    },
    {
        "id": "QA-LST-017",
        "category": "UL Listing",
        "subcategory": "認証確認",
        "question": "カタログに『UL規格へ適合』とあるのに、Product iQで見つからない製品は認証済みですか？",
        "shortAnswer": "それだけでは認証済みと判断できません。現在有効な認証文書と実機表示を確認します。",
        "answer": (
            "公式データベースに見つからない理由には、過去の認証が終了した、取得直後で未反映、メーカーの自己申告、"
            "別の認証機関がUL規格を使って認証した、など複数の可能性があります。\n\n"
            "『UL規格に適合』『ULに準拠して設計』という表現は、UL Solutionsによる認証と同じではありません。"
            "完全型式、認証機関、認証番号、現在の認証状態、実機の認証マークが一致するまで、認証済みとして扱いません。"
        ),
        "misunderstanding": "UL規格の番号が書かれていることと、UL Solutionsの認証を取得していることは別です。",
        "nextCheck": "メーカーへ認証機関発行文書を求め、完全型式、認証番号、対象規格、発行日・状態を公式情報と照合します。",
        "related": "UL-10",
        "difficulty": "基礎実務",
        "tags": "Product iQ,UL規格適合,自己申告,認証確認",
        "sources": [UL_CODE_FAQ],
        "stage": "design",
    },
    {
        "id": "QA-FLD-014",
        "category": "Field Evaluation",
        "subcategory": "依頼者",
        "question": "現地評価は、設置地の検査担当者だけが依頼できるのですか？",
        "shortAnswer": "いいえ。所有者、メーカー、施工業者など製品に関係する人も依頼できます。",
        "answer": (
            "UL Solutionsの公式説明では、事業者、メーカー、施工業者など、対象製品や設備に関係する人が現地評価を依頼できます。"
            "ただし、誰が依頼できるかと、設置地が最終的に受け入れるかは別の問題です。\n\n"
            "評価を手配する前に、顧客、設備所有者、施工業者、AHJなどの関係を整理し、どの評価機関とラベル・報告書が受け入れられるかを確認します。"
        ),
        "decisionPoint": "依頼者だけで進めず、最終受入れを判断する関係者と、必要な評価範囲を先に一致させます。",
        "related": "UL-31",
        "difficulty": "基礎実務",
        "tags": "Field Evaluation,依頼者,AHJ,所有者",
        "sources": [UL_FIELD],
        "stage": "install",
    },
    {
        "id": "QA-CEB-015",
        "category": "CE基礎",
        "subcategory": "CE対象",
        "question": "CE対象外の製品へ、『安全の目印』としてCEマークを付けてもよいですか？",
        "shortAnswer": "いいえ。CEマークの対象法令に該当しない製品へ付けることは禁止されています。",
        "answer": (
            "CEマークは任意の品質マークではありません。製品がCE表示を要求するEU法令の対象であり、その法令に基づく適合評価を完了した場合に付けます。"
            "対象外の製品へ、安心感やEU向けという印象を与える目的で付けることはできません。\n\n"
            "最初に製品の用途と構成を整理し、どのEU法令が適用されるか、CE表示が必要かを判定します。"
        ),
        "misunderstanding": "CEマークは『付けても付けなくてもよい安全ロゴ』ではありません。",
        "decisionPoint": "CEロゴを準備する前に、適用法令と適合評価手順を特定します。",
        "related": "CE-02",
        "difficulty": "基礎",
        "tags": "CE対象,任意表示,禁止表示",
        "sources": [EU_CE],
        "stage": "judge",
    },
    {
        "id": "QA-CEB-016",
        "category": "CE基礎",
        "subcategory": "EU輸入者",
        "question": "日本メーカーがCE適合宣言を作れば、EU側の輸入者は何も確認しなくてよいですか？",
        "shortAnswer": "いいえ。EU輸入者にも、適合手続きと必要書類を確認する役割があります。",
        "answer": (
            "EU域外から製品を輸入する事業者は、メーカーが必要な適合手続きを行ったこと、EU適合宣言や技術文書を入手できること、"
            "メーカーへ連絡できることを確認します。流通中に製品の適合を損なわないことも必要です。\n\n"
            "日本メーカー側も、輸入者へ渡す適合宣言、型式情報、取扱説明書、連絡先、技術文書を求められた場合の提供方法を事前に決めます。"
        ),
        "nextCheck": "EU輸入者と、製品表示、適合宣言、説明書、技術文書の提示方法、連絡窓口を出荷前に確認します。",
        "related": "CE-03",
        "difficulty": "基礎実務",
        "tags": "EU輸入者,適合宣言,技術文書,CE",
        "sources": [EU_IMPORTERS, EU_CE],
        "stage": "estimate",
    },
]


TERM_RULES = [
    (("NRTL",), "NRTL：OSHAが一定範囲について認定した民間の試験・認証機関"),
    (("AHJ",), "AHJ：設置地でコード適合や受入れを判断する管轄関係者の総称"),
    (("LPC",), "LPC：UL Solutionsの限定生産向け認証方式（適用可否は案件ごとに確認）"),
    (("FUS", "Follow-Up Services"), "FUS：認証後も製造品が認証条件どおりかを確認する継続工場検査"),
    (("IPI", "Initial Production Inspection"), "IPI：認証品の初回生産時に行われる工場確認"),
    (("SCCR",), "SCCR：短絡事故時に機械・盤が耐えられる能力を示す定格"),
    (("Product iQ",), "Product iQ：UL Solutionsの公式認証情報データベース"),
    (("CCN",), "CCN：ULの製品カテゴリーを識別する分類コード"),
    (("Conditions of Acceptability", "組込み条件"), "組込み条件：認証部品を最終製品へ安全に使うために守る条件"),
    (("Recognized Component", "Recognized部品"), "Recognized Component：完成品へ組み込むことを前提に評価された部品"),
    (("Field Evaluation", "現地評価"), "Field Evaluation：特定の設置済み・改造済み機器を使用場所で確認する評価"),
    (("Listing", "Listed"), "Listing／Listed：継続生産する製品の認証を指す従来からの表現"),
    (("Notified Body",), "Notified Body：EU法令に基づき指定された第三者適合性評価機関"),
    (("GAR",), "GAR：EUのガス燃焼機器規則（EU）2016/426"),
    (("PED",), "PED：EUの圧力機器指令2014/68/EU"),
    (("BOM",), "BOM：部品表。製品に使用する部品と型式をまとめた一覧"),
]


def load_audit() -> dict[str, dict]:
    merged: dict[str, dict] = {}
    for path in AUDIT_FILES:
        if not path.exists():
            raise FileNotFoundError(f"Action audit missing: {path}")
        payload = json.loads(path.read_text(encoding="utf-8"))
        for item_id, review in payload.get("items", {}).items():
            if item_id in merged:
                raise ValueError(f"Duplicate action audit ID: {item_id}")
            merged[item_id] = review
    return merged


def load_reviewed_corrections() -> dict[str, dict]:
    """Load the final copy review without publishing internal audit notes."""

    merged: dict[str, dict] = {}
    for path in CORRECTION_FILES:
        if not path.exists():
            raise FileNotFoundError(f"Reviewed correction file missing: {path}")
        payload = json.loads(path.read_text(encoding="utf-8"))
        items = payload.get("items") or {}
        if not isinstance(items, dict):
            raise ValueError(f"Correction items must be an object: {path}")
        for item_id, raw in items.items():
            if not isinstance(raw, dict):
                raise ValueError(f"Invalid correction for {item_id}: {path}")
            clean = {
                key: copy.deepcopy(value)
                for key, value in raw.items()
                if key in CORRECTION_FIELDS
            }
            if not clean.get("answer"):
                raise ValueError(f"Reviewed correction has no answer: {item_id}")
            merged[item_id] = clean
    return merged


def merge_sources(existing: list[str], additions: list[str]) -> list[str]:
    result: list[str] = []
    for source in [*existing, *additions]:
        if source and source not in result:
            result.append(source)
    return result


def add_plain_terms(item: dict) -> None:
    text = " ".join(
        str(item.get(key, ""))
        for key in (
            "question",
            "shortAnswer",
            "answer",
            "whatItMeans",
            "decisionPoint",
            "nextCheck",
        )
    )
    terms = list(item.get("plainTerms") or [])
    for needles, definition in TERM_RULES:
        if any(needle in text for needle in needles) and definition not in terms:
            terms.append(definition)
    item["plainTerms"] = terms


def normalize_new_item(raw: dict, priority: int) -> dict:
    item = copy.deepcopy(raw)
    item.update(
        {
            "status": "公式FAQ照合済",
            "starter": False,
            "featured": False,
            "priority": priority,
            "audience": ["営業", "設計", "認証担当"],
            "plainTerms": [],
            "officialFaqDerived": True,
            "sourceNote": "公式FAQ・公的資料の論点をMARKET BASE向けに再構成",
            "explanationDepth": "reviewed",
        }
    )
    add_plain_terms(item)
    return item


def main() -> None:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    output = copy.deepcopy(data)
    qas = output["qas"]
    original_ids = {item["id"] for item in qas}
    audit = load_audit()
    corrections = copy.deepcopy(CORRECTIONS)
    corrections.update(load_reviewed_corrections())

    if set(audit) != original_ids:
        raise ValueError(
            "Action audit must cover every original Q&A exactly: "
            f"missing={sorted(original_ids - set(audit))[:20]}, "
            f"extra={sorted(set(audit) - original_ids)[:20]}"
        )

    by_id = {item["id"]: item for item in qas}
    missing_corrections = sorted(set(corrections) - set(by_id))
    if missing_corrections:
        raise ValueError(f"Correction IDs not found: {missing_corrections}")

    class_counts = {"explanation": 0, "decision": 0, "check": 0, "omit": 0}
    for item in qas:
        review = audit[item["id"]]
        classification = review.get("classification")
        if classification not in class_counts:
            raise ValueError(f"Invalid classification for {item['id']}: {classification}")
        class_counts[classification] += 1

        # Remove the v073 uniform task machinery completely.
        for field in (
            "action",
            "actionLabel",
            "actionItems",
            "template",
            "completion",
            "caution",
        ):
            item.pop(field, None)
        if not item.get("starter"):
            item.pop("why", None)

        revised = str(review.get("revisedText") or "").strip()
        item["guidanceType"] = classification
        if classification == "explanation" and revised:
            item["whatItMeans"] = revised
        elif classification == "decision" and revised:
            item["decisionPoint"] = revised
        elif classification == "check" and revised:
            item["nextCheck"] = revised

    for item_id, correction in corrections.items():
        item = by_id[item_id]
        correction = copy.deepcopy(correction)
        if "sources" in correction:
            item["sources"] = merge_sources(item.get("sources", []), correction.pop("sources"))
        item.update(correction)
        item["factualReview"] = "2026-08-04 official-source review"
        item["explanationDepth"] = "reviewed"

    new_ids = [item["id"] for item in OFFICIAL_FAQ_ADDITIONS]
    if len(new_ids) != len(set(new_ids)) or original_ids.intersection(new_ids):
        raise ValueError("New official FAQ IDs are duplicate")
    for offset, raw in enumerate(OFFICIAL_FAQ_ADDITIONS, start=1):
        qas.append(normalize_new_item(raw, 1600 + offset))

    for item in qas:
        add_plain_terms(item)

    output["version"] = VERSION
    output["summary"]["qaCount"] = len(qas)
    output["summary"]["officialFaqAddedCount"] = len(OFFICIAL_FAQ_ADDITIONS)
    output["summary"]["correctedQaCount"] = len(corrections)
    output["summary"]["legacyActionBlocksRemoved"] = len(original_ids)
    output["summary"]["guidanceClassCounts"] = class_counts
    output["qaWorkflow"]["version"] = VERSION
    output["qaWorkflow"]["detailCount"] = len(qas) - sum(bool(item.get("starter")) for item in qas)
    output["qaWorkflow"]["principle"] = (
        "質問への答えを先に示し、背景・具体例・誤解を必要に応じて説明する。"
        "作業指示は一律表示せず、意味・判断・次の確認が本当に必要な質問だけに示す。"
    )
    output["qaWorkflow"]["explanationStandard"] = (
        "短い結論の後に詳しい説明を置く。公式FAQ由来の質問は出典を明示し、"
        "内部語は日本語説明を先に示す。"
    )

    OUTPUT.write_text(
        json.dumps(output, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "version": VERSION,
                "qaCount": len(qas),
                "originalQaCount": len(original_ids),
                "officialFaqAdded": len(OFFICIAL_FAQ_ADDITIONS),
                "corrected": len(corrections),
                "guidance": class_counts,
                "result": "PASS",
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
