(function (global) {
  'use strict';

  const JAPAN = Object.freeze({ label: '日本', lat: 35.45, lon: 139.65 });

  global.MB_WORLD_ROUTE_V323 = Object.freeze({
    buildId: 'MARKET_BASE_V324_OFFLINE_MUSIC_PRECISE_NUMBERS_20260730',
    defaultCountry: 'TW',
    countries: [
      {
        code: 'TW',
        name: '台湾',
        region: '東アジア',
        variants: [
          {
            key: 'main',
            label: '台北',
            steps: [
              JAPAN,
              { label: '台北港', lat: 25.15, lon: 121.40 }
            ],
            ports: ['台北港', '台中港', '基隆港', '高雄港'],
            note: '届け先の地域に合わせて、利用する到着港を選びます。'
          }
        ],
        sources: [
          { label: '台湾の港湾情報', url: 'https://www.twport.com.tw/en/business/PortInfo?a=521' }
        ]
      },
      {
        code: 'KR',
        name: '韓国',
        region: '東アジア',
        variants: [
          {
            key: 'main',
            label: '釜山',
            steps: [
              JAPAN,
              { label: '釜山港', lat: 35.10, lon: 129.04 }
            ],
            ports: ['釜山港'],
            note: '釜山港が、日本からの主な到着港です。'
          }
        ],
        sources: [
          { label: '釜山港の公式情報', url: 'https://www.busanpa.com/index.bpa?menuCd=DOM_000000202000000000' }
        ]
      },
      {
        code: 'CN',
        name: '中国',
        region: '東アジア',
        variants: [
          {
            key: 'east',
            label: '華東',
            steps: [
              JAPAN,
              { label: '上海港', lat: 31.23, lon: 121.50 }
            ],
            ports: ['上海港', '寧波舟山港'],
            note: '上海周辺や華東地域へ向かう場合の代表的な流れです。'
          },
          {
            key: 'north',
            label: '華北',
            steps: [
              JAPAN,
              { label: '天津港', lat: 38.98, lon: 117.72 }
            ],
            ports: ['大連港', '天津港'],
            note: '中国北部へ向かう場合の代表的な流れです。'
          },
          {
            key: 'south',
            label: '華南',
            steps: [
              JAPAN,
              { label: '塩田港', lat: 22.56, lon: 114.28 }
            ],
            ports: ['厦門港', '塩田港'],
            note: '中国南部へ向かう場合の代表的な流れです。'
          }
        ],
        sources: [
          { label: '上海港の公式情報', url: 'https://en.portshanghai.com.cn/' }
        ]
      },
      {
        code: 'MN',
        name: 'モンゴル',
        region: '東アジア',
        variants: [
          {
            key: 'main',
            label: 'ウランバートル',
            steps: [
              JAPAN,
              { label: '天津港', lat: 38.98, lon: 117.72 },
              { label: '二連浩特', lat: 43.65, lon: 111.97 },
              { label: 'ザミンウード', lat: 43.72, lon: 111.90 },
              { label: 'ウランバートル', lat: 47.92, lon: 106.92 }
            ],
            ports: ['天津港（中国）'],
            note: '中国の港から鉄道に積み替えて、モンゴルへ向かいます。'
          }
        ],
        sources: [
          { label: 'モンゴルの交通情報', url: 'https://mrt.gov.mn/up/news/InvestmentForum/3-1MRTD-Transport_eng-2023%20-_Final.pdf' }
        ]
      },
      {
        code: 'VN',
        name: 'ベトナム',
        region: '東南アジア',
        variants: [
          {
            key: 'north',
            label: '北部',
            steps: [
              JAPAN,
              { label: 'ハイフォン港', lat: 20.86, lon: 106.68 }
            ],
            ports: ['ハイフォン港'],
            note: 'ハノイ周辺へ向かう場合の代表的な到着港です。'
          },
          {
            key: 'south',
            label: '南部',
            steps: [
              JAPAN,
              { label: 'カイメップ港', lat: 10.52, lon: 107.00 }
            ],
            ports: ['カイメップ港', 'ホーチミン港'],
            note: 'ホーチミン周辺へ向かう場合の代表的な到着港です。'
          }
        ],
        sources: [
          { label: 'ベトナムの港湾情報', url: 'https://vimc.co/en/vimc-makes-vietnams-ports-highly-competitive/' }
        ]
      },
      {
        code: 'TH',
        name: 'タイ',
        region: '東南アジア',
        variants: [
          {
            key: 'main',
            label: 'レムチャバン',
            steps: [
              JAPAN,
              { label: 'レムチャバン港', lat: 13.08, lon: 100.88 }
            ],
            ports: ['レムチャバン港'],
            note: 'バンコク周辺へ向かう貨物の主な到着港です。'
          }
        ],
        sources: [
          { label: 'レムチャバン港の公式情報', url: 'https://www.eeco.or.th/en/laem-chabang-port-phase-3/' }
        ]
      },
      {
        code: 'SG',
        name: 'シンガポール',
        region: '東南アジア',
        variants: [
          {
            key: 'main',
            label: 'シンガポール',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 }
            ],
            ports: ['シンガポール港'],
            note: '東南アジアの主要港へ直接向かう代表的な流れです。'
          }
        ],
        sources: [
          { label: 'シンガポール港の公式情報', url: 'https://www.mpa.gov.sg/maritime-singapore/what-maritime-singapore-offers/global-hub-port' }
        ]
      },
      {
        code: 'ID',
        name: 'インドネシア',
        region: '東南アジア',
        variants: [
          {
            key: 'main',
            label: 'ジャカルタ',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'ジャカルタ港', lat: -6.10, lon: 106.88 }
            ],
            ports: ['ジャカルタ港', 'スラバヤ港'],
            note: '主な到着港は、ジャカルタとスラバヤです。'
          }
        ],
        sources: [
          { label: 'インドネシアの港湾情報', url: 'https://ptosr.pelindo.co.id/ScheduleBoard' }
        ]
      },
      {
        code: 'IN',
        name: 'インド',
        region: '南アジア',
        variants: [
          {
            key: 'west',
            label: '西岸',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'コロンボ港', lat: 6.95, lon: 79.85 },
              { label: 'ナバシェバ港', lat: 18.95, lon: 72.95 }
            ],
            ports: ['ナバシェバ港', 'ムンドラ港'],
            note: 'ムンバイ周辺へ向かう場合の代表的な流れです。'
          },
          {
            key: 'east',
            label: '東岸',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'ベンガル湾', lat: 15.00, lon: 88.00 },
              { label: 'チェンナイ港', lat: 13.08, lon: 80.30 }
            ],
            ports: ['チェンナイ港'],
            note: 'インド東部へ向かう場合の代表的な流れです。'
          }
        ],
        sources: [
          { label: 'ナバシェバ港の公式情報', url: 'https://www.jnport.gov.in/' }
        ]
      },
      {
        code: 'AE',
        name: 'アラブ首長国連邦',
        region: '中東',
        variants: [
          {
            key: 'dubai',
            label: 'ドバイ',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'ホルムズ海峡', lat: 26.56, lon: 56.25 },
              { label: 'ジュベルアリ港', lat: 25.01, lon: 55.06 }
            ],
            ports: ['ジュベルアリ港'],
            note: 'ドバイ周辺へ向かう場合の代表的な到着港です。'
          },
          {
            key: 'abudhabi',
            label: 'アブダビ',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'ホルムズ海峡', lat: 26.56, lon: 56.25 },
              { label: 'ハリファ港', lat: 24.81, lon: 54.65 }
            ],
            ports: ['ハリファ港'],
            note: 'アブダビ周辺へ向かう場合の代表的な到着港です。'
          }
        ],
        sources: [
          { label: 'ジュベルアリ港の公式情報', url: 'https://www.dpworld.com/en/ports-terminals/uae/jebel-ali-port' }
        ]
      },
      {
        code: 'SA',
        name: 'サウジアラビア',
        region: '中東',
        variants: [
          {
            key: 'redsea',
            label: '紅海側',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'バブ・エル・マンデブ海峡', lat: 12.58, lon: 43.33 },
              { label: 'ジッダ港', lat: 21.48, lon: 39.17 }
            ],
            ports: ['ジッダ港'],
            note: 'サウジアラビア西部へ向かう場合の代表的な流れです。'
          },
          {
            key: 'gulf',
            label: '湾岸側',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'ホルムズ海峡', lat: 26.56, lon: 56.25 },
              { label: 'ダンマン港', lat: 26.50, lon: 50.20 }
            ],
            ports: ['ダンマン港'],
            note: 'サウジアラビア東部へ向かう場合の代表的な流れです。'
          }
        ],
        sources: [
          { label: 'サウジアラビアの港湾情報', url: 'https://mawani.gov.sa/ports' }
        ]
      },
      {
        code: 'TR',
        name: 'トルコ',
        region: '中東・地中海',
        variants: [
          {
            key: 'marmara',
            label: 'マルマラ海側',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'スエズ運河', lat: 30.00, lon: 32.55 },
              { label: 'マルポート', lat: 40.97, lon: 28.68 }
            ],
            ports: ['マルポート', 'アンバルリ港'],
            note: 'イスタンブール周辺へ向かう場合の代表的な流れです。'
          },
          {
            key: 'mediterranean',
            label: '東地中海側',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'スエズ運河', lat: 30.00, lon: 32.55 },
              { label: 'メルスィン港', lat: 36.80, lon: 34.63 }
            ],
            ports: ['メルスィン港'],
            note: 'トルコ南部へ向かう場合の代表的な流れです。'
          }
        ],
        sources: [
          { label: 'マルポートの公式情報', url: 'https://www.marport.com.tr/hizmetler' }
        ]
      },
      {
        code: 'GB',
        name: 'イギリス',
        region: 'ヨーロッパ',
        variants: [
          {
            key: 'cape',
            label: '喜望峰経由',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: '喜望峰', lat: -34.36, lon: 18.47 },
              { label: 'サウサンプトン港', lat: 50.89, lon: -1.40 }
            ],
            ports: ['サウサンプトン港', 'フェリクストウ港', 'ロンドン・ゲートウェイ港'],
            note: '利用される経路は、出港日と便によって変わります。'
          },
          {
            key: 'suez',
            label: 'スエズ経由',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'スエズ運河', lat: 30.00, lon: 32.55 },
              { label: 'サウサンプトン港', lat: 50.89, lon: -1.40 }
            ],
            ports: ['サウサンプトン港', 'フェリクストウ港', 'ロンドン・ゲートウェイ港'],
            note: '利用される経路は、出港日と便によって変わります。'
          }
        ],
        sources: [
          { label: '船会社の公式航路情報', url: 'https://www.cma-cgm.com/ebusiness/schedules/line-services/flyer/OCR' }
        ]
      },
      {
        code: 'NL',
        name: 'オランダ',
        region: 'ヨーロッパ',
        variants: [
          {
            key: 'cape',
            label: '喜望峰経由',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: '喜望峰', lat: -34.36, lon: 18.47 },
              { label: 'ロッテルダム港', lat: 51.95, lon: 4.14 }
            ],
            ports: ['ロッテルダム港'],
            note: '利用される経路は、出港日と便によって変わります。'
          },
          {
            key: 'suez',
            label: 'スエズ経由',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'スエズ運河', lat: 30.00, lon: 32.55 },
              { label: 'ロッテルダム港', lat: 51.95, lon: 4.14 }
            ],
            ports: ['ロッテルダム港'],
            note: '利用される経路は、出港日と便によって変わります。'
          }
        ],
        sources: [
          { label: 'ロッテルダム港の公式情報', url: 'https://www.portofrotterdam.com/en/logistics/connections' }
        ]
      },
      {
        code: 'DE',
        name: 'ドイツ',
        region: 'ヨーロッパ',
        variants: [
          {
            key: 'cape',
            label: '喜望峰経由',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: '喜望峰', lat: -34.36, lon: 18.47 },
              { label: 'ハンブルク港', lat: 53.54, lon: 9.98 }
            ],
            ports: ['ハンブルク港', 'ブレーマーハーフェン港'],
            note: '利用される経路は、出港日と便によって変わります。'
          },
          {
            key: 'suez',
            label: 'スエズ経由',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'スエズ運河', lat: 30.00, lon: 32.55 },
              { label: 'ハンブルク港', lat: 53.54, lon: 9.98 }
            ],
            ports: ['ハンブルク港', 'ブレーマーハーフェン港'],
            note: '利用される経路は、出港日と便によって変わります。'
          }
        ],
        sources: [
          { label: 'ハンブルク港の公式情報', url: 'https://www.hafen-hamburg.de/en/hinterland/rail/' }
        ]
      },
      {
        code: 'US',
        name: 'アメリカ',
        region: '北米',
        variants: [
          {
            key: 'west',
            label: '西海岸',
            steps: [
              JAPAN,
              { label: '北太平洋', lat: 40.00, lon: -175.00 },
              { label: 'ロサンゼルス・ロングビーチ港', lat: 33.75, lon: -118.25 }
            ],
            ports: ['ロサンゼルス港', 'ロングビーチ港', 'オークランド港'],
            note: 'アメリカ西部へ向かう場合の代表的な流れです。'
          },
          {
            key: 'east',
            label: '東海岸',
            steps: [
              JAPAN,
              { label: '太平洋', lat: 15.00, lon: -175.00 },
              { label: 'パナマ運河', lat: 9.08, lon: -79.68 },
              { label: 'ニューヨーク・ニュージャージー港', lat: 40.67, lon: -74.05 }
            ],
            ports: ['サバンナ港', 'ニューヨーク・ニュージャージー港'],
            note: 'アメリカ東部へ向かう場合の代表的な流れです。'
          }
        ],
        sources: [
          { label: 'ロサンゼルス港の公式情報', url: 'https://portoflosangeles.org/business/terminals/container' }
        ]
      },
      {
        code: 'CA',
        name: 'カナダ',
        region: '北米',
        variants: [
          {
            key: 'vancouver',
            label: 'バンクーバー',
            steps: [
              JAPAN,
              { label: '北太平洋', lat: 42.00, lon: -175.00 },
              { label: 'バンクーバー港', lat: 49.29, lon: -123.10 }
            ],
            ports: ['バンクーバー港'],
            note: 'カナダ西部へ向かう場合の代表的な到着港です。'
          },
          {
            key: 'princerupert',
            label: 'プリンスルパート',
            steps: [
              JAPAN,
              { label: '北太平洋', lat: 45.00, lon: -175.00 },
              { label: 'プリンスルパート港', lat: 54.31, lon: -130.32 }
            ],
            ports: ['プリンスルパート港'],
            note: '北米内陸へ鉄道でつなぐ場合にも利用される港です。'
          }
        ],
        sources: [
          { label: 'プリンスルパート港の公式情報', url: 'https://www.rupertport.com/terminal_details/fairview-container-terminal/' }
        ]
      },
      {
        code: 'BR',
        name: 'ブラジル',
        region: '南米',
        variants: [
          {
            key: 'main',
            label: 'サントス',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: '喜望峰', lat: -34.36, lon: 18.47 },
              { label: 'サントス港', lat: -23.95, lon: -46.33 }
            ],
            ports: ['サントス港', 'リオデジャネイロ港', 'イタポア港'],
            note: 'ブラジル南東部へ向かう場合の代表的な流れです。'
          }
        ],
        sources: [
          { label: 'サントス港の公式情報', url: 'https://www.portodesantos.com.br/wp-content/uploads/Facts-Figures-2026.pdf' }
        ]
      },
      {
        code: 'AU',
        name: 'オーストラリア',
        region: 'オセアニア',
        variants: [
          {
            key: 'east',
            label: '東岸',
            steps: [
              JAPAN,
              { label: 'シドニー港', lat: -33.97, lon: 151.20 }
            ],
            ports: ['メルボルン港', 'シドニー港', 'ブリスベン港'],
            note: '届け先の地域に合わせて、東岸の到着港を選びます。'
          },
          {
            key: 'west',
            label: '西岸',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'フリーマントル港', lat: -32.05, lon: 115.74 }
            ],
            ports: ['フリーマントル港'],
            note: 'オーストラリア西部へ向かう場合の代表的な流れです。'
          }
        ],
        sources: [
          { label: 'メルボルン港の公式情報', url: 'https://www.portofmelbourne.com/about-us/about-the-port/' }
        ]
      },
      {
        code: 'ZA',
        name: '南アフリカ',
        region: 'アフリカ',
        variants: [
          {
            key: 'durban',
            label: 'ダーバン',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'ダーバン港', lat: -29.88, lon: 31.05 }
            ],
            ports: ['ダーバン港'],
            note: '南アフリカ東部へ向かう場合の代表的な到着港です。'
          },
          {
            key: 'capetown',
            label: 'ケープタウン',
            steps: [
              JAPAN,
              { label: 'シンガポール港', lat: 1.26, lon: 103.84 },
              { label: 'ケープタウン港', lat: -33.92, lon: 18.43 }
            ],
            ports: ['ケープタウン港'],
            note: '南アフリカ南西部へ向かう場合の代表的な流れです。'
          }
        ],
        sources: [
          { label: '南アフリカの港湾情報', url: 'https://www.transnet.net/SubsiteRender.aspx?id=1358895' }
        ]
      }
    ]
  });
})(window);
