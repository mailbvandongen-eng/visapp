# VisApp NL - Sessienotities

## Huidige versie: 1.1.0

---

## ⚠️ VERSIE BUMP CHECKLIST - ALTIJD VOLGEN! ⚠️

Bij elke code wijziging **ALTIJD** deze 4 plekken updaten:

| # | Bestand | Wat updaten |
|---|---------|-------------|
| 1 | Terminal | `npm version patch` (of minor/major) |
| 2 | `src/main.tsx` | `const VERSION = 'X.X.X'` |
| 3 | `src/components/UI/HamburgerMenu.tsx` | `VisApp NL vX.X.X` (footer) |
| 4 | `src/components/UI/InfoButton.tsx` | Versie in info modal |

**Na bump:** `npm run build` → commit → push → test live site!

**NOOIT VRAGEN - GEWOON DOEN!**

---

## 📱 App Features

- Kaart met aanlegsteigers, boothellingen, dieptekaart, viswater
- GPS tracking en locatie
- Vangst registratie met vissoorten
- Favoriete plekken opslaan
- Weer widget met wind en temperatuur
- Presets voor snelle laag selectie
- Wachtwoordbeveiliging (visvriend2024)
- Google login
- Long press menu (vangst toevoegen, streetview, google maps)

### URLs:
- **Live:** https://mailbvandongen-eng.github.io/visapp/
- **Dev:** http://localhost:3004/visapp/

### Firebase:
- Project: `visapp-nl`
- Auth: Google Sign-In
- Authorized domain: `mailbvandongen-eng.github.io`
