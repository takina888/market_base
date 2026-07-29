(() => {
  'use strict';
  const stations = {
    'wnyc': {name:'WNYC', place:'NEW YORK · USA', desc:'ニュース、文化、社会、インタビューを届けるニューヨークの公共ラジオ。', url:'https://www.wnyc.org/live'},
    'abc-rn': {name:'ABC Radio National', place:'AUSTRALIA', desc:'文化、科学、社会を丁寧に掘り下げるオーストラリアのラジオ。', url:'https://www.abc.net.au/listen/live/radionational'},
    'hpr1': {name:'Hawaiʻi Public Radio HPR-1', place:'HONOLULU · HAWAIʻI', desc:'ハワイの地域ニュース、文化、インタビューを届けます。', url:'https://www.hawaiipublicradio.org/where-to-listen'},
    'abc-aus': {name:'ABC Radio Australia', place:'AUSTRALIA · PACIFIC', desc:'太平洋地域のニュースと暮らしの話題を伝えます。', url:'https://www.abc.net.au/listen/live/radioaustralia'},
    'kpoa': {name:'KPOA 93.5 FM', place:'MAUI · HAWAIʻI', desc:'伝統的なハワイアンから現代のアイランド音楽まで。', url:'https://kpoa.com/'},
    'kapa': {name:'KAPA Hawaiian FM', place:'HAWAIʻI ISLAND', desc:'ハワイ島のアーティストと島の音楽に出会える放送。', url:'https://kaparadio.com/'},
    'kine': {name:'Hawaiian 105 KINE', place:'HONOLULU · HAWAIʻI', desc:'ホノルルから届く、親しみやすいハワイアン音楽。', url:'https://www.hawaiian105.com/'},
    'raagam': {name:'AIR Raagam', place:'INDIA', desc:'ヒンドゥスターニー音楽とカルナータカ音楽を中心とするインド古典音楽。', url:'https://akashvani.gov.in/radio/live.php'},
    'fmgold': {name:'FM Gold Delhi', place:'DELHI · INDIA', desc:'インド映画音楽、懐かしい曲、街の情報やトークを織り交ぜます。', url:'https://akashvani.gov.in/radio/live.php'},
    'mcd': {name:'Monte Carlo Doualiya', place:'ARAB WORLD', desc:'アラビア語のニュース、文化、社会、音楽を届ける国際放送。', url:'https://www.mc-doualiya.com/'},
    'sawt': {name:'Sawt El Ghad', place:'BEIRUT · LEBANON', desc:'ベイルートからアラブ音楽、娯楽、ニュース、トークを届けます。', url:'https://www.sawtelghad.com/'},
    'connect': {name:'Connect Brazil', place:'BRAZIL', desc:'ボサノヴァ、サンバ、MPB、ブラジリアンジャズ。', url:'https://www.connectbrazil.com/lounge/'},
    'radio-cultura': {name:'Rádio Cultura Brasil', place:'SÃO PAULO · BRAZIL', desc:'ブラジルの音楽と文化を伝える公共系放送。', url:'https://culturabrasil.cmais.com.br/'},
    'celtic': {name:'Celtic Music Radio', place:'GLASGOW · SCOTLAND', desc:'ケルト、フォーク、ルーツ音楽と土地の話題。', url:'https://www.celticmusicradio.net/'},
    'rte': {name:'RTÉ Raidió na Gaeltachta', place:'IRELAND', desc:'アイルランド語の会話と伝統音楽が流れる放送。', url:'https://www.rte.ie/radio/rnag/'},
    'afropulse': {name:'AfroPulse FM', place:'WEST AFRICA', desc:'アフロビーツ、ハイライフ、アフリカンポップ。', url:'https://afropulsefm.com/'},
    'classic105': {name:'Classic 105 Kenya', place:'NAIROBI · KENYA', desc:'英語のトークとアフリカンポップを届ける都市型放送。', url:'https://classic105.com/'},
    'radio-caribbean': {name:'Radio Caribbean International', place:'SAINT LUCIA · CARIBBEAN', desc:'カリブの音楽、ニュース、地域の声。', url:'https://www.rcistlucia.com/'},
    'radio3': {name:'RTVE Radio 3', place:'SPAIN', desc:'スペインと地中海周辺の音楽、文化番組。', url:'https://www.rtve.es/play/radio/radio-3/'},
    'antena2': {name:'Antena 2', place:'PORTUGAL', desc:'クラシック、現代音楽、文化を届けるポルトガルの放送。', url:'https://www.rtp.pt/play/direto/antena2'}
  };
  const params = new URLSearchParams(location.search);
  const station = stations[params.get('id')] || stations.wnyc;
  document.title = `${station.name}｜世界のラジオ｜MARKET BASE`;
  document.getElementById('stationName').textContent = station.name;
  document.getElementById('stationPlace').textContent = station.place;
  document.getElementById('stationDescription').textContent = station.desc;

  document.getElementById('openOfficial').href = station.url;
  document.getElementById('windowClose').addEventListener('click', () => window.close());
})();
