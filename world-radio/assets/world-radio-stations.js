(function (global) {
  'use strict';

  const stations = [
    {
      id: 'wnyc',
      name: 'WNYC',
      category: 'english',
      country: 'アメリカ',
      city: 'ニューヨーク',
      place: 'ニューヨーク・アメリカ',
      description: 'ニュース、文化、社会、インタビュー。自然なアメリカ英語を長く聴ける公共ラジオです。',
      stream: 'https://fm939.wnyc.org/wnycfm',
      official: 'https://www.wnyc.org/live'
    },
    {
      id: 'whyy',
      name: 'WHYY',
      category: 'english',
      country: 'アメリカ',
      city: 'フィラデルフィア',
      place: 'フィラデルフィア・アメリカ',
      description: 'ニュースやインタビューを中心に、比較的聞き取りやすいアメリカ英語を届けます。',
      stream: 'https://whyy.streamguys1.com/whyy-mp3',
      official: 'https://whyy.org/listen/'
    },
    {
      id: 'wbur',
      name: 'WBUR',
      category: 'english',
      country: 'アメリカ',
      city: 'ボストン',
      place: 'ボストン・アメリカ',
      description: 'ニュース、社会、暮らしの話題を落ち着いた会話で伝えるボストンの公共ラジオです。',
      stream: 'https://fm909.wbur.org/wbur',
      official: 'https://www.wbur.org/'
    },
    {
      id: 'kqed',
      name: 'KQED',
      category: 'english',
      country: 'アメリカ',
      city: 'サンフランシスコ',
      place: 'サンフランシスコ・アメリカ',
      description: '地域ニュースから世界の話題まで、明瞭な英語の番組を幅広く放送しています。',
      stream: 'https://streams.kqed.org/kqedradio.mp3',
      official: 'https://www.kqed.org/radio'
    },
    {
      id: 'bbc-world',
      name: 'BBC World Service',
      category: 'english',
      country: 'イギリス',
      city: 'ロンドン',
      place: 'ロンドン・イギリス',
      description: '世界のニュースや解説を、国際放送らしい明瞭な英語で聴くことができます。',
      stream: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
      official: 'https://www.bbc.co.uk/sounds/play/live:bbc_world_service'
    },
    {
      id: 'rnz-national',
      name: 'RNZ National',
      category: 'english',
      country: 'ニュージーランド',
      city: 'ウェリントン',
      place: 'ウェリントン・ニュージーランド',
      description: 'ニュース、文化、インタビューを中心に、ニュージーランドの英語に親しめる放送です。',
      stream: 'https://stream-ice.radionz.co.nz/national.mp3',
      official: 'https://www.rnz.co.nz/national'
    },
    {
      id: 'kpoa',
      name: 'KPOA 93.5 FM',
      category: 'music',
      country: 'アメリカ',
      city: 'マウイ',
      place: 'マウイ・ハワイ・アメリカ',
      description: '現代のハワイアンを中心に、島の空気を穏やかに感じられるマウイの音楽局です。',
      stream: 'https://pacificmedia.cdnstream1.com/2794_128.mp3',
      official: 'https://kpoa.com/'
    },
    {
      id: 'estilo-leblon',
      name: 'Radio Estilo Leblon',
      category: 'music',
      country: 'ブラジル',
      city: 'リオデジャネイロ',
      place: 'リオデジャネイロ・ブラジル',
      description: 'ボサノバ、ラウンジ、ジャズを穏やかに楽しめる、リオの空気を感じる音楽局です。',
      stream: 'https://us4.internet-radio.com/proxy/radioestiloleblon?mp=/stream',
      official: 'https://radioestiloleblon.com/'
    },
    {
      id: 'lounge-radio',
      name: 'LOUNGE-RADIO.COM',
      category: 'music',
      country: 'スイス',
      city: 'オンライン放送',
      place: 'スイス',
      description: 'ラウンジ、ニュージャズ、ブラジリアン・エレクトロをゆったり流すリゾート系の音楽局です。',
      stream: 'https://fr1.streamhosting.ch/lounge128.mp3',
      official: 'https://lounge-radio.com/'
    },
    {
      id: '181-the-mix',
      name: '181.FM The Mix',
      category: 'music',
      country: 'アメリカ',
      city: '全米',
      place: 'アメリカ',
      description: '耳なじみのよい英語ポップを中心に流す、明るく聴きやすいアメリカの音楽局です。',
      stream: 'https://listen.181fm.com/181-themix_128k.mp3',
      official: 'https://www.181.fm/links'
    }
  ];

  global.MarketBaseRadioStations = Object.freeze(
    stations.map(station => Object.freeze({ ...station }))
  );
})(window);
