(() => {
  'use strict';
  const DATA=window.MATERIAL_CHECK_DATA;
  if(!DATA) throw new Error('MATERIAL_CHECK_DATA が読み込めません。');
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const norm=v=>String(v??'').trim().toLowerCase().replace(/[\s・／/_,，。:：()（）\-]/g,'');
  const splitIds=v=>String(v||'').split(';').map(x=>x.trim()).filter(Boolean);
  const sourceMap=new Map(DATA.sources.map(x=>[x['資料ID'],x]));
  const materialMap=new Map(DATA.materials.map(x=>[x['素材ID'],x]));
  const profileMap=new Map(DATA.countryProfiles.map(x=>[x.country,x]));
  const scopeMap=new Map((DATA.productScopes||[]).map(x=>[x.code,x.label]));
  const pendingMap=new Map((DATA.pendingReviews||[]).map(x=>[x.rule_id,x]));
  const pfasFcnSet=new Set((DATA.pfasFcnNumbers||[]).map(x=>String(x)));
  const storageKey='material-check-judge-v17';
  const legacyStorageKeys=['material-check-judge-v16','material-check-judge-v15','material-check-judge-v14','material-check-judge-v13','material-check-judge-v12','material-check-judge-v11'];
  function localDateISO(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`;}
  const TODAY=localDateISO();

  function toast(message){const t=$('toast');t.textContent=message;t.classList.add('is-visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('is-visible'),2300);}
  function showView(name,shouldScroll=true){document.querySelectorAll('[data-view-panel]').forEach(v=>v.classList.toggle('is-active',v.dataset.viewPanel===name));document.querySelectorAll('.mbx-tab').forEach(t=>{const active=t.dataset.view===name;t.classList.toggle('is-active',active);t.setAttribute('aria-selected',active?'true':'false');});if($('mobileViewSelect'))$('mobileViewSelect').value=name;const anchor=document.querySelector('.mbx-learning-workspace');if(shouldScroll&&anchor)window.scrollTo({top:Math.max(0,anchor.offsetTop-12),behavior:'smooth'});}
  function fillSelect(select,items,placeholder='選択してください'){select.innerHTML=`<option value="">${placeholder}</option>`+items.map(x=>`<option value="${esc(x.value??x)}">${esc(x.label??x)}</option>`).join('');}
  function countries(){return DATA.meta.countries.map(c=>({value:c,label:c}));}
  function materials(){return DATA.materials.map(m=>({value:m['素材ID'],label:`${m['画面表示名']}｜${m['正式名称・代表名']}`}));}
  function materialGroup(id){return materialMap.get(id)?.['大分類']||'';}
  function unique(values){return [...new Set(values.filter(Boolean))];}
  function numberOrNaN(id){const v=$(id)?.value?.trim?.()??'';return v===''?NaN:Number(v);}
  function scopeLabel(code){return scopeMap.get(code)||code||'未指定';}
  function effectLabel(value){return ({
    '許可・使用可能根拠':'使用条件の根拠','条件付き許可':'条件の確認が必要','明確な禁止':'禁止規定',
    '直接物質制限':'物質・数値制限','認可根拠無効':'認可根拠として使用不可','個別確認要求':'追加確認が必要',
    '食品事業者の運用義務':'食品事業者の使用時義務','事業者手続':'市場投入者・事業者の手続',
    '別制度で必須確認':'別制度で確認が必要','任意評価・ガイダンス':'任意評価・ガイダンス',
    '適用除外':'適用除外候補','対象外':'対象外となる可能性'
  })[value]||value||'追加確認が必要';}
  function requirementTypeLabel(value){return ({
    '証明書':'書類・証明','法定適合宣言':'法定適合宣言','公的認可・登録':'公的認可・登録',
    '技術資料':'技術資料','供給者保証':'供給者情報・保証','情報伝達':'情報伝達',
    'トレーサビリティ':'記録・追跡','法定保存記録':'法定保存記録','運用記録':'食品事業者の運用記録',
    '製造管理':'製造・品質管理','試験工程':'試験工程','統計的再評価':'追加試験・統計評価',
    '試験':'試験','数値制限':'数値基準','個別確認':'個別確認','表示':'表示','その他':'その他の確認'
  })[value]||value||'その他の確認';}
  function requirementGroupLabel(value){return ({
    '製品・材料の直接要件':'製品・材料に直接関係する要件',
    '市場投入者の手続':'輸入者・市場投入者の手続',
    '食品事業者の使用時義務':'食品事業者・施設運営者の使用時義務',
    '供給者へ依頼できる証拠':'供給者へ依頼できる証拠・資料',
    '任意評価・ガイダンス':'任意評価・ガイダンス',
    '別制度・適用範囲の確認':'別制度・適用範囲の確認'
  })[value]||value||'その他の確認';}
  function obligationLabel(value){return ({
    '材料メーカー':'材料メーカー','成形品・完成品メーカー':'製品メーカー','製品メーカー':'製品メーカー',
    '輸入者':'輸入者','市場投入者・輸入者':'輸入者・販売者','販売者':'販売者',
    '食品事業者':'食品事業者','食品施設運営者':'食品工場・施設','任意申請者':'申請する事業者',
    '複数主体':'関係する事業者'
  })[value]||value||'担当者';}
  function strengthLabel(value){return ({
    '法令上必須':'法令上必要','条件付きで法令上必須':'条件に該当する場合に必要',
    '適合立証方法の一例':'確認資料の例','契約・調達上推奨':'取引条件に応じて確認',
    '任意申請時のみ':'申請する場合のみ','参考':'参考','対象外':'対象外'
  })[value]||value||'';}
  function requirementItemHtml(q){const meta=[];if(q['義務主体'])meta.push(`確認する人：${obligationLabel(q['義務主体'])}`);if(q['要求強度'])meta.push(strengthLabel(q['要求強度']));const doc=q['必要書類の種類']||q['文書区分'];return `<div class="mbx-requirement-item"><strong>${esc(q['項目名'])}</strong><div>${esc(q['合格・完了条件']||'追加確認が必要')}</div>${doc?`<div class="mbx-rule-meta">資料・記録：${esc(doc)}</div>`:''}${meta.length?`<div class="mbx-rule-meta">${esc(meta.filter(Boolean).join('｜'))}</div>`:''}</div>`;}
  function searchTypeLabel(value){return ({'規制ルール':'規制情報','要求事項':'確認事項'})[value]||value;}
  function sourceStatusLabel(value){const s=String(value||'');if(/継続確認|再確認中|確認待ち|保留/.test(s))return '公式資料の詳細を確認中';if(/実質監査済み|監査反映済み|本文監査|一次資料確認済み|再監査済み/.test(s))return '公式資料を確認済み';return ({'調査中':'確認中','未着手':'未確認'})[s]||s||'確認状況は未確認';}
  function contactLabel(value){return value==='飛散・偶発接触の可能性'?'飛び散りなどで触れる可能性':value;}
  function sourceLinks(ids,limit=3){const ss=unique(ids).map(id=>sourceMap.get(id)).filter(Boolean).slice(0,limit);if(!ss.length)return '<div class="mbx-empty">参照できる公式資料を絞り込めませんでした。</div>';return ss.map(s=>{const version=s['統合版日付']||s['データベース基準日']||s['文書日']||s['最終確認日']||'確認できず';return `<div class="mbx-source-item"><a href="${esc(s['公式URL'])}" target="_blank" rel="noopener">${esc(s['資料名'])}</a><small>${esc(s['法的効力']||s['資料の種類']||'位置づけは公式資料で確認')}｜${esc(sourceStatusLabel(s['確認状態']))}</small><div class="mbx-rule-meta">${esc(s['国・地域'])}｜${esc(s['所管機関'])}｜版・基準日 ${esc(version)}｜資料確認日 ${esc(s['最終監査日']||s['最終確認日']||'確認できず')}</div></div>`;}).join('');}
  function publicFieldLabel(k){return ({
    '正式名称・代表名':'正式名称','大分類':'分類','小分類':'種類','材料の役割':'役割','よくある用途':'主な用途',
    '必ず確認する情報':'確認する情報','主な注意点':'注意点','検索別名':'別名',
    '国・地域':'国・地域','法令・制度ID':'法令・制度','製品区分':'対象製品','用途範囲':'対象範囲',
    '判定に使う条件':'確認条件','制限・仕様の説明':'必要な対応','適用日':'適用日','経過措置終了日':'経過措置の期限',
    '項目名':'確認項目','合格・完了条件':'確認内容','必要書類の種類':'資料・記録','表示内容':'表示内容',
    '資料名':'資料名','所管機関':'所管機関','資料の種類':'資料の種類','法的効力':'法令上の位置づけ',
    '統合版日付':'統合版の日付','データベース基準日':'データベース基準日','最終確認日':'資料確認日'
  })[k]||requirementTypeLabel(k);}
  function detailTable(obj,keys){return `<dl class="mbx-detail-table">${keys.map(k=>`<dt>${esc(publicFieldLabel(k))}</dt><dd>${obj[k]===null||obj[k]===''||obj[k]===undefined?'確認できず':esc(obj[k])}</dd>`).join('')}</dl>`;}
  const publicDetailKeys={
    '素材':['正式名称・代表名','大分類','小分類','材料の役割','よくある用途','必ず確認する情報','主な注意点','検索別名'],
    '規制情報':['国・地域','法令・制度ID','製品区分','用途範囲','判定に使う条件','制限・仕様の説明','適用日','経過措置終了日'],
    '確認事項':['項目名','合格・完了条件','必要書類の種類','表示内容'],
    '公式資料':['国・地域','所管機関','資料名','資料の種類','法的効力','統合版日付','データベース基準日','最終確認日']
  };
  function searchDetailHtml(result){const keys=publicDetailKeys[result.type]||[];const link=result.type==='公式資料'&&result.data['公式URL']?`<p><a href="${esc(result.data['公式URL'])}" target="_blank" rel="noopener">公式ページを開く</a></p>`:'';return link+detailTable(result.data,keys);}
  function openDialog(title,html){$('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;$('detailDialog').showModal();}

  function initMeta(){$('metaSummary').textContent=`${DATA.meta.countries.length}法域・規制情報${DATA.meta.ruleCount}件`;$('metaDate').textContent=`${DATA.meta.pendingReviewCount}件は公式資料の詳細を確認中`;}
  function initSelects(){const cs=countries(),ms=materials();fillSelect($('countrySelect'),cs);fillSelect($('materialSelect'),ms,'素材が分からない／未選択');fillSelect($('compareCountryA'),cs);fillSelect($('compareCountryB'),cs);fillSelect($('compareMaterial'),ms,'未指定');fillSelect($('documentCountry'),cs);fillSelect($('documentMaterial'),ms,'未指定');$('compareCountryA').value='日本';$('compareCountryB').value='台湾';const groups=unique(DATA.materials.map(m=>m['大分類'])).sort();$('materialGroupFilter').innerHTML+=groups.map(g=>`<option>${esc(g)}</option>`).join('');}

  function getFormData(){return {country:$('countrySelect').value,productScope:$('productCategory').value,componentName:$('componentName').value.trim(),contactType:$('contactType').value||'不明',materialId:$('materialSelect').value,foodProfile:$('foodProfile').value||'不明',maxTemperature:numberOrNaN('maxTemperature'),contactDuration:numberOrNaN('contactDuration'),durationUnit:$('durationUnit').value,reuseType:$('reuseType').value||'不明',infantProduct:$('infantProduct').value||'不明',containerCapacityLiters:numberOrNaN('containerCapacityLiters'),heavyDutyCoating:$('heavyDutyCoating').value||'不明',ethanolPercent:numberOrNaN('ethanolPercent'),freeFat:$('freeFat').value||'不明',marketRoute:$('marketRoute')?.value||'不明',materialGrade:$('materialGrade').value.trim(),manufacturer:$('materialManufacturer').value.trim(),authorizationNumber:$('authorizationNumber').value.trim(),marketDate:$('marketDate').value,substances:$('substanceDetails').value.trim(),substancePresence:$('substancePresence').value||'unknown',recycled:$('recycledContent').value||'不明',testStatus:$('testStatus').value,documentStatus:$('documentStatus').value,labelStatus:$('labelStatus').value,cleaning:$('cleaningCondition').value.trim()};}
  function savableFormData(){const x=getFormData();return {country:x.country,productScope:x.productScope,contactType:x.contactType,materialId:x.materialId,foodProfile:x.foodProfile,maxTemperature:x.maxTemperature,contactDuration:x.contactDuration,durationUnit:x.durationUnit,reuseType:x.reuseType,infantProduct:x.infantProduct,containerCapacityLiters:x.containerCapacityLiters,heavyDutyCoating:x.heavyDutyCoating,ethanolPercent:x.ethanolPercent,freeFat:x.freeFat,marketDate:x.marketDate,marketRoute:x.marketRoute,recycled:x.recycled};}
  function classifyRule(rule){const cat=norm(rule['製品区分']);const text=norm([rule['製品区分'],rule['用途範囲'],rule['法令・制度ID'],rule['条文・表・通知位置'],rule['対象物質・成分'],rule['判定に使う条件'],rule['制限・仕様の説明']].join(' '));const catMachine=cat.includes('食品機械')||cat.includes('設備');const catPackaging=cat.includes('容器')||cat.includes('包装');const catUtensil=cat.includes('器具');const generalCross=catMachine&&(catPackaging||catUtensil);const pureUtensilPack=!catMachine&&(catPackaging||catUtensil);return {generalCross,pureUtensilPack,machine:/食品機械|設備|機械部品|搬送|ベルト|ホース|パッキン|oリング|シール|配管|タンク/.test(text),component:/部品|接触部|材料|原材料|ホース|ベルト|パッキン|シール/.test(text),cookware:/調理器具|台所用品|器皿|食器|鍋|哺乳瓶/.test(text),container:/容器|ボトル|カップ|トレー|保存容器|哺乳瓶/.test(text),packaging:/包装|フィルム|ラップ|袋|多層|印刷|接着/.test(text),manufacturer:/製造業|製造管理|gmp|工程|品質管理|営業届出|記録保存|capa|バッチ/.test(text),importSales:/輸入|販売|市場投入|輸入宣言|通関|認証|登録|表示/.test(text)};}
  function productMatches(rule,scope){if(!scope)return true;const c=classifyRule(rule);if(scope==='MANUFACTURER')return c.manufacturer;if(scope==='IMPORT_SALES')return c.importSales&&!c.manufacturer;if(scope==='MACHINE_CONTACT')return c.generalCross||c.machine;if(scope==='COMPONENT')return c.generalCross||c.component||c.machine;if(scope==='COOKWARE')return c.generalCross||c.cookware||(c.pureUtensilPack&&!c.packaging);if(scope==='CONTAINER')return c.generalCross||c.container||(c.pureUtensilPack&&!c.packaging);if(scope==='PACKAGING')return c.generalCross||c.packaging||c.pureUtensilPack;return true;}
  function contactMatches(ruleValue,selected){if(!selected||selected==='不明')return true;if(!ruleValue||ruleValue==='すべて')return true;if(selected==='飛散・偶発接触の可能性')return /飛散|偶発/.test(String(ruleValue));return norm(ruleValue).includes(norm(selected));}
  function hours(value,unit){if(!Number.isFinite(value))return NaN;const m={分:1/60,時間:1,日:24,月:730,年:8760};if(unit==='連続')return Infinity;return value*(m[unit]??1);}
  function materialCategoryMatches(ruleValue,group){if(!group||!ruleValue||ruleValue==='すべて')return true;const aliases={プラスチック:['プラスチック','合成樹脂','樹脂'],ゴム:['ゴム','エラストマー'],シリコーン:['シリコーン','ゴム'],ガラス:['ガラス','無機材料'],セラミック:['セラミック','陶磁器','ガラス'], '金属・合金':['金属','合金','鋼'], '紙・板紙':['紙','板紙','セルロース'],再生セルロース:['再生セルロース','セルロース'],木材:['木材','木','竹'],コルク:['コルク'],接着剤:['接着剤','接着'],コーティング:['コーティング','塗膜','ワニス'],印刷インキ:['印刷','インキ'],ワックス:['ワックス'],イオン交換樹脂:['イオン交換'],繊維:['繊維'], '能動・インテリジェント材料':['能動','インテリジェント']};const rv=norm(ruleValue);return (aliases[group]||[group]).some(x=>rv.includes(norm(x)));}
  function materialMatches(rule,input){if(!input.materialId)return true;const ids=splitIds(rule['素材ID']);if(ids.length)return ids.includes(input.materialId);return materialCategoryMatches(rule['素材大分類'],materialGroup(input.materialId));}
  function effectiveDate(input){return input.marketDate||TODAY;}
  function dateAssessment(rule,input){const d=effectiveDate(input),entry=rule['発効日']||null,start=rule['適用日']||rule['施行日']||entry,end=rule['適用終了日'],transitionEnd=rule['経過措置終了日']||null;if(start&&d<start)return {status:'future',active:false,note:entry&&entry<start?`${entry}に発効、${start}から適用予定`:`${start}から適用予定`,transitionActive:false,transitionEnd};if(end&&d>end)return {status:'ended',active:false,note:`${end}で適用終了`,transitionActive:false,transitionEnd};const transitionActive=!!(transitionEnd&&d<=transitionEnd&&(!start||d>=start));return {status:'active',active:true,note:start?`${start}から適用`:'適用中（使用時点の原文を確認）',transitionActive,transitionEnd};}
  function ruleText(rule){return [rule['食品の共通分類'],rule['国別食品区分'],rule['対象物質・成分'],rule['用途範囲'],rule['判定に使う条件'],rule['制限・仕様の説明']].filter(Boolean).join(' ');}
  function infantOnlyRule(rule){return /乳幼児|3歳以下|baby bottle/i.test(ruleText(rule));}
  function infantDedicatedRule(rule){const t=[rule['製品区分'],rule['用途範囲'],rule['条文・表・通知位置']].filter(Boolean).join(' ');return /乳幼児用|乳幼児専用|3歳以下|哺乳瓶|baby bottle/i.test(t)&&!/乳幼児専用品ではない|乳幼児.*使用しない|乳幼児.*不可/i.test(ruleText(rule));}
  function isEuEpoxyRule(rule){return ['REG-EU-EPOXY-BAN-001','REG-EU-EPOXY-BADGE-001'].includes(rule.rule_id);}
  function alcoholLimit(text){const t=String(text||'').replace(/％/g,'%');const patterns=[/エタノール(?:含量|濃度)?\s*(\d+(?:\.\d+)?)\s*%\s*以下/i,/エタノール\s*(\d+(?:\.\d+)?)\s*%\s*超(?:不可|を含まない)/i];for(const p of patterns){const m=t.match(p);if(m)return Number(m[1]);}return NaN;}
  function assessRuleConditions(rule,input){const conflicts=[],unresolved=[],notes=[];let excluded=false;const date=dateAssessment(rule,input);if(date.status!=='active')return {rule,date,active:false,excluded:false,conflicts,unresolved,notes};if(date.transitionActive)unresolved.push(`${date.transitionEnd}までの経過措置が適用されるか、市場投入日と製品区分を確認`);
    if(input.infantProduct==='いいえ'&&infantDedicatedRule(rule)){excluded=true;notes.push('乳幼児専用品ではないため、この専用規定は対象外候補');}
    if(isEuEpoxyRule(rule)&&Number.isFinite(input.containerCapacityLiters)&&input.containerCapacityLiters>10000&&input.heavyDutyCoating==='はい'){excluded=true;notes.push('10,000L超の容器・タンク等に接続する高耐久コーティングの適用除外候補');}
    if(isEuEpoxyRule(rule)&&!excluded){if(!Number.isFinite(input.containerCapacityLiters))unresolved.push('EUエポキシ規制の10,000L超除外を確認するため、容量を確認');else if(input.containerCapacityLiters>10000&&input.heavyDutyCoating==='不明')unresolved.push('10,000L超設備が高耐久コーティング除外に該当するか確認');}
    if(rule['移動経路条件']){if(!input.marketRoute||input.marketRoute==='不明')unresolved.push('GB／NI／EUの市場投入先とNIRMSを含む移動経路を確認');else if(input.marketRoute==='GB→NI NIRMS')unresolved.push('NIRMSの対象となる包装済み小売商品か、空容器・材料・食品機械の単体供給かを個別確認');}
    const minT=Number(rule['最低温度℃']),maxT=Number(rule['最高温度℃']);
    if(rule['最低温度℃']!==null&&rule['最低温度℃']!==''&&Number.isFinite(input.maxTemperature)&&input.maxTemperature<minT)conflicts.push(`使用温度${input.maxTemperature}℃が下限${minT}℃未満`);
    if(rule['最高温度℃']!==null&&rule['最高温度℃']!==''&&Number.isFinite(input.maxTemperature)&&input.maxTemperature>maxT)conflicts.push(`使用温度${input.maxTemperature}℃が上限${maxT}℃を超過`);
    const inputHours=hours(input.contactDuration,input.durationUnit),minRaw=rule['最短時間'],maxRaw=rule['最長時間'];const minHours=(minRaw===null||minRaw===''||minRaw===undefined)?NaN:hours(Number(minRaw),rule['時間単位']);const maxHours=(maxRaw===null||maxRaw===''||maxRaw===undefined)?NaN:hours(Number(maxRaw),rule['時間単位']);
    if(inputHours===Infinity&&Number.isFinite(maxHours))conflicts.push(`連続使用は上限${maxRaw}${rule['時間単位']}を超える`);else {if(Number.isFinite(inputHours)&&Number.isFinite(minHours)&&inputHours<minHours){excluded=true;notes.push(`接触時間が対象範囲の下限${minRaw}${rule['時間単位']}未満のため、この特定用途規制は対象外候補`);}if(Number.isFinite(inputHours)&&Number.isFinite(maxHours)&&inputHours>maxHours)conflicts.push(`接触時間が上限${maxRaw}${rule['時間単位']}を超過`);}
    const reuse=norm(rule['使用回数']);if((input.reuseType==='繰り返し使用'||input.reuseType==='連続使用')&&/単回|使い捨て/.test(reuse))conflicts.push(`${input.reuseType}は単回使用条件の範囲外`);
    const text=ruleText(rule);if((input.foodProfile==='油脂性食品'||input.freeFat==='あり')&&/油脂(?:性)?食品.*不可|遊離脂肪.*(?:なし|ない)|表面(?:に)?油.*(?:なし|ない)/.test(text))conflicts.push('油脂又は遊離脂肪のある食品は対象条件外');
    const limit=alcoholLimit(text);if(Number.isFinite(limit)){if(Number.isFinite(input.ethanolPercent)&&input.ethanolPercent>limit)conflicts.push(`エタノール濃度${input.ethanolPercent}%が上限${limit}%を超過`);else if(!Number.isFinite(input.ethanolPercent)&&(input.foodProfile==='低アルコール'||input.foodProfile==='高アルコール'))unresolved.push(`エタノール濃度が${limit}%以下か数値で確認`);}
    if(/乳幼児専用品ではない|乳幼児.*使用しない/.test(text)&&input.infantProduct==='はい')conflicts.push('乳幼児専用品には使用できない条件');
    return {rule,date,active:true,excluded,conflicts,unresolved,notes};}
  function baseRuleMatches(rule,input){if(rule['国・地域']!==input.country)return false;if(!productMatches(rule,input.productScope))return false;if(!contactMatches(rule['接触区分'],input.contactType))return false;if(!materialMatches(rule,input))return false;return true;}
  function ruleMatches(rule,input){if(!baseRuleMatches(rule,input))return false;const a=assessRuleConditions(rule,input);return a.active&&!a.excluded;}
  function requirementMatchesProduct(q,scope){const text=norm([q['要求の種類'],q['項目名'],q['対象物質'],q['表示内容'],q['追跡・記録内容'],q['備考']].join(' '));if(scope==='MACHINE_CONTACT'&&/容器|包装|ラップ|哺乳瓶|台所用品/.test(text)&&!/機械|設備|部品|ベルト|ホース|パッキン|接触面/.test(text))return false;if(scope==='CONTAINER'&&/機械設備|搬送ベルト/.test(text))return false;if(scope==='PACKAGING'&&/機械設備|搬送ベルト|鍋/.test(text))return false;if(scope==='MANUFACTURER')return /製造|工程|品質|記録|gmp|トレーサビリティ|届出/.test(text)||q['要求の種類']==='製造管理';if(scope==='IMPORT_SALES')return /輸入|販売|表示|認証|登録|市場投入|宣言/.test(text)||q['要求の種類']==='表示';return true;}
  function requirementsForRules(rules,scope){const ids=new Set(rules.map(r=>r.rule_id));return DATA.requirements.filter(q=>ids.has(q.rule_id)&&requirementMatchesProduct(q,scope));}
  function isPendingRule(rule){return pendingMap.has(rule.rule_id);}
  function pendingDetail(rule){return pendingMap.get(rule.rule_id)||null;}
  function ruleStatusLabel(rule){return isPendingRule(rule)?'公式資料の詳細を確認中':'公式資料を確認済み';}
  function pendingListHtml(rules,limit=3){const items=rules.slice(0,limit).map(r=>{const p=pendingDetail(r);return `<li><strong>${esc(r['法令・制度ID'])}</strong>：${esc(p?.['未解決事項']||'公式資料の詳細を確認中')}</li>`;}).join('');return items?`<div class="mbx-pending-note"><strong>公式資料の詳細を確認中 ${rules.length}件</strong><ul class="mbx-list">${items}</ul>${rules.length>limit?`<small>ほか${rules.length-limit}件</small>`:''}</div>`:'';}
  function containsNegatedKeyword(text,keywords){const raw=String(text||'').toLowerCase().replace(/[\s\-_/]+/g,'');return keywords.some(k=>{const x=String(k).toLowerCase().replace(/[\s\-_/]+/g,'');return raw.includes(x+'不使用')||raw.includes(x+'未検出')||raw.includes(x+'含有なし')||raw.includes(x+'を含まない')||raw.includes(x+'free')||raw.includes('without'+x)||raw.includes('no'+x);});}
  function extractFcn(value){const m=String(value||'').match(/(?:fcn\s*)?(\d{1,4})/i);return m?m[1]:'';}
  function autoProhibitionAssessment(input){const bans=[],reviews=[],authorizationInvalids=[],s=norm(input.substances),c=norm(input.componentName);for(const a of (DATA.autoRules||[])){if(a.country!==input.country)continue;if(a.productScopes?.length&&!a.productScopes.includes(input.productScope))continue;const ids=a.materialIds||[a.materialId].filter(Boolean);if(ids.length&&!ids.includes(input.materialId))continue;if(a.componentKeywords?.length&&!a.componentKeywords.some(k=>c.includes(norm(k))))continue;const keywordHit=a.substanceKeywords?.length&&a.substanceKeywords.some(k=>s.includes(norm(k)));if(!keywordHit)continue;if(containsNegatedKeyword(input.substances,a.substanceKeywords||[])||input.substancePresence==='not-present'||input.substancePresence==='not-detected')continue;if(input.substancePresence!=='present'){reviews.push({...a,reviewReason:'対象物質名は入力されていますが、使用・含有ありと確認されていません。'});continue;}
      if(a.conditionCode==='INFANT_PRODUCT'){if(input.infantProduct==='はい')bans.push(a);else if(input.infantProduct==='不明')reviews.push({...a,reviewReason:'乳幼児専用品かを確認してください。'});continue;}
      if(a.conditionCode==='EU_HEAVY_DUTY_EXCEPTION'){if(Number.isFinite(input.containerCapacityLiters)&&input.containerCapacityLiters>10000&&input.heavyDutyCoating==='はい')continue;if(!Number.isFinite(input.containerCapacityLiters)||(input.containerCapacityLiters>10000&&input.heavyDutyCoating==='不明'))reviews.push({...a,reviewReason:'10,000L超の高耐久コーティング除外を確認してください。'});else bans.push(a);continue;}
      if(a.conditionCode==='US_PFAS_FCN_LIST'){const fcn=extractFcn(input.authorizationNumber);if(fcn&&pfasFcnSet.has(fcn))authorizationInvalids.push({...a,reason:`FCN ${fcn}は2025年1月6日から有効ではなく、このFCNを認可根拠として使用できません。`});else reviews.push({...a,reviewReason:'対象35 FCNの番号との一致を確認してください。'});continue;}
      bans.push(a);
    }return {bans,reviews,authorizationInvalids};}
  function stageInfo(input){const contactKnown=input.contactType&&input.contactType!=='不明',materialKnown=!!input.materialId,foodKnown=input.foodProfile&&input.foodProfile!=='不明',reuseKnown=input.reuseType&&input.reuseType!=='不明';let stage=1,label='基本情報';if(contactKnown&&materialKnown){stage=2;label='接触・素材';}if(stage>=2&&foodKnown&&Number.isFinite(input.maxTemperature)&&Number.isFinite(input.contactDuration)&&reuseKnown){stage=3;label='使用条件';}const evidence=input.materialGrade&&(!input.substances||input.substancePresence!=='unknown')&&input.testStatus!=='unknown'&&input.documentStatus!=='unknown'&&input.labelStatus!=='unknown';if(stage>=3&&evidence){stage=4;label='資料・試験情報';}return {stage,label};}
  function resultSafeFinal(stage,missing,actions,banCandidates,review,pending){return stage.stage===4&&missing.length===0&&actions.length===0&&banCandidates.length===0&&review.length===0&&pending.length===0;}
  function isAuthorizationScopeRule(rule){const t=norm([rule['認可の仕組み'],rule['法令・制度ID'],rule['条文・表・通知位置'],rule['認可・収載番号']].join(' '));return rule['ルール効果']==='条件付き許可'&&/認可|収載|公告|新品種|ポジティブリスト|fcn|lono|authori/.test(t);}
  function conditionSummaryHtml(result){const parts=[];if(result.excludedAssessments?.length)parts.push(`<div class="mbx-status-note"><strong>適用除外・対象外候補 ${result.excludedAssessments.length}件</strong><ul class="mbx-list">${result.excludedAssessments.slice(0,3).map(x=>`<li>${esc(x.rule['法令・制度ID'])}：${esc(x.notes.join('／')||'入力条件により対象外候補')}</li>`).join('')}</ul></div>`);if(result.hardConditionConflicts?.length)parts.push(`<div class="mbx-pending-note"><strong>使用条件の上限超過 ${result.hardConditionConflicts.length}件</strong><ul class="mbx-list">${result.hardConditionConflicts.slice(0,3).map(x=>`<li>${esc(x.rule['法令・制度ID'])}：${esc(x.conflicts.join('／'))}</li>`).join('')}</ul></div>`);if(result.scopeConditionConflicts?.length)parts.push(`<div class="mbx-status-note"><strong>この規制の条件外 ${result.scopeConditionConflicts.length}件</strong><ul class="mbx-list">${result.scopeConditionConflicts.slice(0,3).map(x=>`<li>${esc(x.rule['法令・制度ID'])}：${esc(x.conflicts.join('／'))}</li>`).join('')}</ul></div>`);const transitionAssessments=(result.assessments||[]).filter(x=>x.date?.transitionActive);if(transitionAssessments.length)parts.push(`<div class="mbx-status-note"><strong>経過措置の確認</strong><ul class="mbx-list">${transitionAssessments.slice(0,3).map(x=>`<li>${esc(x.rule['法令・制度ID'])}：${esc(x.date.transitionEnd)}までの経過措置が適用されるか、市場投入日と製品区分を確認</li>`).join('')}</ul></div>`);if(result.autoAuthorizationInvalids?.length)parts.push(`<div class="mbx-pending-note"><strong>認可根拠として使用できません</strong><ul class="mbx-list">${result.autoAuthorizationInvalids.slice(0,3).map(x=>`<li>${esc(x.reason)}</li>`).join('')}</ul></div>`);if(result.autoReviews?.length)parts.push(`<div class="mbx-status-note"><strong>追加確認</strong><ul class="mbx-list">${result.autoReviews.slice(0,3).map(x=>`<li>${esc(x.reviewReason)}</li>`).join('')}</ul></div>`);if(result.futureRules?.length)parts.push(`<div class="mbx-status-note"><strong>将来適用 ${result.futureRules.length}件</strong><ul class="mbx-list">${result.futureRules.slice(0,3).map(x=>`<li>${esc(x.rule['法令・制度ID'])}：${esc(x.date.note)}</li>`).join('')}</ul></div>`);return parts.join('');}
  function findingText(input,result){if(result.judgment==='この条件では使用できません')return '入力条件が明確な禁止規定または法令上の上限に一致しています。';if(result.judgment==='この規制の使用条件には適合しません')return 'この規制で認められた使用条件の範囲外です。別の認可や適合根拠がある場合は個別に確認してください。';if(result.judgment==='認可根拠として使用できません')return '入力した認可番号は、この用途の認可根拠として使用できません。';if(result.judgment==='食品接触規制の対象外となる可能性')return '通常使用時の接触経路を確認してください。';if(result.pending?.length)return `入力条件に関係する規制情報のうち${result.pending.length}件は、公式資料の詳細を確認中です。`;if(!input.materialId||input.contactType==='不明')return `${input.country}で${scopeLabel(input.productScope)}を確認するには、食品との接触と素材を確認してください。`;return '入力条件に関係する法令・制度を整理しました。';}
  function evaluate(input){
    const missing=[];const contactKnown=input.contactType&&input.contactType!=='不明',materialKnown=!!input.materialId,foodKnown=input.foodProfile&&input.foodProfile!=='不明',reuseKnown=input.reuseType&&input.reuseType!=='不明';
    if(!contactKnown)missing.push('食品への接触区分');if(!materialKnown)missing.push('素材名');if(contactKnown&&materialKnown&&!foodKnown)missing.push('接触する食品の種類');if(contactKnown&&materialKnown&&!Number.isFinite(input.maxTemperature))missing.push('最高使用温度');if(contactKnown&&materialKnown&&!Number.isFinite(input.contactDuration))missing.push('食品との接触時間');if(contactKnown&&materialKnown&&!reuseKnown)missing.push('使用方法（使い捨て／繰り返し／連続）');if(contactKnown&&materialKnown&&foodKnown&&!input.materialGrade)missing.push('材料グレード・型番');
    const candidates=DATA.rules.filter(r=>baseRuleMatches(r,input));const assessments=candidates.map(r=>assessRuleConditions(r,input));const activeAssessments=assessments.filter(a=>a.active&&!a.excluded);const excludedAssessments=assessments.filter(a=>a.active&&a.excluded);const matched=activeAssessments.map(a=>a.rule);const futureRules=assessments.filter(a=>a.date.status==='future');const endedRules=assessments.filter(a=>a.date.status==='ended');const conditionConflicts=activeAssessments.filter(a=>a.conflicts.length);const scopeConditionConflicts=conditionConflicts.filter(a=>isAuthorizationScopeRule(a.rule));const hardConditionConflicts=conditionConflicts.filter(a=>!isAuthorizationScopeRule(a.rule));const conditionUnresolved=activeAssessments.filter(a=>a.unresolved.length);
    const reqs=requirementsForRules(matched,input.productScope);const sourceIds=matched.flatMap(r=>splitIds(r['公式資料ID'])).concat(reqs.flatMap(q=>splitIds(q['公式資料ID'])));const auto=autoProhibitionAssessment(input);const autoBans=auto.bans,autoReviews=auto.reviews,autoAuthorizationInvalids=auto.authorizationInvalids||[];
    const banCandidates=matched.filter(r=>r['ルール効果']==='明確な禁止'&&!autoBans.some(a=>a.sourceRuleId===r.rule_id));const reviewEffects=new Set(['個別確認要求','別制度で必須確認','事業者手続','食品事業者の運用義務','任意評価・ガイダンス']);const review=matched.filter(r=>reviewEffects.has(r['ルール効果']));const pending=matched.filter(isPendingRule);const reqTypes=new Set(reqs.map(q=>q['要求の種類']));const actions=[];
    if([...reqTypes].some(x=>['試験','数値制限','試験工程','統計的再評価'].includes(x))&&(input.testStatus==='unknown'||input.testStatus==='not-done'))actions.push('必要な試験・数値基準');if(input.testStatus==='fail')actions.push('不適合となった試験項目・測定値・基準値');if(reqs.some(q=>q['文書区分']||['法定適合宣言','公的認可・登録','技術資料','供給者保証','情報伝達','トレーサビリティ','法定保存記録','運用記録','製造管理'].includes(q['要求の種類']))&&(input.documentStatus==='unknown'||input.documentStatus==='missing'))actions.push('必要な書類・記録');if(reqTypes.has('表示')&&(input.labelStatus==='unknown'||input.labelStatus==='missing'))actions.push('必要な表示');
    if(matched.some(r=>r['メーカー限定']==='はい')&&!input.manufacturer)actions.push('認可対象のメーカー・届出者');if(matched.some(r=>r['認可・収載番号'])&&!input.authorizationNumber)actions.push('認可・収載番号');if(autoReviews.length)actions.push(...autoReviews.map(x=>x.reviewReason));if(conditionUnresolved.length)actions.push(...conditionUnresolved.flatMap(x=>x.unresolved));
    const bpaNeedsReview=/BPA|ビスフェノール/i.test(input.substances||'')&&['EU','北アイルランド（NI）','イギリス（GB）'].includes(input.country)&&!input.marketDate;if((matched.some(r=>/BPA|ビスフェノール/i.test(`${r['対象物質・成分']||''}${r['法令・制度ID']||''}`))&&!input.marketDate)||bpaNeedsReview)actions.push('販売・輸入予定日、経過措置、例外');if(input.recycled==='あり')actions.push('再生材の原料、工程、認可・登録');if(banCandidates.length)actions.push('禁止規定の対象範囲、対象物質、例外');if(pending.length)actions.push('公式資料の詳細を確認中の項目');if(futureRules.length)actions.push(`将来適用規制の適用日（基準日 ${effectiveDate(input)}）`);
    const stage=stageInfo(input);let judgment='追加確認が必要',reason='現在の入力だけでは使用可否を確定できません。',cls='judgment-review';
    if(input.contactType==='非接触'){judgment='食品接触規制の対象外となる可能性';reason='通常使用時に食品へ触れず、食品へ物質が移る経路もない場合は、食品接触規制の対象外となる可能性があります。';cls='judgment-out-of-scope';}
    else if(autoBans.length||hardConditionConflicts.length){judgment='この条件では使用できません';reason=autoBans[0]?.reason||hardConditionConflicts[0].conflicts.join('／');cls='judgment-not-usable';}
    else if(scopeConditionConflicts.length){judgment='この規制の使用条件には適合しません';reason=`${scopeConditionConflicts[0].conflicts.join('／')}。別の認可、材料グレードまたは適合根拠がある場合は個別に確認してください。`;cls='judgment-condition-review';}
    else if(autoAuthorizationInvalids.length){judgment='認可根拠として使用できません';reason=autoAuthorizationInvalids[0].reason;cls='judgment-review';}
    else if(contactKnown&&materialKnown&&matched.length){if(pending.length||bpaNeedsReview||autoReviews.length){judgment='追加確認が必要';reason=pending.length?`入力条件に関係する規制情報のうち${pending.length}件は、公式資料の詳細を確認中です。`:(autoReviews[0]?.reviewReason||'例外・適用日・対象範囲を確認してください。');cls='judgment-review';}else if(resultSafeFinal(stage,missing,actions,banCandidates,review,pending)){judgment='最終確認が必要';reason='入力された条件では大きな不足は確認されませんでした。公式資料と製品資料をご確認ください。';cls='judgment-condition-review';}else if(review.length||banCandidates.length||input.testStatus==='fail'){judgment='追加確認が必要';reason='別制度、事業者手続、禁止候補または試験結果の確認が必要です。';cls='judgment-review';}else{judgment='条件の確認が必要';reason='関係する法令・試験・資料の候補を整理しました。';cls='judgment-condition-review';}}
    if(!matched.length&&!['食品接触規制の対象外となる可能性','この条件では使用できません','この規制の使用条件には適合しません','認可根拠として使用できません'].includes(judgment)){judgment='追加確認が必要';reason=futureRules.length?'将来適用の規制候補があります。':'現在の入力では規制情報を十分に絞り込めませんでした。';cls='judgment-review';}
    const next=unique([...missing,...actions]);if(!next.length)next.push('公式資料、認可範囲、例外・経過措置');return {judgment,reason,cls,stage,missing:next,matched,reqs,sourceIds,autoBans,autoReviews,autoAuthorizationInvalids,banCandidates,review,pending,assessments,excludedAssessments,conditionConflicts,hardConditionConflicts,scopeConditionConflicts,conditionUnresolved,futureRules,endedRules};
  }
  function prioritizedRules(rules){const p={'明確な禁止':0,'認可根拠無効':1,'直接物質制限':2,'個別確認要求':3,'条件付き許可':4,'事業者手続':5,'食品事業者の運用義務':6,'別制度で必須確認':7,'任意評価・ガイダンス':8,'許可・使用可能根拠':9,'適用除外':10,'対象外':11};return [...rules].sort((a,b)=>(p[a['ルール効果']]??20)-(p[b['ルール効果']]??20));}
  function renderResult(input,result){
    const box=$('judgeResult');
    box.className=`mbx-result ${result.cls}`;
    box.classList.remove('is-hidden');
    $('resultJudgment').textContent=result.judgment;
    $('resultReason').textContent=result.reason;
    $('resultStage').textContent=`${result.stage.stage}/4`;
    $('resultStageLabel').textContent=result.stage.label;
    const m=materialMap.get(input.materialId);
    const chips=[input.country,scopeLabel(input.productScope),input.componentName,input.contactType!=='不明'?contactLabel(input.contactType):null,m?.['画面表示名'],input.foodProfile!=='不明'?input.foodProfile:null,Number.isFinite(input.maxTemperature)?`${input.maxTemperature}℃`:null,Number.isFinite(input.contactDuration)?`${input.contactDuration}${input.durationUnit}`:null,input.reuseType!=='不明'?input.reuseType:null];
    $('resultConditions').innerHTML=chips.filter(Boolean).map(x=>`<span class="mbx-chip">${esc(x)}</span>`).join('');
    $('currentFinding').innerHTML=`<div class="mbx-status-note">${esc(findingText(input,result))}</div>${conditionSummaryHtml(result)}${pendingListHtml(result.pending)}`;
    $('missingInfo').innerHTML=`<ol class="mbx-list">${result.missing.slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
    const assessmentMap=new Map((result.assessments||[]).map(x=>[x.rule.rule_id,x]));
    const statusFor=r=>{const a=assessmentMap.get(r.rule_id);if(!a)return '';if(a.conflicts.length)return `｜条件外：${a.conflicts.join('／')}`;if(a.unresolved.length)return `｜要確認：${a.unresolved.join('／')}`;return '';};
    const ruleMeta=r=>{const bits=[`必要な対応：${effectLabel(r['ルール効果'])}`];if(r['義務主体'])bits.push(`確認する人：${obligationLabel(r['義務主体'])}`);bits.push(ruleStatusLabel(r));if(r['最終確認日'])bits.push(`資料確認日 ${r['最終確認日']}`);return bits.join('｜')+statusFor(r);};
    const mainRules=prioritizedRules(result.matched).filter((r,i,a)=>a.findIndex(x=>x['法令・制度ID']===r['法令・制度ID'])===i).slice(0,3);
    $('matchedRules').innerHTML=mainRules.length?mainRules.map(r=>`<div class="mbx-rule-item${isPendingRule(r)?' is-pending':''}"><strong>${esc(r['法令・制度ID'])}</strong><div>${esc(r['制限・仕様の説明']||r['判定に使う条件']||'公式資料で詳細を確認')}</div><div class="mbx-rule-meta">${esc(ruleMeta(r))}</div></div>`).join(''):'<div class="mbx-empty">現在の入力では、主な法令・制度を絞り込めませんでした。</div>';
    const groups={};
    result.reqs.forEach(q=>(groups[q['UI表示区分']||'その他']??=[]).push(q));
    $('requiredActions').innerHTML=Object.entries(groups).map(([k,items])=>`<section class="mbx-group"><h3>${esc(requirementGroupLabel(k))}</h3><div class="mbx-group-body">${items.slice(0,10).map(requirementItemHtml).join('')}</div></section>`).join('')||'<div class="mbx-empty">現在の入力では、必要事項を絞り込めませんでした。</div>';
    $('allRules').innerHTML=prioritizedRules(result.matched).slice(0,40).map(r=>{const pending=pendingDetail(r);return `<div class="mbx-rule-item${pending?' is-pending':''}"><strong>${esc(r['法令・制度ID'])}</strong><div>${esc(r['判定に使う条件']||r['制限・仕様の説明']||'追加確認が必要')}</div>${pending?`<div class="mbx-pending-inline">確認中：${esc(pending['未解決事項']||'公式資料の詳細を確認中')}</div>`:''}<div class="mbx-rule-meta">${esc(ruleMeta(r))}</div></div>`;}).join('')||'<div class="mbx-empty">現在の入力では、適用中の規制情報を絞り込めませんでした。</div>';if(result.futureRules?.length)$('allRules').innerHTML+=`<h4>将来適用の候補</h4>${result.futureRules.slice(0,20).map(x=>`<div class="mbx-rule-item"><strong>${esc(x.rule['法令・制度ID'])}</strong><div>${esc(x.rule['判定に使う条件']||x.rule['制限・仕様の説明']||'詳細確認')}</div><div class="mbx-rule-meta">${esc(x.date.note)}</div></div>`).join('')}`;
    $('resultSources').innerHTML=sourceLinks(result.sourceIds,12);
    prepareRefinePanel(input,result);
    $('refineConditionsButton').textContent='条件を追加';
    box.scrollIntoView({behavior:'smooth',block:'start'});
  }

  const refinePatterns=[
    [/食品への接触区分/,'contactType'],[/接触する食品の種類/,'foodProfile'],[/最高使用温度/,'maxTemperature'],
    [/食品との接触時間/,'contactDuration'],[/使用方法/,'reuseType'],[/材料グレード/,'materialGrade'],
    [/添加剤|着色剤|配合成分/,'substanceDetails'],[/メーカー|届出者/,'materialManufacturer'],
    [/認可・収載番号/,'authorizationNumber'],[/販売・輸入予定日|経過措置|適用日/,'marketDate'],[/市場投入先|移動経路|NIRMS/,'marketRoute'],
    [/再生材/,'recycledContent'],[/乳幼児専用品/,'infantProduct'],[/容量/,'containerCapacityLiters'],[/高耐久コーティング/,'heavyDutyCoating'],[/エタノール濃度/,'ethanolPercent'],[/遊離脂肪/,'freeFat'],[/必要な試験|不適合となった試験/,'testStatus'],[/必要な書類|証明書|記録/,'documentStatus'],
    [/必要な表示/,'labelStatus'],[/対象物質の使用|含有状態/,'substancePresence'],[/禁止規定の対象範囲|例外/,'componentName']
  ];
  const basicRefineOrder=['contactType','foodProfile','maxTemperature','contactDuration','reuseType','infantProduct','containerCapacityLiters','heavyDutyCoating','ethanolPercent','freeFat','componentName','marketDate','marketRoute','recycledContent'];
  const expertRefineOrder=['materialGrade','substancePresence','substanceDetails','materialManufacturer','authorizationNumber','testStatus','documentStatus','labelStatus','cleaningCondition'];
  function refineKeys(result,input){
    const found=[];
    result.missing.forEach(item=>refinePatterns.forEach(([pattern,key])=>{if(pattern.test(item))found.push(key);}));
    if(result.banCandidates?.length||result.autoReviews?.length){found.push('componentName','substancePresence','substanceDetails','marketDate');}
    if(result.matched?.some(r=>r['メーカー限定']==='はい'))found.push('materialManufacturer');
    if(result.matched?.some(r=>r['認可・収載番号']))found.push('authorizationNumber');
    const txt=(result.matched||[]).map(ruleText).join(' ');
    if((result.matched||[]).some(infantOnlyRule)||/乳幼児専用品ではない|乳幼児.*使用しない/.test(txt))found.push('infantProduct');
    if((result.matched||[]).some(isEuEpoxyRule))found.push('containerCapacityLiters','heavyDutyCoating');
    if(Number.isFinite(alcoholLimit(txt)))found.push('ethanolPercent');
    if(/油脂(?:性)?食品.*不可|遊離脂肪/.test(txt))found.push('freeFat');
    const uniqueKeys=unique(found);
    const basic=basicRefineOrder.filter(k=>uniqueKeys.includes(k)).slice(0,4);
    const expert=expertRefineOrder.filter(k=>uniqueKeys.includes(k));
    return {basic,expert};
  }
  function prepareRefinePanel(input,result){
    renderResult.last={input,result};
    const {basic,expert}=refineKeys(result,input);
    document.querySelectorAll('[data-refine-field]').forEach(el=>el.classList.add('is-hidden'));
    [...basic,...expert].forEach(key=>document.querySelector(`[data-refine-field="${key}"]`)?.classList.remove('is-hidden'));
    $('expertDetails').classList.toggle('is-hidden',expert.length===0);
    $('expertDetails').open=false;
    $('refineMaterialNote').classList.toggle('is-hidden',!result.missing.includes('素材名'));
    const count=basic.length+expert.length;
    $('refineCount').textContent=basic.length?`${basic.length}項目`:(expert.length?'専門情報':'追加なし');
    $('refineIntro').textContent='';
    $('refineGrid').classList.toggle('is-hidden',basic.length===0);
  }
  function resetRefineFields(){
    const values={contactType:'不明',foodProfile:'不明',maxTemperature:'',contactDuration:'',durationUnit:'時間',reuseType:'不明',infantProduct:'不明',containerCapacityLiters:'',heavyDutyCoating:'不明',ethanolPercent:'',freeFat:'不明',componentName:'',marketDate:'',marketRoute:'不明',recycledContent:'不明',materialGrade:'',materialManufacturer:'',authorizationNumber:'',substancePresence:'unknown',substanceDetails:'',testStatus:'unknown',documentStatus:'unknown',labelStatus:'unknown',cleaningCondition:''};
    Object.entries(values).forEach(([id,value])=>{if($(id))$(id).value=value;});
    $('expertDetails').open=false;
  }
  function renderCountries(filter=''){const q=norm(filter);$('countryCards').innerHTML=DATA.countryProfiles.filter(p=>!q||norm(JSON.stringify(p)).includes(q)).map(p=>`<article class="mbx-card"><h3>${esc(p.country)}</h3><p>${esc(p.authorities.slice(0,2).join('／')||'所管機関は公式資料で確認')}</p><div class="mbx-card-meta"><span>規制情報 ${p.ruleCount}件</span>${p.pendingCount?`<span class="mbx-pending-count">詳細確認中 ${p.pendingCount}件</span>`:'<span>公式資料を確認済み</span>'}</div><ul class="mbx-list">${(p.regulations||[]).slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="mbx-card-actions"><button class="mbx-button mbx-button-primary" data-country-judge="${esc(p.country)}">この国で確認</button><button class="mbx-button mbx-button-light" data-country-detail="${esc(p.country)}">詳細</button></div></article>`).join('')||'<div class="mbx-empty">該当する国・制度は見つかりませんでした。</div>';}
  function renderMaterials(filter='',group=''){const q=norm(filter);$('materialCards').innerHTML=DATA.materials.filter(m=>(!group||m['大分類']===group)&&(!q||norm(JSON.stringify(m)).includes(q))).map(m=>`<article class="mbx-card"><h3>${esc(m['画面表示名'])}<span>${esc(m['正式名称・代表名'])}</span></h3><div class="mbx-card-meta"><span>${esc(m['大分類'])}</span></div><p>${esc(m['よくある用途'])}</p><div class="mbx-caution">${esc(m['主な注意点'])}</div><div class="mbx-card-actions"><button class="mbx-button mbx-button-primary" data-material-judge="${esc(m['素材ID'])}">この素材で確認</button><button class="mbx-button mbx-button-light" data-material-detail="${esc(m['素材ID'])}">詳細</button></div></article>`).join('')||'<div class="mbx-empty">該当する素材は見つかりませんでした。</div>';}

  function inferSystem(rules){const t=norm(rules.map(r=>`${r['法令・制度ID']} ${r['認可の仕組み']} ${r['判定に使う条件']}`).join(' '));const out=[];if(/ポジティブリスト|unionlist|gb9685|収載/.test(t))out.push('原材料・物質リスト型');if(/fcn|cfr|tor/.test(t))out.push('認可経路・用途限定型');if(/lono|b23001/.test(t))out.push('完成品安全評価・任意事前評価型');if(/材質別|qcvn|gb4806|溶出/.test(t))out.push('材質別試験型');if(/一般安全|有害移行|汚染/.test(t))out.push('一般安全・事業者責任型');return out.length?out:['公式規則を個別確認'];}
  function comparisonInput(country){return {country,productScope:$('compareProduct').value,materialId:$('compareMaterial').value,contactType:$('compareContact').value||'不明',foodProfile:$('compareFood').value||'不明',maxTemperature:numberOrNaN('compareTemp'),contactDuration:numberOrNaN('compareDuration'),durationUnit:$('compareDurationUnit').value,reuseType:$('compareReuse').value||'不明',componentName:'',substances:'',marketDate:'',marketRoute:'不明',recycled:'不明',infantProduct:'不明',containerCapacityLiters:NaN,heavyDutyCoating:'不明',ethanolPercent:NaN,freeFat:'不明',substancePresence:'unknown',manufacturer:'',authorizationNumber:'',testStatus:'unknown',documentStatus:'unknown',labelStatus:'unknown'};}
  function comparisonProfile(country){const input=comparisonInput(country);const rules=DATA.rules.filter(r=>ruleMatches(r,input));const reqs=requirementsForRules(rules,input.productScope);const byType=type=>unique(reqs.filter(q=>q['要求の種類']===type).map(q=>q['項目名'])).slice(0,4);const docNames=unique(reqs.filter(q=>q['文書区分']||['法定適合宣言','公的認可・登録','技術資料','供給者保証','情報伝達','トレーサビリティ','法定保存記録','運用記録','製造管理'].includes(q['要求の種類'])).map(q=>`${q['UI表示区分']||'資料'}：${q['項目名']}`)).slice(0,5);const recycle=unique(rules.filter(r=>/再生|recycl/i.test(JSON.stringify(r))).map(r=>r['法令・制度ID'])).slice(0,4);const bans=unique(rules.filter(r=>['明確な禁止','直接物質制限'].includes(r['ルール効果'])).map(r=>`${r['対象物質・成分']||''}：${r['判定に使う条件']||r['制限・仕様の説明']||''}`)).slice(0,4);const review=unique(rules.filter(r=>['個別確認要求','別制度で必須確認','事業者手続','食品事業者の運用義務','任意評価・ガイダンス'].includes(r['ルール効果'])||isPendingRule(r)).map(r=>{const p=pendingDetail(r);return p?`詳細確認中：${p['未解決事項']||r['判定に使う条件']}`:`${r['結果区分']||effectLabel(r['ルール効果'])}：${r['判定に使う条件']||r['制限・仕様の説明']}`;})).slice(0,5);return {country,input,rules,reqs,system:inferSystem(rules),laws:unique(rules.map(r=>r['法令・制度ID'])).slice(0,4),tests:unique([...byType('試験'),...byType('数値制限'),...byType('統計的再評価')]).slice(0,4),docs:docNames,labels:byType('表示'),recycle,bans,review,sourceIds:rules.flatMap(r=>splitIds(r['公式資料ID']))};}
  function listOr(items,empty='現在の条件では候補を絞り込めません'){return items.length?`<ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:`<span class="mbx-rule-meta">${esc(empty)}</span>`;}
  function renderCompareCard(x){return `<article class="mbx-compare-card"><h3>${esc(x.country)}</h3><p>${esc(profileMap.get(x.country)?.authorities?.[0]||'所管機関は公式資料で確認')}</p><div class="mbx-compare-section"><h4>原材料・認可制度</h4>${listOr(x.system)}</div><div class="mbx-compare-section"><h4>主な法令・制度</h4>${listOr(x.laws)}</div><div class="mbx-compare-section"><h4>試験・数値制限</h4>${listOr(x.tests,'使用条件を追加すると絞り込めます')}</div><div class="mbx-compare-section"><h4>書類・製造記録</h4>${listOr(x.docs)}</div><div class="mbx-compare-section"><h4>表示</h4>${listOr(x.labels)}</div><div class="mbx-compare-section"><h4>再生材</h4>${listOr(x.recycle,'該当情報なし／個別に確認が必要')}</div><div class="mbx-compare-section"><h4>禁止・追加確認候補</h4>${listOr([...x.bans,...x.review].slice(0,5),'明確な禁止候補は確認されませんでした。一般安全要件は別途確認してください')}</div><button class="mbx-button mbx-button-light" data-compare-detail="${esc(x.country)}">比較の根拠を見る</button></article>`;}

  function documentInput(){return {country:$('documentCountry').value,productScope:$('documentProduct').value,materialId:$('documentMaterial').value,contactType:$('documentContact').value||'不明',foodProfile:$('documentFood').value||'不明',maxTemperature:numberOrNaN('documentTemp'),contactDuration:NaN,durationUnit:'時間',reuseType:$('documentReuse').value||'不明',componentName:'',substances:'',marketDate:'',marketRoute:'不明',recycled:'不明',infantProduct:'不明',containerCapacityLiters:NaN,heavyDutyCoating:'不明',ethanolPercent:NaN,freeFat:'不明',substancePresence:'unknown',manufacturer:'',authorizationNumber:'',testStatus:'unknown',documentStatus:'unknown',labelStatus:'unknown'};}
  function renderDocuments(){const input=documentInput();if(!input.country){$('documentSummary').textContent='国・地域を選択してください。';$('documentResults').innerHTML='';return;}const rules=DATA.rules.filter(r=>ruleMatches(r,input));const reqs=requirementsForRules(rules,input.productScope);const missing=[];if(!input.materialId)missing.push('素材');if(input.contactType==='不明')missing.push('接触区分');if(input.foodProfile==='不明')missing.push('食品');if(!Number.isFinite(input.maxTemperature))missing.push('温度');if(input.reuseType==='不明')missing.push('使用方法');$('documentSummary').textContent=missing.length?`現在は候補表示です。${missing.join('・')}を追加すると絞り込めます。法定義務、証拠例、運用記録、任意資料は別枠で表示します。`:'入力条件に基づく候補です。誰に求められるか、法令上必要か、確認資料の例かを確認してください。';const groups={};reqs.forEach(q=>(groups[q['UI表示区分']||'その他']??=[]).push(q));$('documentResults').innerHTML=Object.entries(groups).map(([type,items])=>`<section class="mbx-group"><h3>${esc(requirementGroupLabel(type))}</h3><div class="mbx-group-body">${items.slice(0,12).map(requirementItemHtml).join('')}${items.length>12?`<div class="mbx-rule-meta">ほか${items.length-12}件あります。条件を追加すると絞り込めます。</div>`:''}</div></section>`).join('')||'<div class="mbx-empty">該当する候補を絞り込めませんでした。対象や使用条件を見直してください。</div>';}
  function globalSearch(query){const q=norm(query);if(q.length<2){$('globalSearchSummary').textContent='2文字以上入力してください。';$('globalSearchResults').innerHTML='';return;}const results=[];DATA.materials.forEach(x=>{if(norm(JSON.stringify(x)).includes(q))results.push({type:'素材',title:`${x['画面表示名']}｜${x['正式名称・代表名']}`,body:x['主な注意点'],data:x});});DATA.rules.forEach(x=>{if(norm(JSON.stringify(x)).includes(q))results.push({type:'規制情報',title:`${x['国・地域']}｜${x['法令・制度ID']}`,body:x['制限・仕様の説明']||x['判定に使う条件'],data:x});});DATA.requirements.forEach(x=>{if(norm(JSON.stringify(x)).includes(q))results.push({type:'確認事項',title:x['項目名'],body:x['合格・完了条件'],data:x});});DATA.sources.forEach(x=>{if(norm(JSON.stringify(x)).includes(q))results.push({type:'公式資料',title:x['資料名'],body:`${x['国・地域']}｜${x['所管機関']}`,data:x});});$('globalSearchSummary').textContent=`${results.length}件見つかりました。上位100件を表示します。`;$('globalSearchResults').innerHTML=results.slice(0,100).map((r,i)=>`<article class="mbx-search-result"><small>${esc(searchTypeLabel(r.type))}</small><h3>${esc(r.title)}</h3><p>${esc(r.body||'詳細を確認してください')}</p><button class="mbx-button mbx-button-light" data-search-index="${i}">詳細</button></article>`).join('')||'<div class="mbx-empty">該当する情報は見つかりませんでした。</div>';globalSearch.lastResults=results;}

  function bindEvents(){
    document.querySelectorAll('.mbx-tab').forEach(t=>t.addEventListener('click',()=>showView(t.dataset.view)));
    document.querySelectorAll('[data-learning-view]').forEach(t=>t.addEventListener('click',()=>showView(t.dataset.learningView)));
    $('mobileViewSelect').addEventListener('change',e=>showView(e.target.value));
    $('backButton').addEventListener('click',()=>{location.replace('../index.html?from=material-check&view=learn');});
    $('reloadButton').addEventListener('click',()=>location.reload());
    $('dialogClose').addEventListener('click',()=>$('detailDialog').close());
    $('judgeForm').addEventListener('submit',e=>{
      e.preventDefault();
      if(!$('countrySelect').value||!$('productCategory').value){toast('国・地域と確認対象の2項目を選択してください。');return;}
      const input=getFormData();
      $('refinePanel').classList.add('is-hidden');
      renderResult(input,evaluate(input));
    });
    $('clearFormButton').addEventListener('click',()=>{
      $('judgeForm').reset();resetRefineFields();
      $('judgeResult').classList.add('is-hidden');$('refinePanel').classList.add('is-hidden');
      localStorage.removeItem(storageKey);legacyStorageKeys.forEach(k=>localStorage.removeItem(k));
    });
    $('loadExampleButton').addEventListener('click',()=>{
      $('countrySelect').value='日本';$('productCategory').value='MACHINE_CONTACT';$('materialSelect').value='MAT-PL-PP';
      toast('基本検索の入力例を設定しました。');$('countrySelect').scrollIntoView({behavior:'smooth',block:'center'});
    });
    $('refineConditionsButton').addEventListener('click',()=>{
      const state=renderResult.last;if(!state)return;
      prepareRefinePanel(state.input,state.result);$('refinePanel').classList.remove('is-hidden');
      $('refinePanel').scrollIntoView({behavior:'smooth',block:'start'});
    });
    $('recheckButton').addEventListener('click',()=>{
      if(!$('countrySelect').value||!$('productCategory').value){toast('国・地域と確認対象を選択してください。');return;}
      $('refinePanel').classList.add('is-hidden');const input=getFormData();renderResult(input,evaluate(input));
    });
    $('closeRefineButton').addEventListener('click',()=>{$('refinePanel').classList.add('is-hidden');$('judgeResult').scrollIntoView({behavior:'smooth',block:'start'});});
    $('printResultButton').addEventListener('click',()=>window.print());
    $('saveConditionsButton').addEventListener('click',()=>{localStorage.setItem(storageKey,JSON.stringify(savableFormData()));toast('基本条件だけをこの端末に保存しました。部品名・メーカー名・認可番号・配合情報は保存していません。');});
    $('countrySearch').addEventListener('input',e=>renderCountries(e.target.value));
    $('materialSearch').addEventListener('input',()=>renderMaterials($('materialSearch').value,$('materialGroupFilter').value));
    $('materialGroupFilter').addEventListener('change',()=>renderMaterials($('materialSearch').value,$('materialGroupFilter').value));
    $('compareForm').addEventListener('submit',e=>{e.preventDefault();const a=comparisonProfile($('compareCountryA').value),b=comparisonProfile($('compareCountryB').value);const conditions=[scopeLabel($('compareProduct').value),materialMap.get($('compareMaterial').value)?.['画面表示名']||'素材：未指定',$('compareContact').value==='不明'?'接触：未指定':$('compareContact').value,$('compareFood').value==='不明'?'食品：未指定':$('compareFood').value,Number.isFinite(numberOrNaN('compareTemp'))?`${numberOrNaN('compareTemp')}℃`:'温度：未指定',Number.isFinite(numberOrNaN('compareDuration'))?`${numberOrNaN('compareDuration')}${$('compareDurationUnit').value}`:'接触時間：未指定',$('compareReuse').value==='不明'?'使用方法：未指定':$('compareReuse').value];$('compareConditionSummary').innerHTML=conditions.map(x=>`<span class="mbx-chip">${esc(x)}</span>`).join('');$('compareResults').innerHTML=renderCompareCard(a)+renderCompareCard(b);comparisonProfile.last=[a,b];});
    $('documentFilterForm').addEventListener('submit',e=>{e.preventDefault();renderDocuments();});
    $('globalSearch').addEventListener('input',e=>globalSearch(e.target.value));
    document.addEventListener('click',e=>{
      const cj=e.target.dataset.countryJudge;if(cj){$('countrySelect').value=cj;showView('judge');$('countrySelect').focus();}
      const cd=e.target.dataset.countryDetail;if(cd){const p=profileMap.get(cd),rules=DATA.rules.filter(r=>r['国・地域']===cd);openDialog(cd,`<p>${esc(p.authorities.join('／'))}</p><div class="mbx-compare-kpis"><div class="mbx-kpi"><span>規制情報</span><strong>${p.ruleCount}</strong></div><div class="mbx-kpi"><span>確認事項</span><strong>${p.requirementCount}</strong></div><div class="mbx-kpi"><span>公式資料</span><strong>${p.sourceCount}</strong></div><div class="mbx-kpi"><span>詳細確認中</span><strong>${p.pendingCount||0}</strong></div></div><h3>主な制度</h3><ul class="mbx-list">${p.regulations.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h3>公式資料</h3>${sourceLinks(rules.flatMap(r=>splitIds(r['公式資料ID'])),12)}`);}
      const mj=e.target.dataset.materialJudge;if(mj){$('materialSelect').value=mj;showView('judge');$('materialSelect').focus();}
      const md=e.target.dataset.materialDetail;if(md){const m=materialMap.get(md);openDialog(`${m['画面表示名']}｜素材詳細`,detailTable(m,['正式名称・代表名','大分類','小分類','材料の役割','よくある用途','必ず確認する情報','主な注意点','検索別名']));}
      const cc=e.target.dataset.compareDetail;if(cc){const x=(comparisonProfile.last||[]).find(v=>v.country===cc);if(x)openDialog(`${cc}｜比較の根拠`,`${x.rules.slice(0,35).map(r=>`<div class="mbx-rule-item"><strong>${esc(r['法令・制度ID'])}</strong><div>${esc(r['制限・仕様の説明']||r['判定に使う条件']||'追加確認が必要')}</div></div>`).join('')}<h3>公式資料</h3>${sourceLinks(x.sourceIds,12)}`);}
      if(e.target.dataset.searchIndex!==undefined){const r=globalSearch.lastResults?.[Number(e.target.dataset.searchIndex)];if(r)openDialog(r.title,searchDetailHtml(r));}
    });
  }
  function restoreSaved(){
    try{
      const raw=localStorage.getItem(storageKey)||legacyStorageKeys.map(k=>localStorage.getItem(k)).find(Boolean);
      const saved=JSON.parse(raw||'null');if(!saved)return;
      const map={countrySelect:'country',productCategory:'productScope',componentName:'componentName',contactType:'contactType',materialSelect:'materialId',foodProfile:'foodProfile',maxTemperature:'maxTemperature',contactDuration:'contactDuration',durationUnit:'durationUnit',reuseType:'reuseType',infantProduct:'infantProduct',containerCapacityLiters:'containerCapacityLiters',heavyDutyCoating:'heavyDutyCoating',ethanolPercent:'ethanolPercent',freeFat:'freeFat',materialGrade:'materialGrade',materialManufacturer:'manufacturer',authorizationNumber:'authorizationNumber',marketDate:'marketDate',marketRoute:'marketRoute',substanceDetails:'substances',substancePresence:'substancePresence',recycledContent:'recycled',testStatus:'testStatus',documentStatus:'documentStatus',labelStatus:'labelStatus',cleaningCondition:'cleaning'};
      Object.entries(map).forEach(([id,key])=>{if(saved[key]!==undefined&&$(id))$(id).value=saved[key];});
      if(!localStorage.getItem(storageKey))localStorage.setItem(storageKey,JSON.stringify(saved));
      toast('前回保存した入力条件を復元しました。');
    }catch(e){console.warn(e);}
  }

  initMeta();initSelects();renderCountries();renderMaterials();bindEvents();restoreSaved();
})();
