import './style.css'
import { AnimatePresence } from 'framer-motion'
import { MapContainer } from './components/Map/MapContainer'
import { LongPressMenu } from './components/Map/LongPressMenu'
import { GpsButton } from './components/GPS/GpsButton'
import { GpsMarker } from './components/GPS/GpsMarker'
import { SearchBox } from './components/UI/SearchBox'
import { HamburgerMenu } from './components/UI/HamburgerMenu'
import { InfoButton } from './components/UI/InfoButton'
import { ResetButton } from './components/UI/ResetButton'
import { PresetButtons } from './components/UI/PresetButtons'
import { WeatherWidget } from './components/Weather/WeatherWidget'
import { WindIndicator } from './components/Weather/WindIndicator'
import { TideWidget } from './components/Weather/TideWidget'
import { ForecastSlider } from './components/Weather/ForecastSlider'
import { AddCatchButton } from './components/Catch/AddCatchButton'
import { CatchMarkers } from './components/Catch/CatchMarkers'
import { SpotMarkers } from './components/Spots/SpotMarkers'
import { AddSpotForm } from './components/Spots/AddSpotForm'
import { LayerPanel } from './components/UI/LayerPanel'
import { SettingsPanel } from './components/UI/SettingsPanel'
import { PasswordGate } from './components/Auth/PasswordGate'
import { useUIStore } from './store'

function App() {
  const spotFormOpen = useUIStore(state => state.spotFormOpen)
  const spotFormLocation = useUIStore(state => state.spotFormLocation)
  const closeSpotForm = useUIStore(state => state.closeSpotForm)

  return (
    <PasswordGate>
      <div className="h-screen w-screen overflow-hidden">
        <MapContainer />
        <GpsMarker />
        <CatchMarkers />
        <SpotMarkers />
        <LongPressMenu />

        {/* Top bar: Weather (left), Search & Menu (right) */}
        <WeatherWidget />
        <WindIndicator />
        <TideWidget />
        <ForecastSlider />
        <SearchBox />
        <HamburgerMenu />

        {/* Bottom bar: Presets & Reset (left), Layers & Catch & GPS (right) */}
        <PresetButtons />
        <ResetButton />
        <LayerPanel />
        <AddCatchButton />
        <GpsButton />

        {/* Modals */}
        <InfoButton />
        <SettingsPanel />
        <AnimatePresence>
          {spotFormOpen && (
            <AddSpotForm
              onClose={closeSpotForm}
              initialLocation={spotFormLocation || undefined}
            />
          )}
        </AnimatePresence>
      </div>
    </PasswordGate>
  )
}

export default App
