import { useState } from 'react'
import { Info, X, FileText, BookOpen, Map, Navigation, Fish, Cloud, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../store'

type TabType = 'info' | 'functies' | 'handleiding'

export function InfoButton() {
  const { infoPanelOpen, toggleInfoPanel } = useUIStore()
  const [activeTab, setActiveTab] = useState<TabType>('info')

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: 'Info', icon: <Info size={14} /> },
    { id: 'functies', label: 'Functies', icon: <FileText size={14} /> },
    { id: 'handleiding', label: 'Handleiding', icon: <BookOpen size={14} /> }
  ]

  return (
    <AnimatePresence>
      {infoPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[1600] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleInfoPanel}
          />

          {/* Modal Content */}
          <motion.div
            className="fixed inset-4 z-[1601] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-w-lg mx-auto my-auto max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header - orange bg, white text */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600">
              <span className="font-medium text-white">VisApp NL v1.2.5</span>
              <button
                onClick={toggleInfoPanel}
                className="p-1 rounded bg-orange-400/50 hover:bg-orange-400 transition-colors border-0 outline-none"
              >
                <X size={18} className="text-white" strokeWidth={2.5} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-0 outline-none ${
                    activeTab === tab.id
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
              {activeTab === 'info' && <InfoTab />}
              {activeTab === 'functies' && <FunctiesTab />}
              {activeTab === 'handleiding' && <HandleidingTab />}

              {/* Version Footer */}
              <section className="pt-2 border-t border-gray-200 space-y-2">
                <p className="text-xs text-gray-400 text-center">
                  VisApp NL v1.2.5 - Voor jou en je vismaat
                </p>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function InfoTab() {
  return (
    <>
      <section>
        <h3 className="font-semibold text-gray-800 mb-2">Over deze app</h3>
        <p className="text-gray-600">
          VisApp NL is dé gratis kaartapplicatie voor sportvissers in Nederland.
          Met aanlegsteigers, boothellingen, dieptekaarten en viswater grenzen.
          Registreer je vangsten, markeer favoriete plekken en deel met je vismaat.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-gray-800 mb-2">Databronnen</h3>
        <ul className="space-y-2 text-gray-600">
          <li>
            <strong>OpenStreetMap</strong> (ODbL)
            <br />
            <span className="text-xs">Aanlegsteigers, boothellingen, viswater gebieden</span>
          </li>
          <li>
            <strong>PDOK / Rijkswaterstaat</strong> (CC0/CC-BY)
            <br />
            <span className="text-xs">Dieptekaarten, locatieserver</span>
          </li>
          <li>
            <strong>Open-Meteo</strong> (CC-BY)
            <br />
            <span className="text-xs">Weergegevens en windinfo</span>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-gray-800 mb-2">Privacy</h3>
        <div className="text-gray-600 space-y-2">
          <p>
            <strong>Lokale opslag:</strong> Je vangsten en favoriete plekken worden lokaal op je apparaat opgeslagen.
          </p>
          <p>
            <strong>GPS:</strong> Je locatie wordt alleen gebruikt om je positie op de kaart te tonen en wordt niet gedeeld.
          </p>
        </div>
      </section>
    </>
  )
}

function FunctiesTab() {
  return (
    <>
      <section>
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Map size={16} className="text-blue-600" />
          Kaartlagen
        </h3>
        <ul className="text-gray-600 space-y-1 text-xs">
          <li><strong>Achtergrond:</strong> CartoDB, OpenStreetMap, Luchtfoto</li>
          <li><strong>Aanlegsteigers:</strong> Marina's en aanmeerplekken</li>
          <li><strong>Boothellingen:</strong> Plekken om je boot te water te laten</li>
          <li><strong>Dieptekaart:</strong> Waterdiepte informatie</li>
          <li><strong>Viswater:</strong> Grenzen van viswater gebieden</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Fish size={16} className="text-green-600" />
          Vangst Registratie
        </h3>
        <ul className="text-gray-600 space-y-1 text-xs">
          <li>Registreer soort, gewicht en lengte</li>
          <li>Vismethode en aas bijhouden</li>
          <li>Weergegevens automatisch opgeslagen</li>
          <li>GPS locatie per vangst</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <MapPin size={16} className="text-orange-600" />
          Favoriete Plekken
        </h3>
        <ul className="text-gray-600 space-y-1 text-xs">
          <li>Markeer je beste visplekken</li>
          <li>Voeg notities en ratings toe</li>
          <li>Welke vis zit waar?</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Cloud size={16} className="text-cyan-600" />
          Weer & Wind
        </h3>
        <ul className="text-gray-600 space-y-1 text-xs">
          <li>Live weergegevens op je locatie</li>
          <li>Windsnelheid en richting</li>
          <li>Luchtdruk</li>
          <li>Visvriendelijkheid indicator</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Navigation size={16} className="text-blue-600" />
          GPS & Navigatie
        </h3>
        <ul className="text-gray-600 space-y-1 text-xs">
          <li>Live GPS tracking</li>
          <li>Zoek adressen en plaatsen</li>
          <li>Open locatie in Google Maps</li>
        </ul>
      </section>
    </>
  )
}

function HandleidingTab() {
  return (
    <>
      <section>
        <h3 className="font-semibold text-gray-800 mb-2">Eerste stappen</h3>
        <ol className="text-gray-600 space-y-2 text-xs list-decimal list-inside">
          <li>Tik op de <strong>GPS knop</strong> (rechtsonder, blauw) om je locatie te zien</li>
          <li>Gebruik het <strong>lagen paneel</strong> (linksonder) om kaartlagen aan te zetten</li>
          <li>Tik op de <strong>groene vis knop</strong> om een vangst te registreren</li>
        </ol>
      </section>

      <section>
        <h3 className="font-semibold text-gray-800 mb-2">Vangst registreren</h3>
        <div className="text-gray-600 space-y-2 text-xs">
          <p><strong>Via GPS:</strong> Tik op de groene vis knop. Je locatie wordt automatisch ingevuld.</p>
          <p><strong>Vul in:</strong> Vissoort (verplicht), gewicht, lengte, methode en aas.</p>
          <p><strong>Weer:</strong> Weergegevens worden automatisch toegevoegd als GPS actief is.</p>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-gray-800 mb-2">Kaartlagen gebruiken</h3>
        <div className="text-gray-600 space-y-2 text-xs">
          <p><strong>Lagen paneel:</strong> Linksonder op de kaart.</p>
          <p><strong>Achtergrond:</strong> Kies tussen kaart, OSM of satelliet.</p>
          <p><strong>Overlays:</strong> Zet aanlegsteigers, boothellingen, diepte of viswater aan.</p>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-gray-800 mb-2">Zoeken</h3>
        <div className="text-gray-600 space-y-2 text-xs">
          <p><strong>Zoekknop:</strong> Rechtsboven naast het menu.</p>
          <p><strong>Zoek:</strong> Type een adres of plaatsnaam.</p>
          <p><strong>Navigeer:</strong> Tik op het pijltje om in Google Maps te openen.</p>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-gray-800 mb-2">Tips voor vissen</h3>
        <ul className="text-gray-600 space-y-1 text-xs list-disc list-inside">
          <li>Gebruik de <strong>dieptekaart</strong> om diepe plekken te vinden</li>
          <li>Check de <strong>weer widget</strong> voor visvriendelijke omstandigheden</li>
          <li>Lage luchtdruk en bewolkt weer = vaak beter bijten!</li>
          <li>Markeer succesvolle plekken als <strong>favoriet</strong></li>
        </ul>
      </section>
    </>
  )
}
