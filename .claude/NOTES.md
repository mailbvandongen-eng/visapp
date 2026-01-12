# VisApp NL - Sessienotities

## Huidige versie: 1.2.30

---

## ⚠️ VERSIE BUMP CHECKLIST - ALTIJD VOLGEN! ⚠️

Bij elke code wijziging **ALTIJD** deze stappen:

| # | Commando | Wat gebeurt |
|---|----------|-------------|
| 1 | `npm version patch` | package.json versie +1 |
| 2 | `npm run build` | Productie build naar /docs |
| 3 | `git add -A && git commit` | Commit met beschrijving |
| 4 | `git push` | Push naar GitHub Pages |

**Test na bump:** App openen op telefoon/browser!

---

## ⚠️ UI STYLING REGELS - STRICT VOLGEN! ⚠️

### Icon Buttons (ONZICHTBAAR - alleen icoon)
```tsx
className="p-1.5 border-0 outline-none bg-transparent text-{color}-500 hover:text-{color}-600 transition-colors"
```

### Zichtbare Knoppen (met achtergrond)
```tsx
className="bg-white/80 hover:bg-white/90 rounded-xl shadow-sm backdrop-blur-sm"
```

### Panel Headers (blauw gradient)
```tsx
className="bg-gradient-to-r from-blue-500 to-blue-600"
```

---

## ⚠️ PANEL EXCLUSIVITEIT - ALTIJD VOLGEN! ⚠️

**Panels mogen NOOIT overlappen!**

Bij toggle van een panel, sluit ALLE andere panels eerst:
```typescript
toggleLayerPanel: () => {
  set(state => {
    const wasOpen = state.layerPanelOpen
    // Close ALL panels first
    state.layerPanelOpen = false
    state.settingsPanelOpen = false
    state.infoPanelOpen = false
    state.weatherPanelOpen = false
    if (!wasOpen) state.layerPanelOpen = true
  })
}
```

---

## 🎨 POPUP STYLING STANDAARD

### Titel/Header (bold, donkere kleur)
```html
<strong class="text-{color}-800">Titel</strong>
```

### Type/Categorie label
```html
<br/><span class="text-sm text-{color}-700">Type label</span>
```

### Kleurcodes per laag:
- **Aanlegsteigers**: blue-800
- **Boothellingen**: green-800
- **Viswater**: purple-800
- **AHN4 Hillshade**: amber-800

---

## 📱 TEKSTGROOTTE SYSTEEM

**fontScale wordt toegepast op root div in App.tsx:**
```tsx
const fontScale = useSettingsStore(state => state.fontScale)
const baseFontSize = 14 * fontScale / 100

return (
  <div style={{ fontSize: `${baseFontSize}px` }}>
    {/* Alle componenten erven deze fontsize */}
  </div>
)
```

**Range:** 80% - 150%
**Default:** 100%

---

## 🗺️ KAARTLAGEN

### Basis achtergronden:
| Naam | Bron |
|------|------|
| Terrein | OpenTopoMap |
| OpenStreetMap | OSM |
| Luchtfoto | PDOK |

### Overlay lagen:
| Naam | Bron |
|------|------|
| Aanlegsteigers | OSM Overpass |
| Boothellingen | OSM Overpass |
| Dieptekaart | PDOK RWS WMS |
| Viswater | OSM Overpass |
| AHN4 Hillshade | Esri NL ArcGIS |

---

## 📱 MOEDERAPP REFERENTIE

**DetectorApp-NL is de moederapp.**

Neem styling, structuur en patterns over waar mogelijk.
Zie `C:\VSCode\detectorapp-nl\.claude\notes.md` voor volledige documentatie.
