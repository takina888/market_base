(function(global){
  "use strict";
  function shortUsd(value){
    if(value>=1000000000000)return (value/1000000000000).toFixed(2)+"兆米ドル";
    if(value>=100000000)return (value/100000000).toFixed(1)+"億米ドル";
    if(value>=10000)return (value/10000).toFixed(0)+"万米ドル";
    return new Intl.NumberFormat("ja-JP",{maximumFractionDigits:0}).format(value)+"米ドル";
  }
  async function mount(options){
    var container=typeof options.container==="string"?document.querySelector(options.container):options.container;
    if(!container)return;
    var iso3=String(options.iso3||"").toUpperCase();
    try{
      var response=await fetch(options.dataUrl||"assets/food_machinery_import_data.json");
      if(!response.ok)throw new Error("data load failed");
      var data=await response.json();
      var country=data.countries.find(function(item){return item.iso3===iso3;});
      if(!country){container.innerHTML='<div class="mb-food-import-panel mb-food-import-empty">食品機械輸入データは確認できません。</div>';return;}
      var years=data.years.map(function(year){
        var item=country.series[String(year)];
        var japan=item&&item.japanTotal!=null?shortUsd(item.japanTotal):'—';
        var share=item&&item.japanShare!=null?(item.japanShare*100).toFixed(2)+'%':'—';
        var rank=item&&item.japanDestinationRank?'日本からの輸入 '+item.japanDestinationRank+'位':'順位なし';
        return '<div class="mb-food-import-year"><b>'+year+'</b><strong>日本 '+japan+'</strong><span>'+rank+' / 日本比率 '+share+'</span><small>世界総額 '+(item?shortUsd(item.total):'—')+'</small></div>';
      }).join("");
      var detail=(options.detailUrl||"food-machinery-import-v273-r32u.html")+'?country='+encodeURIComponent(iso3)+'&year=2025&scope=japan&view=country';
      container.innerHTML='<section class="mb-food-import-panel"><h3>各国食品機械輸入量DB</h3><p class="mb-food-import-sub">'+country.countryJa+'（国際コード '+country.iso3+'）　2021～2025年</p><div class="mb-food-import-grid">'+years+'</div><a class="mb-food-import-link" href="'+detail+'">グラフ・HSコード別内訳を見る</a></section>';
    }catch(error){container.innerHTML='<div class="mb-food-import-panel mb-food-import-empty">食品機械輸入データを読み込めませんでした。</div>';}
  }
  global.MarketBaseFoodImport={mount:mount};
})(window);
