(function addFoodMachineryImportDatabaseToSearch(){
  const index=window.MARKET_BASE_CROSS_DB_SEARCH_INDEX;
  if(!index||!Array.isArray(index.dbs)||index.dbs.some(db=>db.id==='food_machinery_import')) return;
  index.dbs.push({
    id:'food_machinery_import',
    title:'各国食品機械輸入量DB',
    category:'食品機械・輸入統計',
    url:'food-machinery-import-v273-r32u.html',
    record_count:174,
    countries:[],
    records:[
      {title:'加熱・調理機械',search:'加熱 調理 食品機械 輸入 HS 841981'},
      {title:'製パン・製菓機械',search:'パン 菓子 製造 食品機械 輸入 HS 843810'},
      {title:'菓子・チョコレート機械',search:'菓子 チョコレート 製造 食品機械 輸入 HS 843820'},
      {title:'製糖機械',search:'砂糖 製糖 製造 食品機械 輸入 HS 843830'},
      {title:'醸造機械',search:'醸造 飲料 製造 食品機械 輸入 HS 843840'},
      {title:'肉類調製機械',search:'食肉 肉類 調製 加工 機械 輸入 HS 843850'},
      {title:'果実・野菜・ナッツ調製機械',search:'果実 野菜 ナッツ 調製 加工 機械 輸入 HS 843860'},
      {title:'その他の食品加工機械',search:'食品 飲料 その他 加工 機械 輸入 HS 843880'}
    ]
  });
  if(index.meta) index.meta.db_count=index.dbs.length;
})();
