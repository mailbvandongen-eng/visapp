# VisApp NL - Sessienotities

## Huidige versie: 1.2.3

---

## ⚠️ VERSIE BUMP CHECKLIST - ALTIJD VOLGEN! ⚠️

Bij elke code wijziging **ALTIJD** deze stappen uitvoeren:

### Versienummering:
- **Patch:** 1.1.0 → 1.1.1 → 1.1.2 → ... → 1.1.9 → 1.2.0
- **Minor:** Na 9 patches of nieuwe features
- **Major:** Breaking changes

### Update op 4 plekken:

| # | Bestand | Wat updaten |
|---|---------|-------------|
| 1 | Terminal | `npm version patch` (of minor/major) |
| 2 | `src/main.tsx` | Importeert automatisch uit package.json |
| 3 | `src/components/UI/HamburgerMenu.tsx` | `VisApp NL vX.X.X` (footer) |
| 4 | `src/components/UI/InfoButton.tsx` | Versie in header + footer |

### Workflow:
1. Code wijzigingen maken
2. **LOKAAL TESTEN:** `npm run dev` → test op localhost
3. Versie bump: `npm version patch`
4. Update versie in HamburgerMenu.tsx en InfoButton.tsx
5. Build: `npm run build`
6. Commit & Push: `git add -A && git commit -m "vX.X.X: beschrijving" && git push`
7. Test live site

**NOOIT VRAGEN - ALTIJD DOEN!**

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
