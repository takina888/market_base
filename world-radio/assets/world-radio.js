(() => {
  'use strict';
  const stations = [
    {id:'wnyc',tab:'english',name:'WNYC',place:'ニューヨーク・アメリカ',desc:'ニュース、文化、社会、インタビュー。会話量が多い公共ラジオ。',url:'https://www.wnyc.org/live'},
    {id:'abc-rn',tab:'english',name:'ABC Radio National',place:'オーストラリア',desc:'文化、科学、社会、仕事を落ち着いた英語で掘り下げます。',url:'https://www.abc.net.au/listen/live/radionational'},
    {id:'hpr1',tab:'english',name:'Hawaiʻi Public Radio HPR-1',place:'ホノルル・ハワイ',desc:'ハワイの地域ニュース、文化、インタビューを中心に放送。',url:'https://www.hawaiipublicradio.org/where-to-listen'},
    {id:'abc-aus',tab:'english',name:'ABC Radio Australia',place:'オーストラリア／太平洋',desc:'太平洋地域のニュースと生活情報。比較的明瞭な英語です。',url:'https://www.abc.net.au/listen/live/radioaustralia'},
    {id:'kpoa',tab:'hawaii',name:'KPOA 93.5 FM',place:'マウイ・ハワイ',desc:'伝統的なハワイアンから現代のアイランド音楽まで。',url:'https://kpoa.com/'},
    {id:'kapa',tab:'hawaii',name:'KAPA Hawaiian FM',place:'ハワイ島',desc:'地元アーティストを中心に、ハワイ島らしい音楽を楽しめます。',url:'https://kaparadio.com/'},
    {id:'kine',tab:'hawaii',name:'Hawaiian 105 KINE',place:'ホノルル・ハワイ',desc:'明るく聴きやすい定番のハワイアン音楽局。',url:'https://www.hawaiian105.com/'},
    {id:'raagam',tab:'india',name:'AIR Raagam',place:'インド',desc:'ヒンドゥスターニー音楽とカルナータカ音楽を中心とするインド古典音楽。',url:'https://akashvani.gov.in/radio/live.php'},
    {id:'fmgold',tab:'india',name:'FM Gold Delhi',place:'デリー・インド',desc:'インド映画音楽、懐かしい曲、情報やトークを織り交ぜます。',url:'https://akashvani.gov.in/radio/live.php'},
    {id:'mcd',tab:'arabia',name:'Monte Carlo Doualiya',place:'アラブ世界',desc:'アラビア語のニュース、文化、社会、音楽を届ける国際放送。',url:'https://www.mc-doualiya.com/'},
    {id:'sawt',tab:'arabia',name:'Sawt El Ghad',place:'ベイルート・レバノン',desc:'アラブ音楽、娯楽、ニュース、トークが混ざる都市型ラジオ。',url:'https://www.sawtelghad.com/'},
    {id:'connect',tab:'brazil',name:'Connect Brazil',place:'ブラジル',desc:'ボサノヴァ、サンバ、MPB、ブラジリアンジャズ。',url:'https://www.connectbrazil.com/lounge/'},
    {id:'radio-cultura',tab:'brazil',name:'Rádio Cultura Brasil',place:'サンパウロ・ブラジル',desc:'ブラジル音楽と文化を落ち着いて楽しめる公共系放送。',url:'https://culturabrasil.cmais.com.br/'},
    {id:'celtic',tab:'celtic',name:'Celtic Music Radio',place:'グラスゴー・スコットランド',desc:'ケルト、フォーク、ルーツ音楽と出演者のトーク。',url:'https://www.celticmusicradio.net/'},
    {id:'rte',tab:'celtic',name:'RTÉ Raidió na Gaeltachta',place:'アイルランド',desc:'アイルランド語の会話と伝統音楽。土地の空気を感じられます。',url:'https://www.rte.ie/radio/rnag/'},
    {id:'afropulse',tab:'africa',name:'AfroPulse FM',place:'西アフリカ',desc:'アフロビーツ、ハイライフ、アフリカンポップ。',url:'https://afropulsefm.com/'},
    {id:'classic105',tab:'africa',name:'Classic 105 Kenya',place:'ナイロビ・ケニア',desc:'英語のトークとアフリカンポップを混ぜて楽しめる都市型放送。',url:'https://classic105.com/'},
    {id:'radio-caribbean',tab:'caribbean',name:'Radio Caribbean International',place:'セントルシア・カリブ海',desc:'カリブの音楽、ニュース、地域トーク。',url:'https://www.rcistlucia.com/'},
    {id:'radio3',tab:'caribbean',name:'RTVE Radio 3',place:'スペイン',desc:'スペインと地中海周辺の多彩な音楽、文化番組。',url:'https://www.rtve.es/play/radio/radio-3/'},
    {id:'antena2',tab:'caribbean',name:'Antena 2',place:'ポルトガル',desc:'クラシック、現代音楽、文化。静かに聴きたい時間向け。',url:'https://www.rtp.pt/play/direto/antena2'}
  ];
  const grid = document.getElementById('stationGrid');
  const nowPlaying = document.getElementById('nowPlaying');
  const nowDetail = document.getElementById('nowDetail');
  const closePlayer = document.getElementById('closePlayer');
  const timerStatus = document.getElementById('timerStatus');
  let playerWindow = null;
  let activeStation = null;
  let timerEnd = 0;
  let timerInterval = null;

  function render(tab){
    grid.innerHTML = stations.filter(s => s.tab === tab).map(s => `<article class="station-card"><p class="station-meta">${s.place}</p><h2>${s.name}</h2><p>${s.desc}</p><button class="radio-open" type="button" data-station="${s.id}">▶ 公式ライブを聴く</button></article>`).join('');
  }
  function openStation(id){
    const s = stations.find(x => x.id === id); if(!s) return;
    if(playerWindow && !playerWindow.closed) playerWindow.close();
    playerWindow = window.open(`player.html?id=${encodeURIComponent(s.id)}`,'marketBaseRadioPlayer','popup=yes,width=520,height=760,resizable=yes,scrollbars=yes');
    if(!playerWindow){ nowDetail.textContent='ポップアップがブロックされました。ブラウザで許可してください。'; return; }
    activeStation=s; nowPlaying.textContent=s.name; nowDetail.textContent=`${s.place}｜MARKET BASEのラジオ小窓を開きました`; closePlayer.disabled=false;
  }
  function clearTimer(message='タイマーは設定されていません'){
    timerEnd=0; if(timerInterval){clearInterval(timerInterval);timerInterval=null;} timerStatus.textContent=message;
  }
  function setTimer(minutes){
    timerEnd=Date.now()+minutes*60000;
    if(timerInterval) clearInterval(timerInterval);
    const tick=()=>{const left=Math.max(0,timerEnd-Date.now()); if(left<=0){if(playerWindow&&!playerWindow.closed)playerWindow.close(); closePlayer.disabled=true; nowPlaying.textContent='再生を停止しました'; nowDetail.textContent=`スリープタイマー（${minutes}分）が終了しました`; clearTimer('タイマーが終了しました'); return;} const total=Math.ceil(left/1000),m=Math.floor(total/60),s=String(total%60).padStart(2,'0'); timerStatus.textContent=`停止まで ${m}:${s}`;};
    tick(); timerInterval=setInterval(tick,1000);
  }
  document.addEventListener('click',e=>{
    const open=e.target.closest('.radio-open'); if(open){openStation(open.dataset.station);return;}
    const tab=e.target.closest('[role="tab"]'); if(tab){document.querySelectorAll('[role="tab"]').forEach(b=>b.setAttribute('aria-selected',String(b===tab)));render(tab.dataset.tab);return;}
    const timer=e.target.closest('[data-minutes]'); if(timer){setTimer(Number(timer.dataset.minutes));}
  });
  closePlayer.addEventListener('click',()=>{if(playerWindow&&!playerWindow.closed)playerWindow.close();closePlayer.disabled=true;nowPlaying.textContent='再生ウインドウを閉じました';nowDetail.textContent=activeStation?activeStation.name:'局を選んでください';clearTimer();});
  document.getElementById('timerCancel').addEventListener('click',()=>clearTimer('タイマーを解除しました'));
  document.getElementById('pageRefreshButton').addEventListener('click',()=>location.reload());
  render('english');
})();
