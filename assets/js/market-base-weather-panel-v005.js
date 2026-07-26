(() => {
  'use strict';

  const STORAGE_KEYS = {
    location: 'mb-weather-location-v2',
    coreCache: 'mb-weather-core-cache-v2',
    dailyCache: 'mb-weather-daily-cache-v2'
  };

  const CACHE_LIMITS = {
    coreFresh: 15 * 60 * 1000,
    coreFallback: 60 * 60 * 1000,
    dailyFresh: 6 * 60 * 60 * 1000,
    dailyFallback: 24 * 60 * 60 * 1000,
    maxEntries: 4
  };


  const OFFICIAL_SOURCES = Object.freeze({
    "JP": { name: "気象庁（日本）", weatherUrl: "https://www.jma.go.jp/bosai/nowc/", warningUrl: "https://www.jma.go.jp/bosai/warning/", description: "日本では気象庁の雨雲、警報、キキクル、台風、地震・津波などを用途別に確認できます。", weatherLabel: "気象庁の雨雲の動きを見る", warningLabel: "気象庁の警報・注意報を見る" },
    "TW": { name: "交通部中央気象署（台湾）", weatherUrl: "https://www.cwa.gov.tw/V8/C/W/OBS_Radar.html", warningUrl: "https://www.cwa.gov.tw/V8/C/P/Warning/W26.html", description: "台湾の公式レーダー回波と警特報を確認できます。", weatherLabel: "中央気象署のレーダー回波を見る", warningLabel: "中央気象署の警特報を見る" },
    "HK": { name: "香港天文台", weatherUrl: "https://www.hko.gov.hk/en/wxinfo/radars/radar.htm", warningUrl: "https://www.hko.gov.hk/en/index.html", description: "香港の公式気象レーダー画像と最新の警報情報を確認できます。", weatherLabel: "香港天文台のレーダー画像を見る", warningLabel: "香港天文台の警報情報を見る" },
    "MO": { name: "澳門地球物理氣象局", weatherUrl: "https://www.smg.gov.mo/en", warningUrl: "https://www.smg.gov.mo/en", description: "マカオの公式予報・警報情報を確認できます。" },
    "CN": { name: "中国気象局・国家気象中心", weatherUrl: "https://www.nmc.cn/", warningUrl: "https://www.nmc.cn/", description: "中国の公式予報、レーダー、災害警報情報を確認できます。" },
    "KR": { name: "韓国気象庁", weatherUrl: "https://www.weather.go.kr/w/index.do", warningUrl: "https://www.weather.go.kr/w/index.do", description: "韓国の公式予報と気象特報を確認できます。" },
    "SG": { name: "Meteorological Service Singapore", weatherUrl: "https://www.weather.gov.sg/home/", warningUrl: "https://www.weather.gov.sg/home/", description: "シンガポールの公式ナウキャスト、予報、警報を確認できます。" },
    "TH": { name: "Thai Meteorological Department", weatherUrl: "https://www.tmd.go.th/en", warningUrl: "https://www.tmd.go.th/en", description: "タイの公式予報と警報情報を確認できます。" },
    "VN": { name: "National Center for Hydro-Meteorological Forecasting", weatherUrl: "https://nchmf.gov.vn/KttvsiteE/en-US/2/index.html", warningUrl: "https://nchmf.gov.vn/KttvsiteE/en-US/2/index.html", description: "ベトナムの公式気象・水文予報を確認できます。" },
    "MY": { name: "MET Malaysia", weatherUrl: "https://www.met.gov.my/en/", warningUrl: "https://www.met.gov.my/en/", description: "マレーシアの公式予報と警報情報を確認できます。" },
    "ID": { name: "BMKG（インドネシア）", weatherUrl: "https://www.bmkg.go.id/", warningUrl: "https://www.bmkg.go.id/", description: "インドネシアの公式天気・地震・警報情報を確認できます。" },
    "PH": { name: "PAGASA（フィリピン）", weatherUrl: "https://www.pagasa.dost.gov.ph/", warningUrl: "https://www.pagasa.dost.gov.ph/", description: "フィリピンの公式予報、台風、警報情報を確認できます。" },
    "IN": { name: "India Meteorological Department", weatherUrl: "https://mausam.imd.gov.in/", warningUrl: "https://mausam.imd.gov.in/", description: "インドの公式予報、レーダー、警報情報を確認できます。" },
    "PK": { name: "Pakistan Meteorological Department", weatherUrl: "https://www.pmd.gov.pk/en/", warningUrl: "https://www.pmd.gov.pk/en/", description: "パキスタンの公式予報と警報情報を確認できます。" },
    "BD": { name: "Bangladesh Meteorological Department", weatherUrl: "https://www.bmd.gov.bd/", warningUrl: "https://www.bmd.gov.bd/", description: "バングラデシュの公式予報と警報情報を確認できます。" },
    "LK": { name: "Department of Meteorology Sri Lanka", weatherUrl: "https://meteo.gov.lk/", warningUrl: "https://meteo.gov.lk/", description: "スリランカの公式予報と警報情報を確認できます。" },
    "NP": { name: "Department of Hydrology and Meteorology Nepal", weatherUrl: "https://www.dhm.gov.np/", warningUrl: "https://www.dhm.gov.np/", description: "ネパールの公式気象・水文情報を確認できます。" },
    "AE": { name: "UAE National Center of Meteorology", weatherUrl: "https://www.ncm.ae/en", warningUrl: "https://www.ncm.ae/en", description: "アラブ首長国連邦の公式予報と警報情報を確認できます。" },
    "SA": { name: "Saudi National Center for Meteorology", weatherUrl: "https://ncm.gov.sa/", warningUrl: "https://ncm.gov.sa/", description: "サウジアラビアの公式予報と警報情報を確認できます。" },
    "QA": { name: "Qatar Meteorology Department", weatherUrl: "https://www.caa.gov.qa/en-us/Meteorology", warningUrl: "https://www.caa.gov.qa/en-us/Meteorology", description: "カタールの公式気象情報を確認できます。" },
    "IL": { name: "Israel Meteorological Service", weatherUrl: "https://ims.gov.il/en", warningUrl: "https://ims.gov.il/en", description: "イスラエルの公式予報と警報情報を確認できます。" },
    "TR": { name: "Turkish State Meteorological Service", weatherUrl: "https://www.mgm.gov.tr/", warningUrl: "https://www.mgm.gov.tr/", description: "トルコの公式予報と警報情報を確認できます。" },
    "GB": { name: "Met Office（英国）", weatherUrl: "https://www.metoffice.gov.uk/", warningUrl: "https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings", description: "英国の公式予報と気象警報を確認できます。", warningLabel: "Met Officeの警報情報を見る" },
    "FR": { name: "Météo-France", weatherUrl: "https://meteofrance.com/", warningUrl: "https://vigilance.meteofrance.fr/", description: "フランスの公式予報とVigilance警報を確認できます。", warningLabel: "Météo-Franceの警報を見る" },
    "DE": { name: "Deutscher Wetterdienst", weatherUrl: "https://www.dwd.de/EN/", warningUrl: "https://www.dwd.de/EN/weather/warnings/warnings_node.html", description: "ドイツの公式予報と警報情報を確認できます。", warningLabel: "DWDの警報を見る" },
    "IT": { name: "Meteo Aeronautica（イタリア）", weatherUrl: "https://www.meteoam.it/", warningUrl: "https://www.meteoam.it/", description: "イタリアの公式気象情報を確認できます。" },
    "ES": { name: "AEMET（スペイン）", weatherUrl: "https://www.aemet.es/en/portada", warningUrl: "https://www.aemet.es/en/eltiempo/prediccion/avisos", description: "スペインの公式予報と警報情報を確認できます。", warningLabel: "AEMETの警報を見る" },
    "NL": { name: "KNMI（オランダ）", weatherUrl: "https://www.knmi.nl/home", warningUrl: "https://www.knmi.nl/nederland-nu/weer/waarschuwingen", description: "オランダの公式予報と警報情報を確認できます。", warningLabel: "KNMIの警報を見る" },
    "BE": { name: "Royal Meteorological Institute of Belgium", weatherUrl: "https://www.meteo.be/en/", warningUrl: "https://www.meteo.be/en/weather/warnings/overview-map", description: "ベルギーの公式予報と警報情報を確認できます。", warningLabel: "ベルギー王立気象研究所の警報を見る" },
    "CH": { name: "MeteoSwiss", weatherUrl: "https://www.meteoswiss.admin.ch/", warningUrl: "https://www.meteoswiss.admin.ch/weather/hazards.html", description: "スイスの公式予報と自然災害警報を確認できます。", warningLabel: "MeteoSwissの警報を見る" },
    "AT": { name: "GeoSphere Austria", weatherUrl: "https://www.geosphere.at/en", warningUrl: "https://warnungen.zamg.at/", description: "オーストリアの公式予報と警報情報を確認できます。", warningLabel: "オーストリアの警報を見る" },
    "SE": { name: "SMHI（スウェーデン）", weatherUrl: "https://www.smhi.se/en", warningUrl: "https://www.smhi.se/en/weather/warnings-and-advisories", description: "スウェーデンの公式予報と警報情報を確認できます。", warningLabel: "SMHIの警報を見る" },
    "NO": { name: "MET Norway", weatherUrl: "https://www.met.no/en", warningUrl: "https://www.met.no/en/weather-and-climate/warnings", description: "ノルウェーの公式予報と警報情報を確認できます。", warningLabel: "MET Norwayの警報を見る" },
    "FI": { name: "Finnish Meteorological Institute", weatherUrl: "https://en.ilmatieteenlaitos.fi/", warningUrl: "https://en.ilmatieteenlaitos.fi/warnings", description: "フィンランドの公式予報と警報情報を確認できます。", warningLabel: "フィンランド気象研究所の警報を見る" },
    "DK": { name: "Danish Meteorological Institute", weatherUrl: "https://www.dmi.dk/", warningUrl: "https://www.dmi.dk/varsler", description: "デンマークの公式予報と警報情報を確認できます。", warningLabel: "DMIの警報を見る" },
    "PL": { name: "IMGW-PIB（ポーランド）", weatherUrl: "https://www.imgw.pl/", warningUrl: "https://meteo.imgw.pl/", description: "ポーランドの公式予報と警報情報を確認できます。" },
    "CZ": { name: "Czech Hydrometeorological Institute", weatherUrl: "https://www.chmi.cz/", warningUrl: "https://www.chmi.cz/", description: "チェコの公式予報と警報情報を確認できます。" },
    "PT": { name: "IPMA（ポルトガル）", weatherUrl: "https://www.ipma.pt/en/", warningUrl: "https://www.ipma.pt/en/otempo/prev-sam/", description: "ポルトガルの公式予報と警報情報を確認できます。", warningLabel: "IPMAの警報を見る" },
    "IE": { name: "Met Éireann", weatherUrl: "https://www.met.ie/", warningUrl: "https://www.met.ie/warnings", description: "アイルランドの公式予報と警報情報を確認できます。", warningLabel: "Met Éireannの警報を見る" },
    "GR": { name: "Hellenic National Meteorological Service", weatherUrl: "https://emy.gr/emy/en/", warningUrl: "https://emy.gr/emy/en/", description: "ギリシャの公式予報と警報情報を確認できます。" },
    "IS": { name: "Icelandic Meteorological Office", weatherUrl: "https://en.vedur.is/", warningUrl: "https://en.vedur.is/alerts", description: "アイスランドの公式予報と警報情報を確認できます。", warningLabel: "アイスランド気象庁の警報を見る" },
    "RO": { name: "Romanian National Meteorological Administration", weatherUrl: "https://www.meteoromania.ro/", warningUrl: "https://www.meteoromania.ro/", description: "ルーマニアの公式予報と警報情報を確認できます。" },
    "HU": { name: "HungaroMet", weatherUrl: "https://www.met.hu/en/", warningUrl: "https://www.met.hu/en/idojaras/veszelyjelzes/", description: "ハンガリーの公式予報と警報情報を確認できます。", warningLabel: "HungaroMetの警報を見る" },
    "HR": { name: "Croatian Meteorological and Hydrological Service", weatherUrl: "https://meteo.hr/index_en.php", warningUrl: "https://meteo.hr/index_en.php", description: "クロアチアの公式予報と警報情報を確認できます。" },
    "SI": { name: "Slovenian Environment Agency Meteorological Service", weatherUrl: "https://meteo.arso.gov.si/met/en/", warningUrl: "https://meteo.arso.gov.si/met/en/", description: "スロベニアの公式予報と警報情報を確認できます。" },
    "RS": { name: "Republic Hydrometeorological Service of Serbia", weatherUrl: "https://www.hidmet.gov.rs/eng/", warningUrl: "https://www.hidmet.gov.rs/eng/", description: "セルビアの公式予報と警報情報を確認できます。" },
    "RU": { name: "Hydrometcenter of Russia", weatherUrl: "https://meteoinfo.ru/en", warningUrl: "https://meteoinfo.ru/en", description: "ロシアの公式予報と警報情報を確認できます。" },
    "US": { name: "National Weather Service（米国）", weatherUrl: "https://www.weather.gov/", warningUrl: "https://www.weather.gov/alerts", description: "米国の公式予報と警報情報を確認できます。", warningLabel: "NWSの警報情報を見る" },
    "CA": { name: "Environment and Climate Change Canada", weatherUrl: "https://weather.gc.ca/", warningUrl: "https://weather.gc.ca/warnings/index_e.html", description: "カナダの公式予報と警報情報を確認できます。", warningLabel: "カナダの警報情報を見る" },
    "MX": { name: "Servicio Meteorológico Nacional（メキシコ）", weatherUrl: "https://smn.conagua.gob.mx/", warningUrl: "https://smn.conagua.gob.mx/", description: "メキシコの公式予報と警報情報を確認できます。" },
    "BR": { name: "INMET（ブラジル）", weatherUrl: "https://portal.inmet.gov.br/", warningUrl: "https://alertas2.inmet.gov.br/", description: "ブラジルの公式予報と警報情報を確認できます。", warningLabel: "INMETの警報を見る" },
    "AR": { name: "Servicio Meteorológico Nacional（アルゼンチン）", weatherUrl: "https://www.smn.gob.ar/", warningUrl: "https://www.smn.gob.ar/alertas", description: "アルゼンチンの公式予報と警報情報を確認できます。", warningLabel: "アルゼンチンSMNの警報を見る" },
    "CL": { name: "Dirección Meteorológica de Chile", weatherUrl: "https://www.meteochile.gob.cl/", warningUrl: "https://www.meteochile.gob.cl/PortalDMC-web/index.xhtml", description: "チリの公式予報と警報情報を確認できます。" },
    "CO": { name: "IDEAM（コロンビア）", weatherUrl: "https://www.ideam.gov.co/", warningUrl: "https://www.ideam.gov.co/", description: "コロンビアの公式気象・水文情報を確認できます。" },
    "PE": { name: "SENAMHI（ペルー）", weatherUrl: "https://www.senamhi.gob.pe/", warningUrl: "https://www.senamhi.gob.pe/", description: "ペルーの公式予報と警報情報を確認できます。" },
    "EC": { name: "INAMHI（エクアドル）", weatherUrl: "https://www.inamhi.gob.ec/", warningUrl: "https://www.inamhi.gob.ec/", description: "エクアドルの公式気象・水文情報を確認できます。" },
    "UY": { name: "INUMET（ウルグアイ）", weatherUrl: "https://www.inumet.gub.uy/", warningUrl: "https://www.inumet.gub.uy/", description: "ウルグアイの公式予報と警報情報を確認できます。" },
    "AU": { name: "Bureau of Meteorology（豪州）", weatherUrl: "https://www.bom.gov.au/", warningUrl: "https://www.bom.gov.au/australia/warnings/", description: "オーストラリアの公式予報と警報情報を確認できます。", warningLabel: "BOMの警報情報を見る" },
    "NZ": { name: "MetService（ニュージーランド）", weatherUrl: "https://www.metservice.com/", warningUrl: "https://www.metservice.com/warnings/home", description: "ニュージーランドの公式予報と警報情報を確認できます。", warningLabel: "MetServiceの警報を見る" },
    "ZA": { name: "South African Weather Service", weatherUrl: "https://www.weathersa.co.za/", warningUrl: "https://www.weathersa.co.za/", description: "南アフリカの公式予報と警報情報を確認できます。" },
    "KE": { name: "Kenya Meteorological Department", weatherUrl: "https://meteo.go.ke/", warningUrl: "https://meteo.go.ke/", description: "ケニアの公式予報と警報情報を確認できます。" },
    "EG": { name: "Egyptian Meteorological Authority", weatherUrl: "https://ema.gov.eg/", warningUrl: "https://ema.gov.eg/", description: "エジプトの公式予報と警報情報を確認できます。" },
    "MA": { name: "Direction Générale de la Météorologie Maroc", weatherUrl: "https://www.marocmeteo.ma/", warningUrl: "https://www.marocmeteo.ma/", description: "モロッコの公式予報と警報情報を確認できます。" },
    "NG": { name: "NiMet（ナイジェリア）", weatherUrl: "https://nimet.gov.ng/", warningUrl: "https://nimet.gov.ng/", description: "ナイジェリアの公式予報と警報情報を確認できます。" },
    "GH": { name: "Ghana Meteorological Agency", weatherUrl: "https://www.meteo.gov.gh/", warningUrl: "https://www.meteo.gov.gh/", description: "ガーナの公式予報と警報情報を確認できます。" }
  });

  const ISO2_TO_ISO3 = Object.freeze({
    "AD": "AND",
    "AE": "ARE",
    "AF": "AFG",
    "AG": "ATG",
    "AI": "AIA",
    "AL": "ALB",
    "AM": "ARM",
    "AO": "AGO",
    "AQ": "ATA",
    "AR": "ARG",
    "AS": "ASM",
    "AT": "AUT",
    "AU": "AUS",
    "AW": "ABW",
    "AX": "ALA",
    "AZ": "AZE",
    "BA": "BIH",
    "BB": "BRB",
    "BD": "BGD",
    "BE": "BEL",
    "BF": "BFA",
    "BG": "BGR",
    "BH": "BHR",
    "BI": "BDI",
    "BJ": "BEN",
    "BL": "BLM",
    "BM": "BMU",
    "BN": "BRN",
    "BO": "BOL",
    "BQ": "BES",
    "BR": "BRA",
    "BS": "BHS",
    "BT": "BTN",
    "BV": "BVT",
    "BW": "BWA",
    "BY": "BLR",
    "BZ": "BLZ",
    "CA": "CAN",
    "CC": "CCK",
    "CD": "COD",
    "CF": "CAF",
    "CG": "COG",
    "CH": "CHE",
    "CI": "CIV",
    "CK": "COK",
    "CL": "CHL",
    "CM": "CMR",
    "CN": "CHN",
    "CO": "COL",
    "CR": "CRI",
    "CU": "CUB",
    "CV": "CPV",
    "CW": "CUW",
    "CX": "CXR",
    "CY": "CYP",
    "CZ": "CZE",
    "DE": "DEU",
    "DJ": "DJI",
    "DK": "DNK",
    "DM": "DMA",
    "DO": "DOM",
    "DZ": "DZA",
    "EC": "ECU",
    "EE": "EST",
    "EG": "EGY",
    "EH": "ESH",
    "ER": "ERI",
    "ES": "ESP",
    "ET": "ETH",
    "FI": "FIN",
    "FJ": "FJI",
    "FK": "FLK",
    "FM": "FSM",
    "FO": "FRO",
    "FR": "FRA",
    "GA": "GAB",
    "GB": "GBR",
    "GD": "GRD",
    "GE": "GEO",
    "GF": "GUF",
    "GG": "GGY",
    "GH": "GHA",
    "GI": "GIB",
    "GL": "GRL",
    "GM": "GMB",
    "GN": "GIN",
    "GP": "GLP",
    "GQ": "GNQ",
    "GR": "GRC",
    "GS": "SGS",
    "GT": "GTM",
    "GU": "GUM",
    "GW": "GNB",
    "GY": "GUY",
    "HK": "HKG",
    "HM": "HMD",
    "HN": "HND",
    "HR": "HRV",
    "HT": "HTI",
    "HU": "HUN",
    "ID": "IDN",
    "IE": "IRL",
    "IL": "ISR",
    "IM": "IMN",
    "IN": "IND",
    "IO": "IOT",
    "IQ": "IRQ",
    "IR": "IRN",
    "IS": "ISL",
    "IT": "ITA",
    "JE": "JEY",
    "JM": "JAM",
    "JO": "JOR",
    "JP": "JPN",
    "KE": "KEN",
    "KG": "KGZ",
    "KH": "KHM",
    "KI": "KIR",
    "KM": "COM",
    "KN": "KNA",
    "KP": "PRK",
    "KR": "KOR",
    "KW": "KWT",
    "KY": "CYM",
    "KZ": "KAZ",
    "LA": "LAO",
    "LB": "LBN",
    "LC": "LCA",
    "LI": "LIE",
    "LK": "LKA",
    "LR": "LBR",
    "LS": "LSO",
    "LT": "LTU",
    "LU": "LUX",
    "LV": "LVA",
    "LY": "LBY",
    "MA": "MAR",
    "MC": "MCO",
    "MD": "MDA",
    "ME": "MNE",
    "MF": "MAF",
    "MG": "MDG",
    "MH": "MHL",
    "MK": "MKD",
    "ML": "MLI",
    "MM": "MMR",
    "MN": "MNG",
    "MO": "MAC",
    "MP": "MNP",
    "MQ": "MTQ",
    "MR": "MRT",
    "MS": "MSR",
    "MT": "MLT",
    "MU": "MUS",
    "MV": "MDV",
    "MW": "MWI",
    "MX": "MEX",
    "MY": "MYS",
    "MZ": "MOZ",
    "NA": "NAM",
    "NC": "NCL",
    "NE": "NER",
    "NF": "NFK",
    "NG": "NGA",
    "NI": "NIC",
    "NL": "NLD",
    "NO": "NOR",
    "NP": "NPL",
    "NR": "NRU",
    "NU": "NIU",
    "NZ": "NZL",
    "OM": "OMN",
    "PA": "PAN",
    "PE": "PER",
    "PF": "PYF",
    "PG": "PNG",
    "PH": "PHL",
    "PK": "PAK",
    "PL": "POL",
    "PM": "SPM",
    "PN": "PCN",
    "PR": "PRI",
    "PS": "PSE",
    "PT": "PRT",
    "PW": "PLW",
    "PY": "PRY",
    "QA": "QAT",
    "RE": "REU",
    "RO": "ROU",
    "RS": "SRB",
    "RU": "RUS",
    "RW": "RWA",
    "SA": "SAU",
    "SB": "SLB",
    "SC": "SYC",
    "SD": "SDN",
    "SE": "SWE",
    "SG": "SGP",
    "SH": "SHN",
    "SI": "SVN",
    "SJ": "SJM",
    "SK": "SVK",
    "SL": "SLE",
    "SM": "SMR",
    "SN": "SEN",
    "SO": "SOM",
    "SR": "SUR",
    "SS": "SSD",
    "ST": "STP",
    "SV": "SLV",
    "SX": "SXM",
    "SY": "SYR",
    "SZ": "SWZ",
    "TC": "TCA",
    "TD": "TCD",
    "TF": "ATF",
    "TG": "TGO",
    "TH": "THA",
    "TJ": "TJK",
    "TK": "TKL",
    "TL": "TLS",
    "TM": "TKM",
    "TN": "TUN",
    "TO": "TON",
    "TR": "TUR",
    "TT": "TTO",
    "TV": "TUV",
    "TW": "TWN",
    "TZ": "TZA",
    "UA": "UKR",
    "UG": "UGA",
    "UM": "UMI",
    "US": "USA",
    "UY": "URY",
    "UZ": "UZB",
    "VA": "VAT",
    "VC": "VCT",
    "VE": "VEN",
    "VG": "VGB",
    "VI": "VIR",
    "VN": "VNM",
    "VU": "VUT",
    "WF": "WLF",
    "WS": "WSM",
    "XK": "XKX",
    "YE": "YEM",
    "YT": "MYT",
    "ZA": "ZAF",
    "ZM": "ZMB",
    "ZW": "ZWE"
  });

  const TIMEZONE_COUNTRY_HINTS = Object.freeze({
    "Africa/Accra": "GH",
    "Africa/Cairo": "EG",
    "Africa/Casablanca": "MA",
    "Africa/Johannesburg": "ZA",
    "Africa/Lagos": "NG",
    "Africa/Nairobi": "KE",
    "America/Argentina/Buenos_Aires": "AR",
    "America/Bogota": "CO",
    "America/Chicago": "US",
    "America/Denver": "US",
    "America/Guayaquil": "EC",
    "America/Lima": "PE",
    "America/Los_Angeles": "US",
    "America/Mexico_City": "MX",
    "America/Montevideo": "UY",
    "America/New_York": "US",
    "America/Santiago": "CL",
    "America/Sao_Paulo": "BR",
    "America/Toronto": "CA",
    "America/Vancouver": "CA",
    "Asia/Bangkok": "TH",
    "Asia/Colombo": "LK",
    "Asia/Dhaka": "BD",
    "Asia/Dubai": "AE",
    "Asia/Ho_Chi_Minh": "VN",
    "Asia/Hong_Kong": "HK",
    "Asia/Jakarta": "ID",
    "Asia/Jerusalem": "IL",
    "Asia/Karachi": "PK",
    "Asia/Kathmandu": "NP",
    "Asia/Kolkata": "IN",
    "Asia/Kuala_Lumpur": "MY",
    "Asia/Macau": "MO",
    "Asia/Manila": "PH",
    "Asia/Qatar": "QA",
    "Asia/Riyadh": "SA",
    "Asia/Seoul": "KR",
    "Asia/Shanghai": "CN",
    "Asia/Singapore": "SG",
    "Asia/Taipei": "TW",
    "Asia/Tokyo": "JP",
    "Atlantic/Reykjavik": "IS",
    "Australia/Perth": "AU",
    "Australia/Sydney": "AU",
    "Europe/Amsterdam": "NL",
    "Europe/Athens": "GR",
    "Europe/Belgrade": "RS",
    "Europe/Berlin": "DE",
    "Europe/Brussels": "BE",
    "Europe/Bucharest": "RO",
    "Europe/Budapest": "HU",
    "Europe/Copenhagen": "DK",
    "Europe/Dublin": "IE",
    "Europe/Helsinki": "FI",
    "Europe/Istanbul": "TR",
    "Europe/Lisbon": "PT",
    "Europe/Ljubljana": "SI",
    "Europe/London": "GB",
    "Europe/Madrid": "ES",
    "Europe/Moscow": "RU",
    "Europe/Oslo": "NO",
    "Europe/Paris": "FR",
    "Europe/Prague": "CZ",
    "Europe/Rome": "IT",
    "Europe/Stockholm": "SE",
    "Europe/Vienna": "AT",
    "Europe/Warsaw": "PL",
    "Europe/Zagreb": "HR",
    "Europe/Zurich": "CH",
    "Pacific/Auckland": "NZ"
  });

  const JAPAN_ENDPOINTS = Object.freeze({
    gsiReverse: 'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress',
    jmaArea: 'https://www.jma.go.jp/bosai/common/const/area.json',
    jmaClass20Relm: 'https://www.jma.go.jp/bosai/common/const/class20relm.json',
    jmaClass20GeojsonBase: 'https://www.jma.go.jp/bosai/common/const/geojson/class20s/'
  });

  const JAPAN_STATIC_LINKS = Object.freeze([
    { label: '台風情報', detail: '進路予測・暴風域・接近情報', url: 'https://www.jma.go.jp/bosai/typhoon/', badge: '気象庁' },
    { label: '気象防災速報・解説', detail: '記録的短時間大雨・線状降水帯など', url: 'https://www.jma.go.jp/bosai/information/', badge: '気象庁' },
    { label: '地震情報', detail: '震度・震源・推計震度分布', url: 'https://www.jma.go.jp/bosai/map.html#contents=earthquake_map', badge: '気象庁' },
    { label: '津波情報', detail: '大津波警報・津波警報・注意報', url: 'https://www.jma.go.jp/bosai/map.html#contents=tsunami', badge: '気象庁' },
    { label: '火山情報', detail: '噴火警報・噴火速報・警戒レベル', url: 'https://www.jma.go.jp/bosai/map.html#contents=volcano', badge: '気象庁' },
    { label: '熱中症警戒情報', detail: '環境省の熱中症予防情報', url: 'https://www.wbgt.env.go.jp/alert.php', badge: '環境省' }
  ]);

  const state = {
    root: null,
    location: readStoredLocation(),
    weather: null,
    rainState: null,
    dataSource: null,
    dataSavedAt: null,
    dialogOpen: false,
    activeTab: 'hour',
    lastFocused: null,
    inertRecords: [],
    ignoreNextPopState: false,
    weatherRequestId: 0,
    weatherController: null,
    dailyRequestId: 0,
    dailyController: null,
    searchController: null,
    dialogCloseTimer: null,
    bodyOverflowBeforeDialog: '',
    locationOperationId: 0,
    geolocationRequestId: 0,
    japanAreaRequestId: 0,
    japanAreaController: null,
    japanAreaInfo: null,
    jmaAreaMaster: null,
    jmaAreaMasterPromise: null,
    jmaClass20Relm: null,
    jmaClass20RelmPromise: null,
    jmaClass20GeometryCache: new Map()
  };

  const el = {};

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  function init() {
    if (!cacheElements()) return;
    bindEvents();
    registerServiceWorker();
    renderLocationLabels();

    if (state.location) {
      refreshWeather();
    } else {
      renderNoLocation();
    }
  }

  function cacheElements() {
    state.root = document.getElementById('mbWeatherPrototypeRoot');
    if (!state.root) return false;

    const requiredIds = [
      'weatherSectionTitle', 'changeLocationButton', 'weatherCard', 'homeLocation',
      'homeCondition', 'homeRainMessage', 'homeTemperature', 'homeFeelsLike', 'homeWeatherIcon',
      'homeMiniTimeline', 'homeUpdated', 'dialogBackdrop', 'weatherDialog', 'closeDialogButton',
      'dialogLocation', 'dialogCondition', 'dialogTemperature', 'dialogWeatherIcon', 'dialogStatusBadge',
      'dialogRainMessage', 'dialogUpdated', 'useCurrentLocationButton', 'locationSearchForm',
      'locationSearchInput', 'locationSearchResults', 'clearStoredLocationButton', 'hourlyForecast',
      'weeklyForecast', 'metricHumidity', 'metricWind', 'metricPrecipitation', 'metricCloud',
      'officialSourceName', 'officialInfoDescription', 'officialLinkGrid', 'officialLinkNote', 'officialPanelIntroduction', 'toast'
    ];
    requiredIds.forEach((id) => { el[id] = state.root.querySelector(`#${id}`); });
    el.toolbarRefresh = state.root.querySelector('#toolbarRefresh');
    el.tabs = [...state.root.querySelectorAll('.weather-tabs .weather-tab')];
    el.panels = [...state.root.querySelectorAll('.dialog-content > .tab-panel')];

    const missing = requiredIds.filter((id) => !el[id]);
    if (missing.length || !el.tabs.length || !el.panels.length) {
      console.warn('Weather panel initialization skipped. Missing UI elements:', missing);
      return false;
    }
    return true;
  }

  function bindEvents() {
    el.weatherCard.addEventListener('click', openDialog);
    el.weatherCard.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDialog();
      }
    });
    el.changeLocationButton.addEventListener('click', () => openDialog(true));
    el.closeDialogButton.addEventListener('click', () => closeDialog());
    el.dialogBackdrop.addEventListener('click', () => closeDialog());
    el.toolbarRefresh?.addEventListener('click', () => refreshWeather(true));
    el.useCurrentLocationButton.addEventListener('click', useCurrentLocation);
    el.locationSearchForm.addEventListener('submit', searchLocation);
    el.clearStoredLocationButton.addEventListener('click', clearStoredLocation);
    el.tabs.forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab, { focus: false }));
      tab.addEventListener('keydown', handleTabKeydown);
    });
    document.addEventListener('keydown', handleGlobalKeydown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', ensureFreshWeather);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('online', () => {
      showToast('通信が復帰しました。天気を更新します。');
      if (state.location) refreshWeather();
    });
    window.addEventListener('offline', () => showToast('オフラインです。新しい天気情報は取得できません。'));
  }



  async function refreshWeather(showFeedback = false) {
    if (!state.location) {
      renderNoLocation();
      openDialog(true);
      showToast('現在地を使うか、都市名を検索してください。');
      return;
    }

    const requestLocation = cloneLocation(state.location);
    const requestKey = locationKey(requestLocation);
    const requestId = ++state.weatherRequestId;
    state.weatherController?.abort();
    const controller = new AbortController();
    state.weatherController = controller;
    setLoading(true);

    try {
      const data = await fetchWeatherCore(requestLocation, controller.signal);
      if (!isCurrentWeatherRequest(requestId, requestKey)) return;

      validateCoreWeather(data);
      const savedAt = Date.now();
      data._fetchedAt = new Date(savedAt).toISOString();
      data._locationKey = requestKey;
      applyCoreWeather(data, requestKey, savedAt, 'network');
      writeCache(STORAGE_KEYS.coreCache, requestLocation, data, savedAt);
      renderAllWeather();
      if (showFeedback) showToast('天気を更新しました。');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.warn('Weather fetch failed:', error);
      if (!isCurrentWeatherRequest(requestId, requestKey)) return;

      let cached = readCache(STORAGE_KEYS.coreCache, requestLocation, CACHE_LIMITS.coreFallback);
      if (cached) {
        try {
          validateCoreWeather(cached.data);
        } catch {
          cached = null;
        }
      }
      if (cached) {
        const age = Date.now() - cached.savedAt;
        applyCoreWeather(cached.data, requestKey, cached.savedAt, 'cache');
        state.rainState = age <= CACHE_LIMITS.coreFresh
          ? analyzePrecipitation(state.weather)
          : createStaleRainState(cached.savedAt);
        renderAllWeather();
        showToast(age <= CACHE_LIMITS.coreFresh
          ? '通信できないため、直近の保存データを表示しています。'
          : '最新情報を取得できません。古い保存データは参考表示です。');
      } else {
        renderWeatherUnavailable('天気情報を取得できません', '通信状況を確認して、もう一度更新してください。');
        showToast('天気情報を取得できませんでした。');
      }
    } finally {
      if (isCurrentWeatherRequest(requestId, requestKey)) {
        state.weatherController = null;
        setLoading(false);
      }
    }
  }

  async function fetchWeatherCore(location, signal) {
    const common = {
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m,is_day',
      hourly: 'temperature_2m,precipitation_probability,precipitation,rain,showers,snowfall,weather_code,is_day',
      timezone: 'auto',
      timeformat: 'unixtime',
      forecast_hours: '8',
      forecast_minutely_15: '20'
    };

    const primary = new URLSearchParams({
      ...common,
      minutely_15: 'precipitation,precipitation_probability,rain,showers,snowfall,weather_code'
    });

    let response = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${primary}`, {
      cache: 'no-store',
      signal
    }, 10000);

    if (!response.ok && response.status !== 429) {
      const fallback = new URLSearchParams({
        ...common,
        minutely_15: 'precipitation,rain,showers,snowfall,weather_code'
      });
      response = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${fallback}`, {
        cache: 'no-store',
        signal
      }, 10000);
    }

    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    return response.json();
  }

  async function ensureDailyForecast() {
    if (!state.location) {
      renderWeeklyMessage('地点を選択すると表示します。');
      return;
    }

    const requestLocation = cloneLocation(state.location);
    const requestKey = locationKey(requestLocation);
    if (state.weather?.daily && state.weather._dailyLocationKey === requestKey) {
      renderWeekly();
      return;
    }

    let cached = readCache(STORAGE_KEYS.dailyCache, requestLocation, CACHE_LIMITS.dailyFresh);
    if (cached) {
      try {
        validateDailyWeather(cached.data);
      } catch {
        cached = null;
      }
    }
    if (cached) {
      mergeDailyData(cached.data, requestKey, cached.savedAt, false);
      renderWeekly();
      return;
    }

    renderWeeklyMessage('週間予報を取得しています…');
    const requestId = ++state.dailyRequestId;
    state.dailyController?.abort();
    const controller = new AbortController();
    state.dailyController = controller;

    try {
      const params = new URLSearchParams({
        latitude: String(requestLocation.latitude),
        longitude: String(requestLocation.longitude),
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
        timezone: 'auto',
        timeformat: 'unixtime',
        forecast_days: '7'
      });
      const response = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${params}`, {
        cache: 'no-store',
        signal: controller.signal
      }, 10000);
      if (!response.ok) throw new Error(`Daily API error: ${response.status}`);
      const data = await response.json();
      validateDailyWeather(data);
      if (!isCurrentDailyRequest(requestId, requestKey)) return;
      const savedAt = Date.now();
      writeCache(STORAGE_KEYS.dailyCache, requestLocation, data, savedAt);
      mergeDailyData(data, requestKey, savedAt, false);
      renderWeekly();
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.warn('Daily forecast failed:', error);
      if (!isCurrentDailyRequest(requestId, requestKey)) return;
      let stale = readCache(STORAGE_KEYS.dailyCache, requestLocation, CACHE_LIMITS.dailyFallback);
      if (stale) {
        try {
          validateDailyWeather(stale.data);
        } catch {
          stale = null;
        }
      }
      if (stale) {
        mergeDailyData(stale.data, requestKey, stale.savedAt, true);
        renderWeekly();
      } else {
        renderWeeklyMessage('週間予報を取得できませんでした。通信状況を確認してください。');
      }
    } finally {
      if (isCurrentDailyRequest(requestId, requestKey)) state.dailyController = null;
    }
  }

  function mergeDailyData(data, requestKey, savedAt, stale) {
    if (!state.weather) state.weather = {};
    state.weather.daily = data.daily;
    state.weather.daily_units = data.daily_units;
    state.weather.utc_offset_seconds = data.utc_offset_seconds ?? state.weather.utc_offset_seconds ?? 0;
    state.weather.timezone = data.timezone || state.weather.timezone || state.location?.timezone || 'UTC';
    state.weather._dailyLocationKey = requestKey;
    state.weather._dailyFetchedAt = savedAt;
    state.weather._dailyStale = stale;
  }

  function applyCoreWeather(data, requestKey, savedAt, source) {
    const preservedDaily = state.weather?._dailyLocationKey === requestKey
      ? {
          daily: state.weather.daily,
          daily_units: state.weather.daily_units,
          _dailyLocationKey: state.weather._dailyLocationKey,
          _dailyFetchedAt: state.weather._dailyFetchedAt,
          _dailyStale: state.weather._dailyStale
        }
      : {};
    state.weather = { ...data, ...preservedDaily };
    state.dataSource = source;
    state.dataSavedAt = savedAt;
    state.rainState = analyzePrecipitation(state.weather);
  }

  function analyzePrecipitation(data) {
    const current = data.current || {};
    const currentCode = numberOrNull(current.weather_code);
    const currentAmount = maxFinite(current.precipitation, current.rain, current.showers, current.snowfall);
    const currentLikely = (currentAmount ?? 0) >= 0.1 || isPrecipitationCode(currentCode);
    const timeline = getForecastTimeline(data, 16, 240);
    const now = Date.now();
    let firstPrecipitation = null;

    for (const item of timeline) {
      const likely = isLikelyPrecipitation(item);
      if (likely && !firstPrecipitation) firstPrecipitation = item;
    }

    if (currentLikely) {
      const kind = precipitationKind(currentCode, current.snowfall);
      return {
        type: 'raining',
        badge: kind.badge,
        message: `周辺で${kind.noun}の可能性があります`,
        detail: '直近15分の予報データです',
        minutes: 0
      };
    }

    if (firstPrecipitation) {
      const minutes = Math.max(0, Math.round((firstPrecipitation.time.getTime() - now) / 60000));
      const kind = precipitationKind(firstPrecipitation.code, firstPrecipitation.snowfall);
      if (minutes <= 60) {
        return {
          type: 'soon',
          badge: `${kind.badge}接近`,
          message: `次の1時間以内に${kind.noun}の可能性があります`,
          detail: `${formatTime(firstPrecipitation.time, data.timezone)}ごろの予報`,
          minutes
        };
      }
      return {
        type: 'later',
        badge: 'このあと',
        message: `${formatTime(firstPrecipitation.time, data.timezone)}ごろに${kind.noun}の可能性があります`,
        detail: '予報は変わることがあります',
        minutes
      };
    }

    return {
      type: 'clear',
      badge: '降水少なめ',
      message: '次の60分、降水の見込みは低めです',
      detail: '急な天気の変化にはご注意ください',
      minutes: null
    };
  }

  function createStaleRainState(savedAt) {
    return {
      type: 'stale',
      badge: '未更新',
      message: '最新の降水予報を取得できません',
      detail: `${formatTime(new Date(savedAt), state.weather?.timezone)}時点の保存データ`,
      minutes: null
    };
  }

  function getForecastTimeline(data, limit = 16, maxMinutes = null) {
    const now = Date.now();
    const maxTime = maxMinutes === null ? Infinity : now + maxMinutes * 60 * 1000;
    const filterFuture = (items) => items
      .filter((item) => item.time.getTime() >= now && item.time.getTime() <= maxTime)
      .slice(0, limit);

    const minuteItems = buildTimeline(data?.minutely_15);
    if (minuteItems.length) return filterFuture(minuteItems);
    return filterFuture(buildTimeline(data?.hourly)).slice(0, Math.min(limit, 8));
  }

  function buildTimeline(series) {
    if (!series?.time?.length) return [];
    return series.time.map((time, index) => ({
      time: parseApiTime(time),
      precipitation: numberOrNull(series.precipitation?.[index]),
      probability: numberOrNull(series.precipitation_probability?.[index]),
      rain: numberOrNull(series.rain?.[index]),
      showers: numberOrNull(series.showers?.[index]),
      snowfall: numberOrNull(series.snowfall?.[index]),
      code: numberOrNull(series.weather_code?.[index]),
      isDay: numberOrNull(series.is_day?.[index])
    })).filter((item) => Number.isFinite(item.time.getTime()));
  }

  function isLikelyPrecipitation(item) {
    const amount = maxFinite(item.precipitation, item.rain, item.showers, item.snowfall) ?? 0;
    return amount >= 0.1 || (item.probability ?? 0) >= 70 || isPrecipitationCode(item.code);
  }

  function renderAllWeather() {
    if (!state.weather) return;
    renderLocationLabels();
    renderHomeCard();
    renderDialogSummary();
    renderHourly();
    renderMetrics();
    if (state.weather.daily) renderWeekly();
  }

  function renderLocationLabels() {
    const locationName = state.location?.name || '地点未選択';
    el.homeLocation.textContent = locationName;
    el.dialogLocation.textContent = locationName;
    el.clearStoredLocationButton.hidden = !state.location;

    if (!state.location) {
      el.weatherSectionTitle.textContent = '地点を選んで天気を確認';
      el.changeLocationButton.textContent = '場所を選ぶ';
    } else if (state.location.source === 'geolocation') {
      el.weatherSectionTitle.textContent = '現在地周辺の天気';
      el.changeLocationButton.textContent = '場所を変更';
    } else {
      el.weatherSectionTitle.textContent = '選択地点の天気';
      el.changeLocationButton.textContent = '場所を変更';
    }
    renderOfficialLinks();
  }

  function renderNoLocation() {
    state.weather = null;
    state.rainState = null;
    state.dataSource = null;
    state.dataSavedAt = null;
    renderLocationLabels();
    if (el.toolbarRefresh) el.toolbarRefresh.disabled = true;
    clearWeatherClasses();
    el.homeCondition.textContent = '場所を選択してください';
    el.homeRainMessage.textContent = '現在地を使うか、都市名で検索できます';
    el.homeTemperature.textContent = '--';
    el.homeFeelsLike.textContent = '体感 --°C';
    el.homeWeatherIcon.innerHTML = iconLocation();
    el.homeUpdated.textContent = '未取得';
    el.homeMiniTimeline.innerHTML = '<div class="empty-timeline">地点を選ぶと、これからの降水予報を表示します。</div>';
    el.dialogCondition.textContent = '場所を選択してください';
    el.dialogTemperature.textContent = '--';
    el.dialogWeatherIcon.innerHTML = iconLocation();
    el.dialogStatusBadge.textContent = '未取得';
    el.dialogStatusBadge.className = 'status-badge';
    el.dialogRainMessage.textContent = '現在地を使うか、都市名で検索してください';
    el.dialogUpdated.textContent = '未更新';
    renderHourlyMessage('地点を選択すると表示します。');
    renderWeeklyMessage('週間タブを開いたときに取得します。');
    renderMetricsEmpty();
  }

  function renderWeatherUnavailable(title, message) {
    state.weather = null;
    state.rainState = null;
    state.dataSource = 'error';
    clearWeatherClasses();
    renderLocationLabels();
    el.homeCondition.textContent = title;
    el.homeRainMessage.textContent = message;
    el.homeTemperature.textContent = '--';
    el.homeFeelsLike.textContent = '体感 --°C';
    el.homeWeatherIcon.innerHTML = iconUnavailable();
    el.homeUpdated.textContent = '更新失敗';
    el.homeMiniTimeline.innerHTML = '<div class="empty-timeline">新しい予報を取得できませんでした。</div>';
    el.dialogCondition.textContent = title;
    el.dialogTemperature.textContent = '--';
    el.dialogWeatherIcon.innerHTML = iconUnavailable();
    el.dialogStatusBadge.textContent = '取得失敗';
    el.dialogStatusBadge.className = 'status-badge error';
    el.dialogRainMessage.textContent = message;
    el.dialogUpdated.textContent = '未更新';
    renderHourlyMessage('天気情報を取得できませんでした。');
    renderWeeklyMessage('週間予報も新しく取得できません。');
    renderMetricsEmpty();
  }

  function renderHomeCard() {
    const data = state.weather;
    const current = data.current || {};
    const fetchedAt = state.dataSavedAt ? new Date(state.dataSavedAt) : new Date(data._fetchedAt || Date.now());
    const timeline = getForecastTimeline(data, 5, 60);
    const condition = weatherLabel(current.weather_code);

    el.homeCondition.textContent = condition;
    el.homeRainMessage.textContent = state.rainState?.message || '降水予報を確認できません';
    el.homeTemperature.textContent = formatNumber(current.temperature_2m, 0, '--');
    el.homeFeelsLike.textContent = `体感 ${formatNumber(current.apparent_temperature, 0, '--')}°C`;
    el.homeWeatherIcon.innerHTML = weatherIcon(current.weather_code, current.is_day);
    el.homeUpdated.textContent = formatUpdateLabel(fetchedAt);

    clearWeatherClasses();
    el.weatherCard.classList.toggle('rain-soon', state.rainState?.type === 'soon');
    el.weatherCard.classList.toggle('raining', state.rainState?.type === 'raining');
    el.weatherCard.classList.toggle('is-stale', state.rainState?.type === 'stale');

    if (!timeline.length) {
      el.homeMiniTimeline.innerHTML = '<div class="empty-timeline">短時間予報を表示できません。</div>';
      return;
    }

    el.homeMiniTimeline.innerHTML = timeline.map((item) => {
      const probability = item.probability ?? 0;
      const precipitation = item.precipitation ?? 0;
      const percent = Math.min(100, Math.max(probability, precipitation * 18));
      const rainText = precipitation >= 0.1
        ? `${precipitation.toFixed(1)} mm`
        : item.probability !== null ? `${Math.round(item.probability)}%` : '—';
      return `<div class="mini-point"><span>${escapeHTML(formatTime(item.time, data.timezone))}</span><strong>${escapeHTML(rainText)}</strong><div class="mini-rainbar"><i style="--rain-width:${percent}%"></i></div></div>`;
    }).join('');
  }

  function renderDialogSummary() {
    const current = state.weather.current || {};
    const fetchedAt = state.dataSavedAt ? new Date(state.dataSavedAt) : new Date(state.weather._fetchedAt || Date.now());
    el.dialogCondition.textContent = weatherLabel(current.weather_code);
    el.dialogTemperature.textContent = formatNumber(current.temperature_2m, 0, '--');
    el.dialogWeatherIcon.innerHTML = weatherIcon(current.weather_code, current.is_day);
    el.dialogRainMessage.textContent = state.rainState?.message || '降水予報を確認できません';
    el.dialogUpdated.textContent = formatUpdateLabel(fetchedAt);
    el.dialogStatusBadge.textContent = state.rainState?.badge || '確認不可';
    el.dialogStatusBadge.className = 'status-badge';
    if (state.rainState?.type === 'soon') el.dialogStatusBadge.classList.add('warn');
    if (state.rainState?.type === 'raining') el.dialogStatusBadge.classList.add('rain');
    if (state.rainState?.type === 'stale') el.dialogStatusBadge.classList.add('stale');
  }

  function renderHourly() {
    el.hourlyForecast.classList.remove('is-empty');
    const timeline = getForecastTimeline(state.weather, 16, 240);
    if (!timeline.length) {
      renderHourlyMessage('短時間予報を表示できません。');
      return;
    }

    el.hourlyForecast.innerHTML = timeline.map((item) => {
      const precipitation = item.precipitation ?? 0;
      const probability = item.probability;
      const bar = precipitation > 0 ? Math.min(100, Math.max(3, precipitation * 15)) : 0;
      const raining = isLikelyPrecipitation(item);
      const temperature = findTemperatureAt(item.time);
      const probabilityText = probability === null ? '—' : `${Math.round(probability)}%`;
      const precipitationText = item.precipitation === null ? '—' : `${item.precipitation.toFixed(1)} mm`;
      return `<article class="hour-card${raining ? ' is-rain' : ''}">
        <time>${escapeHTML(formatTime(item.time, state.weather.timezone))}</time>
        <div class="weather-icon-small" aria-hidden="true">${weatherIcon(item.code, item.isDay ?? 1)}</div>
        <div class="hour-temp">${temperature === null ? '—' : `${Math.round(temperature)}°`}</div>
        <div class="rain-column" aria-label="降水量 ${escapeHTML(precipitationText)}"><i style="--bar-height:${bar}%"></i></div>
        <div class="hour-rain">${escapeHTML(precipitationText)}<br>${escapeHTML(probabilityText)}</div>
      </article>`;
    }).join('');
  }

  function renderHourlyMessage(message) {
    el.hourlyForecast.classList.add('is-empty');
    el.hourlyForecast.innerHTML = `<div class="panel-empty">${escapeHTML(message)}</div>`;
  }

  function renderWeekly() {
    const daily = state.weather?.daily;
    if (!daily?.time?.length) {
      renderWeeklyMessage('週間予報を表示できません。');
      return;
    }

    const offset = Number(state.weather.utc_offset_seconds || 0);
    const todayKey = dateKeyInTimeZone(new Date(), state.weather.timezone || state.location?.timezone || 'UTC');
    const days = daily.time
      .map((timestamp, index) => ({ timestamp, index, key: dailyDateKey(timestamp, offset) }))
      .filter((day) => day.key >= todayKey)
      .slice(0, 7);
    if (!days.length) {
      renderWeeklyMessage('保存された週間予報は期限切れです。更新してください。');
      return;
    }
    const staleLabel = state.weather._dailyStale ? '<small class="day-stale">保存データ</small>' : '';
    el.weeklyForecast.innerHTML = days.map(({ timestamp, index, key }) => {
      const isToday = key === todayKey;
      const max = numberOrNull(daily.temperature_2m_max?.[index]);
      const min = numberOrNull(daily.temperature_2m_min?.[index]);
      const probability = numberOrNull(daily.precipitation_probability_max?.[index]);
      const precipitation = numberOrNull(daily.precipitation_sum?.[index]);
      const code = numberOrNull(daily.weather_code?.[index]);
      const rainText = probability !== null
        ? `最大 ${Math.round(probability)}%`
        : precipitation !== null ? `${precipitation.toFixed(1)} mm` : '—';
      return `<article class="day-card${isToday ? ' today' : ''}">
        <div class="day-name"><strong>${isToday ? '今日' : dailyWeekday(timestamp, offset)}</strong><span>${dailyMonthDay(timestamp, offset)}</span>${isToday ? staleLabel : ''}</div>
        <div class="weather-icon-small" aria-hidden="true">${weatherIcon(code, 1)}</div>
        <div class="day-temp"><span>${max === null ? '—' : `${Math.round(max)}°`}</span><span>${min === null ? '—' : `${Math.round(min)}°`}</span></div>
        <div class="day-rain">${escapeHTML(rainText)}</div>
      </article>`;
    }).join('');
  }

  function renderWeeklyMessage(message) {
    el.weeklyForecast.innerHTML = `<div class="panel-empty">${escapeHTML(message)}</div>`;
  }

  function renderMetrics() {
    const current = state.weather.current || {};
    el.metricHumidity.textContent = formatMetric(current.relative_humidity_2m, 0, '%');
    el.metricWind.textContent = formatMetric(current.wind_speed_10m, 1, ' km/h');
    el.metricPrecipitation.textContent = formatMetric(current.precipitation, 1, ' mm');
    el.metricCloud.textContent = formatMetric(current.cloud_cover, 0, '%');
  }

  function renderMetricsEmpty() {
    el.metricHumidity.textContent = '—';
    el.metricWind.textContent = '—';
    el.metricPrecipitation.textContent = '—';
    el.metricCloud.textContent = '—';
  }

  function openDialog(focusSearch = false, { fromHistory = false } = {}) {
    if (state.dialogOpen) {
      ensureFreshWeather();
      if (focusSearch) el.locationSearchInput.focus();
      return;
    }
    if (state.dialogCloseTimer) {
      window.clearTimeout(state.dialogCloseTimer);
      state.dialogCloseTimer = null;
      el.dialogBackdrop.hidden = true;
      el.weatherDialog.hidden = true;
      setPageInert(false);
    }
    state.dialogOpen = true;
    state.lastFocused = document.activeElement;
    state.bodyOverflowBeforeDialog = document.body.style.overflow;
    setPageInert(true);
    el.dialogBackdrop.hidden = false;
    el.weatherDialog.hidden = false;
    document.body.style.overflow = 'hidden';
    if (!fromHistory && !history.state?.mbWeatherDialog) {
      history.pushState({ ...(history.state || {}), mbWeatherDialog: true }, '');
    }
    ensureFreshWeather();
    requestAnimationFrame(() => {
      el.dialogBackdrop.classList.add('is-open');
      el.weatherDialog.classList.add('is-open');
      if (focusSearch || !state.location) el.locationSearchInput.focus();
      else el.closeDialogButton.focus();
    });
  }

  function closeDialog({ fromHistory = false } = {}) {
    if (!state.dialogOpen) return;
    performDialogClose();
    if (!fromHistory && history.state?.mbWeatherDialog) {
      state.ignoreNextPopState = true;
      history.back();
    }
  }

  function performDialogClose() {
    state.dialogOpen = false;
    el.dialogBackdrop.classList.remove('is-open');
    el.weatherDialog.classList.remove('is-open');
    document.body.style.overflow = state.bodyOverflowBeforeDialog;
    state.bodyOverflowBeforeDialog = '';
    state.dialogCloseTimer = window.setTimeout(() => {
      el.dialogBackdrop.hidden = true;
      el.weatherDialog.hidden = true;
      setPageInert(false);
      state.dialogCloseTimer = null;
      state.lastFocused?.focus?.();
    }, 220);
  }

  function handlePopState() {
    if (state.ignoreNextPopState) {
      state.ignoreNextPopState = false;
      return;
    }
    const historyOpen = Boolean(history.state?.mbWeatherDialog);
    if (state.dialogOpen && !historyOpen) {
      closeDialog({ fromHistory: true });
    } else if (!state.dialogOpen && historyOpen) {
      openDialog(false, { fromHistory: true });
    }
  }

  function setPageInert(inert) {
    if (inert) {
      state.inertRecords = [];
      const targets = new Set();

      [...document.body.children].forEach((node) => {
        if (node.tagName === 'SCRIPT' || node === state.root || node.contains(state.root)) return;
        targets.add(node);
      });

      let current = state.root;
      while (current && current !== document.body) {
        const parent = current.parentElement;
        if (!parent) break;
        [...parent.children].forEach((node) => {
          if (node === current || node.tagName === 'SCRIPT') return;
          targets.add(node);
        });
        current = parent;
      }

      [...state.root.children]
        .filter((node) => ![el.weatherDialog, el.dialogBackdrop, el.toast].includes(node))
        .forEach((node) => targets.add(node));

      targets.forEach((node) => {
        state.inertRecords.push({
          node,
          inert: Boolean(node.inert),
          ariaHidden: node.getAttribute('aria-hidden')
        });
        node.inert = true;
        node.setAttribute('aria-hidden', 'true');
      });
      return;
    }

    state.inertRecords.forEach(({ node, inert: previousInert, ariaHidden }) => {
      node.inert = previousInert;
      if (ariaHidden === null) node.removeAttribute('aria-hidden');
      else node.setAttribute('aria-hidden', ariaHidden);
    });
    state.inertRecords = [];
  }

  function handleGlobalKeydown(event) {
    if (event.key === 'Escape' && state.dialogOpen) closeDialog();
    if (event.key === 'Tab' && state.dialogOpen) trapFocus(event);
  }

  function trapFocus(event) {
    const focusables = [...el.weatherDialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((node) => !node.hidden && node.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleTabKeydown(event) {
    const allowed = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!allowed.includes(event.key)) return;
    event.preventDefault();
    const currentIndex = el.tabs.indexOf(event.currentTarget);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % el.tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + el.tabs.length) % el.tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = el.tabs.length - 1;
    const nextTab = el.tabs[nextIndex];
    switchTab(nextTab.dataset.tab, { focus: true });
  }

  function switchTab(tabName, { focus = false } = {}) {
    state.activeTab = tabName;
    el.tabs.forEach((tab) => {
      const active = tab.dataset.tab === tabName;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    el.panels.forEach((panel) => {
      panel.hidden = panel.id !== `panel${capitalize(tabName)}`;
    });
    if (tabName === 'week') ensureDailyForecast();
    if (tabName === 'official') renderOfficialLinks();
  }

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      showToast('この端末では現在地を取得できません。');
      return;
    }

    const geolocationId = ++state.geolocationRequestId;
    setCurrentLocationButtonBusy(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      if (geolocationId !== state.geolocationRequestId) return;
      const exactLocation = {
        name: '現在地周辺',
        latitude: roundCoordinate(position.coords.latitude, 2),
        longitude: roundCoordinate(position.coords.longitude, 2),
        timezone: 'auto',
        countryCode: '',
        country: '',
        admin1: '',
        admin2: '',
        source: 'geolocation'
      };
      await applyLocation(exactLocation, '現在地周辺の天気に切り替えました。');
      if (geolocationId === state.geolocationRequestId) setCurrentLocationButtonBusy(false);
    }, (error) => {
      if (geolocationId !== state.geolocationRequestId) return;
      console.warn(error);
      setCurrentLocationButtonBusy(false);
      showToast('現在地を取得できませんでした。位置情報の許可をご確認ください。');
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 });
  }

  function setCurrentLocationButtonBusy(busy) {
    el.useCurrentLocationButton.disabled = busy;
    if (busy) el.useCurrentLocationButton.textContent = '現在地を取得中…';
    else el.useCurrentLocationButton.innerHTML = currentLocationButtonHTML();
  }

  async function searchLocation(event) {
    event.preventDefault();
    const query = el.locationSearchInput.value.trim();
    if (!query) {
      showToast('都市名や地域名を入力してください。');
      return;
    }

    state.searchController?.abort();
    const controller = new AbortController();
    state.searchController = controller;
    el.locationSearchResults.hidden = false;
    el.locationSearchResults.innerHTML = '<div class="location-empty">検索しています…</div>';

    try {
      const params = new URLSearchParams({ name: query, count: '8', language: 'ja', format: 'json' });
      const response = await fetchWithTimeout(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
        cache: 'no-store',
        signal: controller.signal
      }, 8000);
      if (!response.ok) throw new Error(`Geocoding error: ${response.status}`);
      const data = await response.json();
      renderLocationResults(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.warn(error);
      el.locationSearchResults.innerHTML = '<div class="location-empty">検索できませんでした。通信状況をご確認ください。</div>';
    }
  }

  function renderLocationResults(results) {
    const validResults = results.filter((result) => Number.isFinite(Number(result.latitude)) && Number.isFinite(Number(result.longitude)));
    if (!validResults.length) {
      el.locationSearchResults.innerHTML = '<div class="location-empty">該当する場所が見つかりませんでした。</div>';
      return;
    }

    el.locationSearchResults.innerHTML = '';
    validResults.forEach((result) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'location-result';
      const region = [result.admin1, result.country].filter(Boolean).join('・');
      const label = String(result.name || '名称不明');
      const left = document.createElement('span');
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      const action = document.createElement('span');
      strong.textContent = label;
      small.textContent = region;
      action.textContent = '選択';
      left.append(strong, small);
      button.append(left, action);
      button.addEventListener('click', async () => {
        const nextLocation = {
          name: region ? `${label}（${region}）` : label,
          latitude: Number(result.latitude),
          longitude: Number(result.longitude),
          timezone: result.timezone || 'auto',
          countryCode: String(result.country_code || '').toUpperCase(),
          country: String(result.country || ''),
          admin1: String(result.admin1 || ''),
          admin2: String(result.admin2 || ''),
          source: 'search'
        };
        state.geolocationRequestId += 1;
        el.locationSearchResults.hidden = true;
        el.locationSearchInput.value = '';
        await applyLocation(nextLocation, `${nextLocation.name}の天気に切り替えました。`);
      });
      el.locationSearchResults.appendChild(button);
    });
  }

  async function applyLocation(nextLocation, successMessage) {
    const operationId = ++state.locationOperationId;
    abortLocationDependentRequests();
    state.location = normalizeLocation(nextLocation);
    state.japanAreaInfo = null;
    state.japanAreaController?.abort();
    state.japanAreaController = null;
    const requestKey = locationKey(state.location);
    state.weather = null;
    state.rainState = null;
    state.dataSource = null;
    state.dataSavedAt = null;
    saveLocation(state.location);
    renderLocationLabels();
    renderPendingLocation();
    await refreshWeather();
    if (operationId !== state.locationOperationId || !state.location || locationKey(state.location) !== requestKey) return;
    const coreWeatherAvailable = Boolean(state.weather?.current);
    if (state.activeTab === 'week') ensureDailyForecast();
    renderOfficialLinks();
    showToast(coreWeatherAvailable
      ? successMessage
      : `${state.location.name}を選択しましたが、天気を取得できませんでした。`);
  }

  function renderPendingLocation() {
    clearWeatherClasses();
    el.homeCondition.textContent = '天気データを取得しています';
    el.homeRainMessage.textContent = 'しばらくお待ちください';
    el.homeTemperature.textContent = '--';
    el.homeFeelsLike.textContent = '体感 --°C';
    el.homeWeatherIcon.innerHTML = iconCloud();
    el.homeUpdated.textContent = '更新中';
    el.homeMiniTimeline.innerHTML = '<div class="empty-timeline">短時間予報を取得しています。</div>';
    el.dialogCondition.textContent = '取得中';
    el.dialogTemperature.textContent = '--';
    el.dialogWeatherIcon.innerHTML = iconCloud();
    el.dialogStatusBadge.textContent = '確認中';
    el.dialogStatusBadge.className = 'status-badge';
    el.dialogRainMessage.textContent = '降水予報を確認しています';
    el.dialogUpdated.textContent = '更新中';
    renderHourlyMessage('短時間予報を取得しています…');
    renderWeeklyMessage('週間タブを開いたときに取得します。');
    renderMetricsEmpty();
  }

  function clearStoredLocation() {
    state.locationOperationId += 1;
    state.geolocationRequestId += 1;
    abortLocationDependentRequests();
    try {
      localStorage.removeItem(STORAGE_KEYS.location);
      localStorage.removeItem(STORAGE_KEYS.coreCache);
      localStorage.removeItem(STORAGE_KEYS.dailyCache);
    } catch (error) {
      console.warn('Stored weather data could not be cleared:', error);
    }
    state.location = null;
    state.japanAreaInfo = null;
    state.japanAreaController?.abort();
    state.japanAreaController = null;
    renderNoLocation();
    el.locationSearchResults.hidden = true;
    el.locationSearchInput.value = '';
    el.locationSearchInput.focus();
    showToast('保存地点と天気キャッシュを消去しました。');
  }

  function abortLocationDependentRequests() {
    state.weatherRequestId += 1;
    state.dailyRequestId += 1;
    state.weatherController?.abort();
    state.dailyController?.abort();
    state.searchController?.abort();
    state.japanAreaController?.abort();
    state.japanAreaRequestId += 1;
    state.japanAreaController = null;
    state.weatherController = null;
    state.dailyController = null;
    state.searchController = null;
    setLoading(false);
  }

  function renderOfficialLinks() {
    if (!el.officialSourceName || !el.officialLinkGrid) return;
    const source = resolveOfficialSource();
    el.officialSourceName.textContent = source.name;
    el.officialInfoDescription.textContent = source.description;
    el.officialPanelIntroduction.textContent = source.isJapan
      ? '日本では、選択地点を基準に気象庁の雨雲・危険度分布を開き、市区町村を判定できた場合は警報・天気予報にも直接つなぎます。'
      : '雨雲レーダーは内蔵せず、選択した国・地域の公式機関へ案内します。';
    renderOfficialLinkItems(source.links, source.isJapan);
    el.officialLinkNote.textContent = source.note;
    if (source.isJapan) resolveJapanAreaInfo();
  }

  function renderOfficialLinkItems(links, isJapan) {
    el.officialLinkGrid.replaceChildren();
    el.officialLinkGrid.classList.toggle('is-japan', Boolean(isJapan));
    links.forEach((link, index) => {
      const anchor = document.createElement('a');
      anchor.className = `official-link${link.primary || index === 0 ? ' primary' : ''}`;
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      const copy = document.createElement('span');
      copy.className = 'official-link-copy';
      const label = document.createElement('span');
      label.className = 'official-link-label';
      label.textContent = link.label;
      copy.appendChild(label);
      if (link.detail) {
        const detail = document.createElement('span');
        detail.className = 'official-link-detail';
        detail.textContent = link.detail;
        copy.appendChild(detail);
      }
      const side = document.createElement('span');
      side.className = 'official-link-badge';
      side.textContent = link.badge || '公式';
      anchor.append(copy, side);
      el.officialLinkGrid.appendChild(anchor);
    });
  }

  function resolveOfficialSource() {
    const timezone = state.weather?.timezone || state.location?.timezone || '';
    const explicitCountryCode = String(state.location?.countryCode || '').toUpperCase();
    const countryCode = explicitCountryCode || TIMEZONE_COUNTRY_HINTS[timezone] || inferCountryFromCoordinates(state.location) || '';
    const countryName = String(state.location?.country || '').trim();

    if (countryCode === 'JP') return buildJapanOfficialSource();

    const direct = OFFICIAL_SOURCES[countryCode];
    if (direct) {
      return {
        name: direct.name,
        description: direct.description,
        isJapan: false,
        links: [
          { label: direct.weatherLabel || `${direct.name}の公式気象情報を見る`, detail: '公式気象機関', url: direct.weatherUrl, primary: true },
          { label: direct.warningLabel || `${direct.name}の警報・防災情報を見る`, detail: '警報・防災情報', url: direct.warningUrl || 'https://severeweather.wmo.int/' }
        ],
        note: '各国・地域の公式サイトを別タブで開きます。外部サイトでは地点を改めて選択する場合があります。'
      };
    }

    const iso3 = ISO2_TO_ISO3[countryCode];
    const countryPage = iso3
      ? `https://worldweather.wmo.int/en/country.html?countryCode=${encodeURIComponent(iso3)}`
      : 'https://worldweather.wmo.int/en/selection.html';
    const displayCountry = countryName || countryCode || '選択した国・地域';
    return {
      name: `WMO国別公式情報（${displayCountry}）`,
      description: iso3
        ? `${displayCountry}について、各国の気象機関がWMOへ提供した公式予報と公式機関への案内を表示します。`
        : '国・地域を特定できないため、WMOの世界公式気象情報検索へ案内します。',
      isJapan: false,
      links: [
        { label: iso3 ? `${displayCountry}のWMO国別公式ページを見る` : 'WMOで国・地域を選ぶ', detail: '政府系気象機関の予報', url: countryPage, primary: true },
        { label: 'WMOの世界公式警報情報を見る', detail: '世界の重大気象情報', url: 'https://severeweather.wmo.int/' }
      ],
      note: 'WMOに国別ページがない場合や掲載都市が限られる場合があります。現地政府の案内も併せてご確認ください。'
    };
  }

  function buildJapanOfficialSource() {
    const lat = Number(state.location?.latitude);
    const lon = Number(state.location?.longitude);
    const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lon);
    const nowcastUrl = hasCoordinates
      ? `https://www.jma.go.jp/bosai/nowc/#zoom:8/lat:${roundCoordinate(lat, 4)}/lon:${roundCoordinate(lon, 4)}/colordepth:normal/elements:hrpns&liden&amds_rain10m`
      : 'https://www.jma.go.jp/bosai/nowc/';
    const riskUrl = hasCoordinates
      ? `https://www.jma.go.jp/bosai/risk/#zoom:9/lat:${roundCoordinate(lat, 4)}/lon:${roundCoordinate(lon, 4)}/colordepth:normal/elements:land`
      : 'https://www.jma.go.jp/bosai/risk/';
    const areaCode = state.japanAreaInfo?.areaCode || '';
    const areaName = state.japanAreaInfo?.areaName || '';
    const areaHash = areaCode ? `#area_type=class20s&area_code=${encodeURIComponent(areaCode)}&lang=ja` : '';
    const warningUrl = `https://www.jma.go.jp/bosai/warning/${areaHash}`;
    const forecastUrl = `https://www.jma.go.jp/bosai/forecast/${areaHash}`;
    const timelineUrl = `https://www.jma.go.jp/bosai/warning_timeline/${areaHash}`;
    const localUrl = `https://www.jma.go.jp/bosai/${areaHash}`;
    const localDetail = areaName ? `${areaName}へ直接表示` : '地域判定後に市区町村へ直接表示';
    const links = [
      { label: '雨雲の動き', detail: '雨・雷・竜巻を選択地点周辺で表示', url: nowcastUrl, badge: '地点連動', primary: true },
      { label: '警報・注意報', detail: localDetail, url: warningUrl, badge: areaCode ? '市区町村' : '気象庁' },
      { label: 'キキクル', detail: '土砂・浸水・洪水の危険度を地点周辺で表示', url: riskUrl, badge: '地点連動' },
      { label: '天気予報・週間予報', detail: localDetail, url: forecastUrl, badge: areaCode ? '市区町村' : '気象庁' },
      { label: '明日までの警報等の見通し', detail: localDetail, url: timelineUrl, badge: areaCode ? '市区町村' : '気象庁' },
      { label: 'あなたの街の防災情報', detail: '気象庁の地域別防災情報をまとめて確認', url: localUrl, badge: areaCode ? '市区町村' : '気象庁' },
      ...JAPAN_STATIC_LINKS
    ];
    let note = '日本の警報・避難判断は、アプリ内の一般予報ではなく気象庁と自治体の発表を必ず優先してください。';
    if (state.japanAreaInfo?.status === 'resolving') note = '選択地点の市区町村を国土地理院データで確認しています。雨雲とキキクルはすでに地点連動しています。';
    if (state.japanAreaInfo?.status === 'resolved') {
      const method = state.japanAreaInfo.resolution === 'jma-boundary' ? '気象庁の区域境界' : '市区町村コード';
      note = `${areaName || '選択地域'}を${method}で確認し、気象庁の警報・予報ページへ直接つないでいます。警報・避難判断は自治体情報も併せて確認してください。`;
    }
    if (state.japanAreaInfo?.status === 'fallback') note = '市区町村を自動判定できなかったため、警報・予報は気象庁の全国ページを開きます。雨雲とキキクルは選択地点周辺を表示します。';
    return {
      name: areaName ? `気象庁（日本・${areaName}）` : '気象庁（日本）',
      description: '日本専用モードです。雨雲・危険度分布は選択地点へ、警報・予報は判定できた市区町村へ直接案内します。',
      isJapan: true,
      links,
      note
    };
  }

  async function resolveJapanAreaInfo() {
    const location = cloneLocation(state.location);
    if (!location || !isJapanLocation(location) || !isValidLocation(location)) return;
    const requestKey = locationKey(location);
    if (state.japanAreaInfo?.locationKey === requestKey && ['resolving', 'resolved', 'fallback'].includes(state.japanAreaInfo.status)) return;

    const requestId = ++state.japanAreaRequestId;
    state.japanAreaController?.abort();
    const controller = new AbortController();
    state.japanAreaController = controller;
    state.japanAreaInfo = { status: 'resolving', locationKey: requestKey, areaCode: '', areaName: '', resolution: '' };
    renderOfficialLinks();

    try {
      const areaMaster = await getJmaAreaMaster();
      const class20Relm = await getJmaClass20Relm().catch((error) => {
        console.warn('JMA class20 bounds unavailable; municipality fallback will be used:', error);
        return null;
      });
      let resolution = class20Relm
        ? await resolveJmaAreaByCoordinates(location, areaMaster, class20Relm, controller.signal)
        : null;
      if (!resolution) resolution = await resolveJmaAreaByMunicipality(location, areaMaster, controller.signal);
      if (!resolution?.areaCode || !areaMaster?.class20s?.[resolution.areaCode]) throw new Error('JMA class20 area unavailable');
      if (requestId !== state.japanAreaRequestId || !state.location || locationKey(state.location) !== requestKey) return;
      state.japanAreaInfo = {
        status: 'resolved',
        locationKey: requestKey,
        areaCode: resolution.areaCode,
        areaName: String(areaMaster.class20s[resolution.areaCode]?.name || state.location.admin1 || state.location.name || ''),
        resolution: resolution.method
      };
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.warn('Japan official area resolution failed:', error);
      if (requestId !== state.japanAreaRequestId || !state.location || locationKey(state.location) !== requestKey) return;
      state.japanAreaInfo = { status: 'fallback', locationKey: requestKey, areaCode: '', areaName: '', resolution: '' };
    } finally {
      if (requestId === state.japanAreaRequestId) state.japanAreaController = null;
      if (state.activeTab === 'official' && state.location && locationKey(state.location) === requestKey) renderOfficialLinks();
    }
  }

  async function resolveJmaAreaByCoordinates(location, areaMaster, class20Relm, signal) {
    const lat = Number(location.latitude);
    const lon = Number(location.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !class20Relm) return null;
    const candidates = Object.entries(class20Relm)
      .filter(([code, bounds]) => areaMaster?.class20s?.[code] && coordinateInsideBounds(lat, lon, bounds))
      .sort((a, b) => boundsArea(a[1]) - boundsArea(b[1]));

    for (const [code] of candidates.slice(0, 12)) {
      try {
        const geojson = await getJmaClass20Geometry(code, signal);
        if (geoJsonContainsCoordinate(geojson, lon, lat)) return { areaCode: code, method: 'jma-boundary' };
      } catch (error) {
        if (error?.name === 'AbortError') throw error;
        console.warn(`JMA class20 geometry unavailable for ${code}:`, error);
      }
    }
    return null;
  }

  async function resolveJmaAreaByMunicipality(location, areaMaster, signal) {
    const params = new URLSearchParams({ lat: String(location.latitude), lon: String(location.longitude) });
    const response = await fetchWithTimeout(`${JAPAN_ENDPOINTS.gsiReverse}?${params}`, { cache: 'no-store', signal }, 8000);
    if (!response.ok) return null;
    const data = await response.json();
    const muniCode = String(data?.results?.muniCd || '').padStart(5, '0');
    if (!/^\d{5}$/.test(muniCode)) return null;
    const exact = `${muniCode}00`;
    if (areaMaster?.class20s?.[exact]) return { areaCode: exact, method: 'gsi-municipality' };
    return null;
  }

  function coordinateInsideBounds(lat, lon, bounds) {
    const ne = bounds?.ne;
    const sw = bounds?.sw;
    return Array.isArray(ne) && Array.isArray(sw)
      && lat <= Number(ne[0]) && lat >= Number(sw[0])
      && lon <= Number(ne[1]) && lon >= Number(sw[1]);
  }

  function boundsArea(bounds) {
    const ne = bounds?.ne;
    const sw = bounds?.sw;
    if (!Array.isArray(ne) || !Array.isArray(sw)) return Number.POSITIVE_INFINITY;
    return Math.abs((Number(ne[0]) - Number(sw[0])) * (Number(ne[1]) - Number(sw[1])));
  }

  async function getJmaClass20Geometry(code, signal) {
    if (state.jmaClass20GeometryCache.has(code)) return state.jmaClass20GeometryCache.get(code);
    const url = `${JAPAN_ENDPOINTS.jmaClass20GeojsonBase}${encodeURIComponent(code)}.json`;
    const response = await fetchWithTimeout(url, { cache: 'force-cache', signal }, 8000);
    if (!response.ok) throw new Error(`JMA class20 geometry ${code}: ${response.status}`);
    const data = await response.json();
    state.jmaClass20GeometryCache.set(code, data);
    return data;
  }

  function geoJsonContainsCoordinate(geojson, lon, lat) {
    const features = geojson?.type === 'FeatureCollection' ? geojson.features : [geojson];
    return (features || []).some((feature) => geometryContainsCoordinate(feature?.geometry || feature, lon, lat));
  }

  function geometryContainsCoordinate(geometry, lon, lat) {
    if (!geometry?.coordinates) return false;
    if (geometry.type === 'Polygon') return polygonContainsCoordinate(geometry.coordinates, lon, lat);
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.some((polygon) => polygonContainsCoordinate(polygon, lon, lat));
    return false;
  }

  function polygonContainsCoordinate(rings, lon, lat) {
    if (!Array.isArray(rings) || !rings.length || !ringContainsCoordinate(rings[0], lon, lat)) return false;
    return !rings.slice(1).some((hole) => ringContainsCoordinate(hole, lon, lat));
  }

  function ringContainsCoordinate(ring, lon, lat) {
    if (!Array.isArray(ring) || ring.length < 3) return false;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = Number(ring[i]?.[0]);
      const yi = Number(ring[i]?.[1]);
      const xj = Number(ring[j]?.[0]);
      const yj = Number(ring[j]?.[1]);
      if (![xi, yi, xj, yj].every(Number.isFinite)) continue;
      if (pointOnSegment(lon, lat, xi, yi, xj, yj)) return true;
      const intersects = ((yi > lat) !== (yj > lat))
        && (lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }


  function pointOnSegment(px, py, x1, y1, x2, y2) {
    const cross = (px - x1) * (y2 - y1) - (py - y1) * (x2 - x1);
    if (Math.abs(cross) > 1e-10) return false;
    const dot = (px - x1) * (px - x2) + (py - y1) * (py - y2);
    return dot <= 1e-10;
  }

  async function getJmaAreaMaster() {
    if (state.jmaAreaMaster) return state.jmaAreaMaster;
    if (!state.jmaAreaMasterPromise) {
      state.jmaAreaMasterPromise = fetchWithTimeout(JAPAN_ENDPOINTS.jmaArea, { cache: 'force-cache' }, 10000)
        .then((response) => {
          if (!response.ok) throw new Error(`JMA area master: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          if (!data?.class20s) throw new Error('Invalid JMA area master');
          state.jmaAreaMaster = data;
          return data;
        })
        .catch((error) => {
          state.jmaAreaMasterPromise = null;
          throw error;
        });
    }
    return state.jmaAreaMasterPromise;
  }

  async function getJmaClass20Relm() {
    if (state.jmaClass20Relm) return state.jmaClass20Relm;
    if (!state.jmaClass20RelmPromise) {
      state.jmaClass20RelmPromise = fetchWithTimeout(JAPAN_ENDPOINTS.jmaClass20Relm, { cache: 'force-cache' }, 10000)
        .then((response) => {
          if (!response.ok) throw new Error(`JMA class20 bounds: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          if (!data || typeof data !== 'object') throw new Error('Invalid JMA class20 bounds');
          state.jmaClass20Relm = data;
          return data;
        })
        .catch((error) => {
          state.jmaClass20RelmPromise = null;
          throw error;
        });
    }
    return state.jmaClass20RelmPromise;
  }

  function inferCountryFromCoordinates(location) {
    const lat = Number(location?.latitude);
    const lon = Number(location?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '';
    return lat >= 20 && lat <= 46.5 && lon >= 122 && lon <= 154 ? 'JP' : '';
  }

  function isJapanLocation(location = state.location) {
    const timezone = state.weather?.timezone || location?.timezone || '';
    const code = String(location?.countryCode || '').toUpperCase() || TIMEZONE_COUNTRY_HINTS[timezone] || inferCountryFromCoordinates(location);
    return code === 'JP';
  }

  function handleVisibilityChange() {
    if (!document.hidden) ensureFreshWeather();
  }

  function ensureFreshWeather() {
    if (!state.location || !state.weather || !Number.isFinite(Number(state.dataSavedAt))) return;
    const age = Date.now() - Number(state.dataSavedAt);
    if (age <= CACHE_LIMITS.coreFresh || state.weatherController) return;
    state.rainState = createStaleRainState(state.dataSavedAt);
    renderHomeCard();
    renderDialogSummary();
    refreshWeather();
  }

  function weatherLabel(codeValue) {
    const code = numberOrNull(codeValue);
    if (code === null) return '情報なし';
    if (code === 0) return '快晴';
    if (code === 1) return '晴れ';
    if (code === 2) return '晴れ時々くもり';
    if (code === 3) return 'くもり';
    if ([45, 48].includes(code)) return '霧';
    if ([51, 53, 55, 56, 57].includes(code)) return '霧雨';
    if ([61, 63, 65, 66, 67].includes(code)) return '雨';
    if ([71, 73, 75, 77].includes(code)) return '雪';
    if ([80, 81, 82].includes(code)) return 'にわか雨';
    if ([85, 86].includes(code)) return 'にわか雪';
    if ([95, 96, 99].includes(code)) return '雷雨';
    return '天気情報';
  }

  function precipitationKind(codeValue, snowfallValue) {
    const code = numberOrNull(codeValue);
    const snowfall = numberOrNull(snowfallValue) ?? 0;
    if ([71, 73, 75, 77, 85, 86].includes(code) || snowfall >= 0.1) return { noun: '雪', badge: '雪' };
    if ([56, 57, 66, 67].includes(code)) return { noun: '凍結性の降水', badge: '凍結雨' };
    if ([95, 96, 99].includes(code)) return { noun: '雷を伴う降水', badge: '雷雨' };
    if ([51, 53, 55].includes(code)) return { noun: '霧雨', badge: '霧雨' };
    return { noun: '雨', badge: '雨' };
  }

  function weatherIcon(codeValue, isDayValue = 1) {
    const code = numberOrNull(codeValue);
    const isDay = numberOrNull(isDayValue) ?? 1;
    if (code === null) return iconUnavailable();
    if (code === 0 || code === 1) return isDay ? iconSun() : iconMoon();
    if (code === 2) return iconPartlyCloudy();
    if (code === 3) return iconCloud();
    if ([45, 48].includes(code)) return iconFog();
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return iconRain();
    if ([71, 73, 75, 77, 85, 86].includes(code)) return iconSnow();
    if ([95, 96, 99].includes(code)) return iconStorm();
    return iconCloud();
  }

  function iconSun() {
    return '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="12"/><path d="M32 6v8M32 50v8M6 32h8M50 32h8M13.6 13.6l5.7 5.7M44.7 44.7l5.7 5.7M50.4 13.6l-5.7 5.7M19.3 44.7l-5.7 5.7"/></svg>';
  }

  function iconMoon() {
    return '<svg viewBox="0 0 64 64"><path d="M45.5 43.7A22 22 0 0 1 20.3 18.5 22 22 0 1 0 45.5 43.7Z"/><path d="M44 13v6M41 16h6"/></svg>';
  }

  function iconCloud() {
    return '<svg viewBox="0 0 64 64"><path d="M18 45h29a11 11 0 0 0 1-22 17 17 0 0 0-32.8 5A9 9 0 0 0 18 45Z"/></svg>';
  }

  function iconPartlyCloudy() {
    return '<svg viewBox="0 0 64 64"><circle cx="23" cy="23" r="9"/><path d="M23 6v6M6 23h6M11 11l4 4M35 11l-4 4M18 48h30a10 10 0 0 0 1-20 16 16 0 0 0-30.6 5A8 8 0 0 0 18 48Z"/></svg>';
  }

  function iconRain() {
    return '<svg viewBox="0 0 64 64"><path d="M17 39h30a10 10 0 0 0 1-20 16 16 0 0 0-30.7 5A8 8 0 0 0 17 39Z"/><path d="m22 47-3 7M34 47l-3 7M46 47l-3 7"/></svg>';
  }

  function iconSnow() {
    return '<svg viewBox="0 0 64 64"><path d="M17 36h30a10 10 0 0 0 1-20 16 16 0 0 0-30.7 5A8 8 0 0 0 17 36Z"/><path d="M22 45v10M17.7 47.5l8.6 5M26.3 47.5l-8.6 5M42 45v10M37.7 47.5l8.6 5M46.3 47.5l-8.6 5"/></svg>';
  }

  function iconStorm() {
    return '<svg viewBox="0 0 64 64"><path d="M17 36h30a10 10 0 0 0 1-20 16 16 0 0 0-30.7 5A8 8 0 0 0 17 36Z"/><path d="m34 39-7 11h7l-3 9 11-14h-7z"/></svg>';
  }

  function iconFog() {
    return '<svg viewBox="0 0 64 64"><path d="M17 33h30a10 10 0 0 0 1-20 16 16 0 0 0-30.7 5A8 8 0 0 0 17 33Z"/><path d="M13 43h38M18 51h28"/></svg>';
  }

  function iconLocation() {
    return '<svg viewBox="0 0 64 64"><path d="M32 57s18-15.7 18-31A18 18 0 1 0 14 26c0 15.3 18 31 18 31Z"/><circle cx="32" cy="26" r="6"/></svg>';
  }

  function iconUnavailable() {
    return '<svg viewBox="0 0 64 64"><path d="M18 42h29a11 11 0 0 0 1-22 17 17 0 0 0-32.8 5A9 9 0 0 0 18 42Z"/><path d="M24 51h16"/></svg>';
  }

  function isPrecipitationCode(codeValue) {
    const code = numberOrNull(codeValue);
    return code !== null && [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99].includes(code);
  }

  function findTemperatureAt(targetTime) {
    const hourly = state.weather?.hourly || {};
    if (!hourly.time?.length) return numberOrNull(state.weather?.current?.temperature_2m);
    const target = targetTime.getTime();
    let bestIndex = -1;
    let bestDiff = Infinity;
    hourly.time.forEach((time, index) => {
      const parsed = parseApiTime(time);
      const diff = Math.abs(parsed.getTime() - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = index;
      }
    });
    return bestIndex >= 0 ? numberOrNull(hourly.temperature_2m?.[bestIndex]) : null;
  }

  function validateCoreWeather(data) {
    if (!data || typeof data !== 'object' || !data.current || !data.hourly?.time?.length) {
      throw new Error('Invalid weather response');
    }
  }

  function validateDailyWeather(data) {
    if (!data || typeof data !== 'object' || !data.daily?.time?.length) {
      throw new Error('Invalid daily response');
    }
  }

  function saveLocation(location) {
    try {
      const stored = location.source === 'geolocation'
        ? { ...location, latitude: roundCoordinate(location.latitude, 2), longitude: roundCoordinate(location.longitude, 2) }
        : location;
      localStorage.setItem(STORAGE_KEYS.location, JSON.stringify(stored));
    } catch (error) {
      console.warn('Location save failed:', error);
    }
  }

  function readStoredLocation() {
    const stored = readJSON(STORAGE_KEYS.location);
    if (!isValidLocation(stored)) return null;
    return normalizeLocation(stored);
  }

  function writeCache(storageKey, location, data, savedAt) {
    try {
      const cache = readJSON(storageKey) || {};
      const key = locationKey(location);
      cache[key] = {
        location: sanitizeLocationForCache(location),
        savedAt,
        data
      };
      const entries = Object.entries(cache)
        .sort((a, b) => Number(b[1]?.savedAt || 0) - Number(a[1]?.savedAt || 0))
        .slice(0, CACHE_LIMITS.maxEntries);
      localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(entries)));
    } catch (error) {
      console.warn('Weather cache write failed:', error);
    }
  }

  function readCache(storageKey, location, maxAge) {
    const cache = readJSON(storageKey);
    const entry = cache?.[locationKey(location)];
    if (!entry?.data || !Number.isFinite(Number(entry.savedAt))) return null;
    const age = Date.now() - Number(entry.savedAt);
    if (age < -5 * 60 * 1000 || age > maxAge) return null;
    return entry;
  }

  function sanitizeLocationForCache(location) {
    return {
      name: String(location.name || '選択地点'),
      latitude: roundCoordinate(location.latitude, 3),
      longitude: roundCoordinate(location.longitude, 3),
      timezone: String(location.timezone || 'auto'),
      countryCode: String(location.countryCode || '').toUpperCase(),
      country: String(location.country || ''),
      admin1: String(location.admin1 || ''),
      admin2: String(location.admin2 || ''),
      source: String(location.source || 'search')
    };
  }

  function normalizeLocation(location) {
    return {
      name: String(location.name || '選択地点'),
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      timezone: String(location.timezone || 'auto'),
      countryCode: String(location.countryCode || '').toUpperCase(),
      country: String(location.country || ''),
      admin1: String(location.admin1 || ''),
      admin2: String(location.admin2 || ''),
      source: String(location.source || 'search')
    };
  }

  function isValidLocation(location) {
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);
    return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
      && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
  }

  function cloneLocation(location) {
    return normalizeLocation(location);
  }

  function locationKey(location) {
    return `${roundCoordinate(location.latitude, 3)},${roundCoordinate(location.longitude, 3)}`;
  }

  function isCurrentWeatherRequest(requestId, requestKey) {
    return requestId === state.weatherRequestId && state.location && locationKey(state.location) === requestKey;
  }

  function isCurrentDailyRequest(requestId, requestKey) {
    return requestId === state.dailyRequestId && state.location && locationKey(state.location) === requestKey;
  }

  function setLoading(loading) {
    el.weatherCard.classList.toggle('is-loading', loading);
    if (el.toolbarRefresh) el.toolbarRefresh.disabled = loading || !state.location;
  }

  function clearWeatherClasses() {
    el.weatherCard.classList.remove('rain-soon', 'raining', 'is-stale');
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { el.toast.hidden = true; }, 3600);
  }

  function registerServiceWorker() {
    const standalone = document.documentElement.dataset.weatherStandalone === 'true';
    if (!standalone || !('serviceWorker' in navigator)) return;
    const secure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
    if (!secure) return;
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .catch((error) => console.warn('Service worker registration failed:', error));
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const parentSignal = options.signal;
    const abortFromParent = () => controller.abort(parentSignal.reason);
    if (parentSignal?.aborted) controller.abort(parentSignal.reason);
    else parentSignal?.addEventListener('abort', abortFromParent, { once: true });
    const timer = window.setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      window.clearTimeout(timer);
      parentSignal?.removeEventListener?.('abort', abortFromParent);
    }
  }

  function parseApiTime(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return new Date(value * 1000);
    if (typeof value === 'string' && /^\d+$/.test(value)) return new Date(Number(value) * 1000);
    if (!value) return new Date(Number.NaN);
    return new Date(value);
  }

  function formatTime(date, timezone = 'UTC') {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: validTimeZone(timezone)
    }).format(date);
  }

  function dailyMonthDay(timestamp, offsetSeconds) {
    const date = dailyDisplayDate(timestamp, offsetSeconds);
    return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', timeZone: 'UTC' }).format(date);
  }

  function dailyWeekday(timestamp, offsetSeconds) {
    const date = dailyDisplayDate(timestamp, offsetSeconds);
    return new Intl.DateTimeFormat('ja-JP', { weekday: 'short', timeZone: 'UTC' }).format(date);
  }

  function dailyDisplayDate(timestamp, offsetSeconds) {
    const seconds = Number(timestamp);
    return new Date((seconds + Number(offsetSeconds || 0)) * 1000);
  }

  function dailyDateKey(timestamp, offsetSeconds) {
    const date = dailyDisplayDate(timestamp, offsetSeconds);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  function dateKeyInTimeZone(date, timezone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: validTimeZone(timezone)
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  function validTimeZone(timezone) {
    if (!timezone || timezone === 'auto') return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    try {
      new Intl.DateTimeFormat('ja-JP', { timeZone: timezone }).format();
      return timezone;
    } catch {
      return 'UTC';
    }
  }

  function formatUpdateLabel(date) {
    const timezone = state.weather?.timezone || state.location?.timezone || 'UTC';
    const base = `${formatTime(date, timezone)}更新`;
    if (state.rainState?.type === 'stale') return `${base}・古い保存データ`;
    if (state.dataSource === 'cache') return `${base}・保存データ`;
    return base;
  }

  function formatNumber(value, digits = 0, fallback = '—') {
    const number = numberOrNull(value);
    return number === null ? fallback : number.toFixed(digits);
  }

  function formatMetric(value, digits, suffix) {
    const number = numberOrNull(value);
    return number === null ? '—' : `${number.toFixed(digits)}${suffix}`;
  }

  function numberOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function maxFinite(...values) {
    const finite = values.map(numberOrNull).filter((value) => value !== null);
    return finite.length ? Math.max(...finite) : null;
  }

  function roundCoordinate(value, digits) {
    const factor = 10 ** digits;
    return Math.round(Number(value) * factor) / factor;
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function currentLocationButtonHTML() {
    return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></svg>現在地を使う';
  }

  function readJSON(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
    }[character]));
  }
})();
