import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { createZeevisstekStyle } from './iconStyles'

// Zeevisstekken data - bekende plekken langs de Nederlandse kust
// LineStrings voor kanalen/pieren, Points voor stranden
const ZEEVISSTEKKEN_DATA = {
  type: 'FeatureCollection',
  features: [
    // === EUROPOORT / MAASVLAKTE - LIJNEN ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.0580, 51.9420],
          [4.0720, 51.9380],
          [4.0850, 51.9350]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Calandkanaal Zuid',
        regio: 'Europoort',
        beschrijving: 'Toegankelijke stek langs het Calandkanaal tussen 4e en 5e Petroleumhaven. Snelstromend kanaal, ideaal voor zeebaars.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Harder', 'Bot'],
          winter: ['Gul', 'Wijting', 'Steenbolk', 'Schar']
        },
        tips: 'Beste bij opkomend water. Kunstaas werkt goed voor zeebaars.',
        bereikbaarheid: 'Via Europaweg richting Europoort'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.0650, 51.9080],
          [4.0780, 51.9150],
          [4.0900, 51.9200]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Beerkanaal (Kop van de Beer)',
        regio: 'Europoort',
        beschrijving: 'Toplocatie voor zeebaars. Alleen toegankelijk tijdens georganiseerde wedstrijddagen (6-10x per jaar).',
        parkeren: 'N.v.t.',
        beerkanaal: true,
        vissoorten: {
          zomer: ['Zeebaars', 'Harder'],
          winter: ['Gul', 'Wijting']
        },
        tips: 'Let op wedstrijdkalender. Niet individueel toegankelijk.',
        bereikbaarheid: 'Beperkte toegang - alleen bij wedstrijden'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.0100, 51.9850],
          [3.9900, 51.9780],
          [3.9700, 51.9700]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: '2e Maasvlakte Strand',
        regio: 'Maasvlakte',
        beschrijving: 'Nieuw aangelegd strand met uitstekende mogelijkheden. Veel ruimte en diverse stekken.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Tong', 'Bot', 'Harder'],
          winter: ['Gul', 'Wijting', 'Schar', 'Steenbolk']
        },
        tips: 'Zeebaars vooral op zagers (natuurlijk aas). Vroege ochtend en avond beste tijden.',
        bereikbaarheid: 'Goede parkeergelegenheid bij strandopgang'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.0450, 51.9550],
          [4.0350, 51.9500],
          [4.0250, 51.9450]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Yangtzehaven Noord',
        regio: 'Europoort',
        beschrijving: 'Noordkant van de Yangtzehaven. Goede stek voor harder en zeebaars.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Harder', 'Zeebaars', 'Bot'],
          winter: ['Gul', 'Wijting']
        },
        tips: 'Bij opkomend water de beste kansen.',
        bereikbaarheid: 'Via Maasvlakteweg'
      }
    },

    // === HOEK VAN HOLLAND - LIJNEN ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.1180, 51.9830],
          [4.1050, 51.9890],
          [4.0920, 51.9950]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Noorderpier Hoek van Holland',
        regio: 'Hoek van Holland',
        beschrijving: 'Lange pier met uitstekende mogelijkheden. Vis trekt de Waterweg op langs de pier.',
        parkeren: 'Gratis (lang lopen, vouwfiets aangeraden)',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Makreel', 'Harder', 'Bot'],
          winter: ['Gul', 'Wijting', 'Schar', 'Steenbolk']
        },
        tips: 'Beste stekken vanaf de eerste boei. Nachtvisserij zeer productief voor gul.',
        bereikbaarheid: 'Parkeren bij strand, dan flink stuk lopen (2+ km)'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.1220, 51.9770],
          [4.1150, 51.9800],
          [4.1080, 51.9830]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Zuiderpier Hoek van Holland',
        regio: 'Hoek van Holland',
        beschrijving: 'Kortere pier dan de Noorderpier maar vaak minder druk.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Bot', 'Tong'],
          winter: ['Gul', 'Wijting', 'Schar']
        },
        tips: 'Goede optie als het druk is op de Noorderpier.',
        bereikbaarheid: 'Korter lopen dan Noorderpier'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.1350, 51.9780],
          [4.1450, 51.9750],
          [4.1550, 51.9720]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Strand Hoek van Holland',
        regio: 'Hoek van Holland',
        beschrijving: 'Strandvissen met goede kansen op platvis en zeebaars.',
        parkeren: 'Betaald (strandparkeren)',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Bot', 'Tong', 'Zeebaars', 'Harder'],
          winter: ['Gul', 'Wijting', 'Schar']
        },
        tips: 'Best bij wind op de kant. Vroege ochtend en late avond.',
        bereikbaarheid: 'Goed bereikbaar'
      }
    },

    // === SCHEVENINGEN - LIJNEN ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.2600, 52.1120],
          [4.2650, 52.1080],
          [4.2700, 52.1040]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Zuidelijk Havenhoofd Scheveningen',
        regio: 'Scheveningen',
        beschrijving: 'Populaire stek aan de haven. Let op obstakels onderwater na baggerwerk.',
        parkeren: 'Betaald',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Bot', 'Schar', 'Makreel'],
          winter: ['Wijting', 'Gul', 'Sliptong']
        },
        tips: 'Havenkant levert vaak meer op dan zeekant bij harde wind.',
        bereikbaarheid: 'Parkeren aan Dr. Lelykade'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.2530, 52.1150],
          [4.2480, 52.1180],
          [4.2430, 52.1210]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Noordelijk Havenhoofd Scheveningen',
        regio: 'Scheveningen',
        beschrijving: 'Mooie stek met uitzicht op de haven. Goede mogelijkheden op diverse vissoorten.',
        parkeren: 'Betaald',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Bot', 'Schar', 'Harder'],
          winter: ['Wijting', 'Gul']
        },
        tips: 'Minder druk dan het zuidelijk havenhoofd.',
        bereikbaarheid: 'Goed bereikbaar'
      }
    },

    // === IJMUIDEN - LIJNEN ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.5550, 52.4680],
          [4.5400, 52.4720],
          [4.5250, 52.4760]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Noorderpier IJmuiden',
        regio: 'IJmuiden',
        beschrijving: 'Walhalla voor zeebaars! Dé toplocatie voor zeebaars in Nederland. Vis komt zeer dicht onder de kant.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Makreel', 'Harder'],
          winter: ['Gul', 'Wijting', 'Steenbolk']
        },
        tips: 'Zeebaarzen actiever in het donker. Beste bij golvend water. Kunstaas zeer effectief.',
        bereikbaarheid: 'Parkeren bij Seaport Marina, Kennemerboulevard'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.5650, 52.4600],
          [4.5750, 52.4550],
          [4.5850, 52.4500]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Zuiderpier IJmuiden',
        regio: 'IJmuiden',
        beschrijving: 'Goede alternatieve stek, minder druk dan de Noorderpier.',
        parkeren: 'Betaald',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Harder', 'Bot'],
          winter: ['Gul', 'Wijting']
        },
        tips: 'Goede optie als Noorderpier te druk is.',
        bereikbaarheid: 'Goed bereikbaar via Zuidpier'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.5600, 52.4550],
          [4.5700, 52.4500],
          [4.5800, 52.4450]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Strand IJmuiden',
        regio: 'IJmuiden',
        beschrijving: 'Strandvissen met goede kansen op diverse soorten.',
        parkeren: 'Betaald (zomer), Gratis (winter)',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Bot', 'Tong', 'Zeebaars'],
          winter: ['Gul', 'Wijting', 'Schar']
        },
        tips: 'Best bij wind op de kant.',
        bereikbaarheid: 'Diverse strandopgangen'
      }
    },

    // === DEN HELDER - LIJNEN ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.7450, 52.9640],
          [4.7350, 52.9680],
          [4.7250, 52.9720]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Havenhoofd Den Helder',
        regio: 'Den Helder',
        beschrijving: 'Goede stek aan de marinehaven. Let op scheepvaart.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Makreel', 'Harder', 'Bot'],
          winter: ['Kabeljauw', 'Wijting', 'Schar']
        },
        tips: 'Veel scheepvaartverkeer, wees alert.',
        bereikbaarheid: 'Goed bereikbaar'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.7300, 52.9550],
          [4.7200, 52.9500],
          [4.7100, 52.9450]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Strand Huisduinen',
        regio: 'Den Helder',
        beschrijving: 'Rustig strand bij de vuurtoren. Mooi uitzicht op Texel.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Bot', 'Schar', 'Harder'],
          winter: ['Wijting', 'Gul']
        },
        tips: 'Mooie locatie, ook voor gezin.',
        bereikbaarheid: 'Goed bereikbaar'
      }
    },

    // === TEXEL - LIJNEN ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.7950, 53.1700],
          [4.8050, 53.1650],
          [4.8150, 53.1600]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'De Cocksdorp Noord (Texel)',
        regio: 'Texel',
        beschrijving: 'Noordpunt van Texel met sterkere stroming. Bekend om zeebaars.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Bot', 'Harder'],
          winter: ['Gul', 'Wijting', 'Schar']
        },
        tips: 'Sterkere stroming rond de kop zorgt voor meer zeebaars.',
        bereikbaarheid: 'Fiets of auto naar strandopgang paal 33'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.7200, 53.0900],
          [4.7100, 53.0850],
          [4.7000, 53.0800]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Strekdam bij Vuurtoren (Texel)',
        regio: 'Texel',
        beschrijving: 'Strekdam met mossels en wieren. Ideaal voor zeebaars.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Harder'],
          winter: ['Wijting', 'Gul']
        },
        tips: 'Stenen begroeid met mossels - magneet voor zeebaars.',
        bereikbaarheid: 'Kort lopen vanaf parkeerplaats'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.7050, 53.0500],
          [4.7150, 53.0450],
          [4.7250, 53.0400]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Strekdammen De Koog (Texel)',
        regio: 'Texel',
        beschrijving: 'Meerdere strekdammen met goede mogelijkheden. Goede optie bij wind.',
        parkeren: 'Betaald (seizoen)',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Bot', 'Harder'],
          winter: ['Wijting', 'Schar']
        },
        tips: 'Bij wind een beschutte optie.',
        bereikbaarheid: 'Goed bereikbaar vanaf De Koog'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.7550, 53.0200],
          [4.7650, 53.0150],
          [4.7750, 53.0100]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Strand paal 9-15 (Texel)',
        regio: 'Texel',
        beschrijving: 'Rustigste stuk strand. Nauwelijks badgasten, ideaal voor vissers.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Bot', 'Tong', 'Zeebaars'],
          winter: ['Wijting', 'Schar', 'Gul']
        },
        tips: 'Geen vergunning nodig voor zeevissen. Max 2 hengels.',
        bereikbaarheid: 'Rustige locatie, weinig voorzieningen'
      }
    },

    // === TERSCHELLING - LIJNEN ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [5.2200, 53.3620],
          [5.2100, 53.3650],
          [5.2000, 53.3680]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Haven West-Terschelling (strekdammen)',
        regio: 'Terschelling',
        beschrijving: 'Beide strekdammen rondom de haven zijn prima stekken.',
        parkeren: 'Betaald (haven)',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Harder', 'Bot'],
          winter: ['Wijting', 'Gul']
        },
        tips: 'Goede startlocatie. Geen vergunning nodig.',
        bereikbaarheid: 'Direct bij veerhaven'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [5.3500, 53.4050],
          [5.3600, 53.4080],
          [5.3700, 53.4110]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Noordzeestrand Terschelling',
        regio: 'Terschelling',
        beschrijving: 'Eindeloze verlaten stranden. Perfect voor rustige visdag.',
        parkeren: 'Gratis (fiets aangeraden)',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Bot', 'Tong', 'Zeebaars'],
          winter: ['Wijting', 'Schar']
        },
        tips: 'Naseizoen vrijwel verlaten. Heerlijk rustig vissen.',
        bereikbaarheid: 'Fiets of te voet over de duinen'
      }
    },

    // === ZEELAND - DOMBURG ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.4850, 51.5680],
          [3.4950, 51.5650],
          [3.5050, 51.5620]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Strand Domburg',
        regio: 'Zeeland',
        beschrijving: 'Uitstekend strandvissen. Bekend om tong in de zomer.',
        parkeren: 'Betaald',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Bot', 'Schol', 'Tong', 'Geep'],
          winter: ['Wijting', 'Gul']
        },
        tips: 'Kan druk zijn in de zomer. Vroege ochtend beste tijd.',
        bereikbaarheid: 'Goede parkeervoorzieningen'
      }
    },

    // === ZEELAND - VLISSINGEN ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.5650, 51.4450],
          [3.5750, 51.4420],
          [3.5850, 51.4390]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Nollestrand Vlissingen',
        regio: 'Zeeland',
        beschrijving: 'Populair strand met goede vismogelijkheden.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Platvis', 'Makreel'],
          winter: ['Gul', 'Wijting']
        },
        tips: 'Boulevard stranden ook productief.',
        bereikbaarheid: 'Goede parkeerplaats'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.5750, 51.4420],
          [3.5850, 51.4400],
          [3.5950, 51.4380]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Boulevard Vlissingen',
        regio: 'Zeeland',
        beschrijving: 'Vissen vanaf de boulevard met mooi uitzicht.',
        parkeren: 'Betaald',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Harder', 'Bot'],
          winter: ['Gul', 'Wijting']
        },
        tips: 'Gezellige locatie, ook voor gezin.',
        bereikbaarheid: 'Centrum Vlissingen'
      }
    },

    // === ZEELAND - WESTKAPELLE ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.4300, 51.5300],
          [3.4400, 51.5270],
          [3.4500, 51.5240]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Strand Westkapelle',
        regio: 'Zeeland',
        beschrijving: 'Strand bij Westkapelle met goede mogelijkheden.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Bot', 'Zeebaars'],
          winter: ['Gul', 'Platvis', 'Wijting']
        },
        tips: 'Rustigere locatie dan Domburg.',
        bereikbaarheid: 'Goed bereikbaar'
      }
    },

    // === ZEELAND - NEELTJE JANS ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.6750, 51.6300],
          [3.6850, 51.6250],
          [3.6950, 51.6200]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Neeltje Jans (strekdammen)',
        regio: 'Zeeland',
        beschrijving: 'Kunstmatig eiland met uitstekende strekdammen. Diep water dichtbij.',
        parkeren: 'Betaald (Deltapark)',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Geep'],
          winter: ['Gul', 'Wijting']
        },
        tips: 'Dieper water = sneller op diepte. Hele jaar door gul en wijting.',
        bereikbaarheid: 'Parkeren bij Deltapark Neeltje Jans'
      }
    },

    // === ZEELAND - BROUWERSDAM ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.8500, 51.7500],
          [3.8600, 51.7450],
          [3.8700, 51.7400]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Brouwersdam (Noordzeezijde)',
        regio: 'Zeeland',
        beschrijving: 'Vissen aan Noordzeezijde met goede strekdammen.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Zeebaars', 'Platvis', 'Geep'],
          winter: ['Wijting', 'Gul']
        },
        tips: 'Noordzeezijde andere vissen dan Grevelingenmeer.',
        bereikbaarheid: 'Goede parkeerplaatsen langs de dam'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.8450, 51.7550],
          [3.8350, 51.7580],
          [3.8250, 51.7610]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Brouwersdam (sluizen)',
        regio: 'Zeeland',
        beschrijving: 'Haringvissen bij de sluizen, vooral in april.',
        parkeren: 'Gratis',
        beerkanaal: false,
        vissoorten: {
          voorjaar: ['Haring'],
          zomer: ['Zeebaars', 'Harder'],
          winter: ['Wijting']
        },
        tips: 'April is topmaand voor haring bij de sluizen.',
        bereikbaarheid: 'Parkeren bij sluizen'
      }
    },

    // === ZEELAND - RENESSE / SCHARENDIJKE ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.7400, 51.7280],
          [3.7500, 51.7250],
          [3.7600, 51.7220]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Strand Renesse - Westenschouwen',
        regio: 'Zeeland',
        beschrijving: 'Uitgestrekt strandgebied met goede vismogelijkheden.',
        parkeren: 'Betaald (seizoen)',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Platvis', 'Makreel', 'Geep'],
          winter: ['Gul', 'Wijting']
        },
        tips: 'Seizoensmatig ook paling mogelijk.',
        bereikbaarheid: 'Diverse strandopgangen'
      }
    },

    // === WIJK AAN ZEE / ZANDVOORT ===
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.5950, 52.4950],
          [4.6000, 52.4900],
          [4.6050, 52.4850]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Strand Wijk aan Zee',
        regio: 'Noord-Holland',
        beschrijving: 'Rustig strand met goede vismogelijkheden. Minder druk dan IJmuiden.',
        parkeren: 'Betaald',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Bot', 'Tong', 'Zeebaars'],
          winter: ['Gul', 'Wijting', 'Schar']
        },
        tips: 'Vooral bot en schar hier. Rustige locatie.',
        bereikbaarheid: 'Parkeren bij strandpaviljoen'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.5200, 52.3800],
          [4.5250, 52.3750],
          [4.5300, 52.3700]
        ]
      },
      properties: {
        layerType: 'zeevisstek',
        name: 'Strand Zandvoort',
        regio: 'Noord-Holland',
        beschrijving: 'Populair strand met vismogelijkheden. Let op drukte in het seizoen.',
        parkeren: 'Betaald',
        beerkanaal: false,
        vissoorten: {
          zomer: ['Bot', 'Tong', 'Harder'],
          winter: ['Wijting', 'Schar']
        },
        tips: 'Beste buiten het badseizoen. Vroege ochtend of late avond.',
        bereikbaarheid: 'Goede bereikbaarheid, veel parkeerplaatsen'
      }
    }
  ]
}

export async function createZeevisstekkenLayer(): Promise<VectorLayer<VectorSource>> {
  const source = new VectorSource()

  const layer = new VectorLayer({
    source,
    style: createZeevisstekStyle(),
    properties: {
      title: 'Zeevisstekken',
      name: 'Zeevisstekken'
    }
  })

  try {
    source.addFeatures(
      new GeoJSON().readFeatures(ZEEVISSTEKKEN_DATA, {
        featureProjection: 'EPSG:3857'
      })
    )
    console.log(`Loaded ${ZEEVISSTEKKEN_DATA.features.length} zeevisstekken`)
  } catch (error) {
    console.error('Failed to load zeevisstekken:', error)
  }

  return layer
}
