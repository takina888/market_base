(function (global) {
  'use strict';

  const stations = [
    {
      id: 'wnyc', name: 'WNYC', category: 'english', country: 'アメリカ', city: 'ニューヨーク',
      place: 'ニューヨーク・アメリカ',
      description: 'ニュース、文化、社会、インタビュー。自然なアメリカ英語を長く聴ける公共ラジオです。',
      stream: 'https://fm939.wnyc.org/wnycfm', official: 'https://www.wnyc.org/live'
    },
    {
      id: 'whyy', name: 'WHYY', category: 'english', country: 'アメリカ', city: 'フィラデルフィア',
      place: 'フィラデルフィア・アメリカ',
      description: 'ニュースやインタビューを中心に、比較的聞き取りやすいアメリカ英語を届けます。',
      stream: 'https://whyy.streamguys1.com/whyy-mp3', official: 'https://whyy.org/listen/'
    },
    {
      id: 'wbur', name: 'WBUR', category: 'english', country: 'アメリカ', city: 'ボストン',
      place: 'ボストン・アメリカ',
      description: 'ニュース、社会、暮らしの話題を落ち着いた会話で伝えるボストンの公共ラジオです。',
      stream: 'https://fm909.wbur.org/wbur', official: 'https://www.wbur.org/'
    },
    {
      id: 'kqed', name: 'KQED', category: 'english', country: 'アメリカ', city: 'サンフランシスコ',
      place: 'サンフランシスコ・アメリカ',
      description: '地域ニュースから世界の話題まで、明瞭な英語の番組を幅広く放送しています。',
      stream: 'https://streams.kqed.org/kqedradio.mp3', official: 'https://www.kqed.org/radio'
    },
    {
      id: 'bbc-world', name: 'BBC World Service', category: 'english', country: 'イギリス', city: 'ロンドン',
      place: 'ロンドン・イギリス',
      description: '世界のニュースや解説を、国際放送らしい明瞭な英語で聴くことができます。',
      stream: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
      official: 'https://www.bbc.co.uk/sounds/play/live:bbc_world_service'
    },
    {
      id: 'rnz-national', name: 'RNZ National', category: 'english', country: 'ニュージーランド', city: 'ウェリントン',
      place: 'ウェリントン・ニュージーランド',
      description: 'ニュース、文化、インタビューを中心に、ニュージーランドの英語に親しめる放送です。',
      stream: 'https://stream-ice.radionz.co.nz/national.mp3', official: 'https://www.rnz.co.nz/national'
    },
    {
      id: 'fm-gold-delhi', name: 'Akashvani FM Gold Delhi', category: 'talk-music', country: 'インド', city: 'デリー',
      place: 'デリー・インド',
      description: 'ヒンディー語のニュースや会話と、インド映画音楽などを組み合わせた国営放送です。',
      stream: 'https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio005/hlspbaudio005_Auto.m3u8',
      streamType: 'hls', official: 'https://akashvani.gov.in/radio/live.php',
      note: '番組内容は放送スケジュールにより変わります。'
    },
    {
      id: 'kpoa', name: 'KPOA 93.5 FM', category: 'music', country: 'アメリカ', city: 'マウイ',
      place: 'マウイ・ハワイ・アメリカ',
      description: '現代のハワイアンを中心に、島の空気を穏やかに感じられるマウイの音楽局です。',
      stream: 'https://pacificmedia.cdnstream1.com/2794_64.aac',
      streams: [
        { url: 'https://pacificmedia.cdnstream1.com/2794_64.aac', type: 'audio' },
        { url: 'https://pacificmedia.cdnstream1.com/2794_128.mp3', type: 'audio' }
      ],
      official: 'https://kpoa.com/',
      availabilityNote: 'AACで接続できない場合はMP3へ自動で切り替えます。'
    },
    {
      id: 'estilo-leblon', name: 'Radio Estilo Leblon', category: 'music', country: 'ブラジル', city: 'リオデジャネイロ',
      place: 'リオデジャネイロ・ブラジル',
      description: 'ボサノバ、ラウンジ、ジャズを穏やかに楽しめる、リオの空気を感じる音楽局です。',
      stream: 'https://us4.internet-radio.com/proxy/radioestiloleblon?mp=/stream',
      official: 'https://radioestiloleblon.com/'
    },
    {
      id: 'flamenco-radio', name: '🇪🇸 スペイン｜Flamenco Radio', category: 'music', country: 'スペイン', city: 'アンダルシア',
      place: 'アンダルシア・スペイン',
      description: 'フラメンコを24時間届けるCanal Surの公式局です。ギター中心の穏やかな曲から情熱的な歌まで楽しめます。',
      stream: 'https://rtva-live-radio.flumotion.com/rtva/flamenco.mp3',
      official: 'https://www.canalsur.es/radio/flamenco-radio/',
      metadataLabel: '曲名・アーティスト',
      availabilityNote: '曲によって歌や手拍子が力強い時間があります。'
    },
    {
      id: '181-the-mix', name: '181.FM The Mix', category: 'music', country: 'アメリカ', city: '全米',
      place: 'アメリカ',
      description: '耳なじみのよい英語ポップを中心に流す、明るく聴きやすいアメリカの音楽局です。',
      stream: 'https://listen.181fm.com/181-themix_128k.mp3', official: 'https://www.181.fm/links'
    },
    {
      id: 'jazz24', name: 'Jazz24', category: 'music', country: 'アメリカ', city: 'シアトル／タコマ',
      place: 'ワシントン州・アメリカ',
      description: 'スタンダードから現代ジャズまでを24時間届ける、アメリカ発のジャズ専門局です。',
      stream: 'https://knkx-live-a.edge.audiocdn.com/6285_128k', official: 'https://www.jazz24.org/listening',
      metadataLabel: '曲名・アーティスト'
    },
    {
      id: 'j1-hits', name: 'J1 HITS', category: 'music', country: '日本／国際配信', city: '東京をテーマに配信',
      place: '日本のヒット音楽',
      description: '日本のFMで親しまれる現在のJ-POPやヒット曲を中心に流す国際向け音楽局です。',
      stream: 'https://jenny.torontocast.com:2000/stream/J1HITS', official: 'https://www.j1fm.tokyo/',
      metadataLabel: '曲名・アーティスト', nowPlayingPage: 'https://www.j1fm.tokyo/player/j1hits/'
    },
    {
      id: 'air-raagam', name: 'Akashvani Raagam', category: 'music', country: 'インド', city: 'インド全国',
      place: 'インド',
      description: 'ラーガを軸に、ヒンドゥスターニー音楽やカルナータカ音楽などを穏やかに聴ける古典音楽局です。',
      stream: 'https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudioragam/hlspbaudioragam_Auto.m3u8',
      streamType: 'hls', official: 'https://akashvani.gov.in/radio/live.php',
      metadataLabel: '曲名・演奏情報'
    },
    {
      id: 'mosaique-tarab', name: 'Mosaïque FM Tarab', category: 'music', country: 'チュニジア', city: 'チュニス',
      place: 'チュニス・チュニジア',
      description: 'アラブのタラブ、ウードやマカームの響きを中心に楽しむ伝統音楽系ウェブラジオです。',
      stream: 'https://radio.mosaiquefm.net/mosatarab', official: 'https://www.mosaiquefm.net/',
      metadataLabel: '曲名・アーティスト', availabilityNote: '直接再生できない場合は公式ページを利用してください。'
    }
  ];

  global.MarketBaseRadioStations = Object.freeze(
    stations.map(station => Object.freeze({ ...station }))
  );
})(window);
