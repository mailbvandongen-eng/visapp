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
import { FishingWidget } from './components/Weather/FishingWidget'
import { AddCatchButton } from './components/Catch/AddCatchButton'
import { CatchMarkers } from './components/Catch/CatchMarkers'
import { SpotMarkers } from './components/Spots/SpotMarkers'
import { AddSpotForm } from './components/Spots/AddSpotForm'
import { LayerPanel } from './components/UI/LayerPanel'
import { SettingsPanel } from './components/UI/SettingsPanel'
import { Popup } from './components/Map/Popup'
import { PasswordGate } from './components/Auth/PasswordGate'
import { GooglePhotosButton, GooglePhotoMarkers, PhotoActionDialog } from './components/GooglePhotos'
import { useUIStore, useSettingsStore } from './store'

function App() {
  const spotFormOpen = useUIStore(state => state.spotFormOpen)
  const spotFormLocation = useUIStore(state => state.spotFormLocation)
  const closeSpotForm = useUIStore(state => state.closeSpotForm)

  // Get font scale setting (80-150%)
  const fontScale = useSettingsStore(state => state.fontScale)
  // Base size is 14px, scale it based on setting
  const baseFontSize = 14 * fontScale / 100

  return (
    <PasswordGate>
      <div className="h-screen w-screen overflow-hidden" style={{ fontSize: `${baseFontSize}px` }}>
        <MapContainer />
        <GpsMarker />
        <CatchMarkers />
        <GooglePhotoMarkers />
        <SpotMarkers />
        <Popup />
        <LongPressMenu />

        {/* Top bar: Weather (left), Search & Menu (right) */}
        <FishingWidget />
        <SearchBox />
        <HamburgerMenu />

        {/* Bottom bar: Presets & Reset (left), Layers & Catch & GPS (right) */}
        <PresetButtons />
        <ResetButton />
        <GooglePhotosButton />
        <LayerPanel />
        <AddCatchButton />
        <GpsButton />

        {/* Modals */}
        <InfoButton />
        <SettingsPanel />
        <PhotoActionDialog />
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
