# Google Photos Integratie Stappenplan

## Samenvatting

Dit document beschrijft de volledige reis van het integreren van Google Photos in een web-applicatie, inclusief alle problemen die we tegenkwamen en hoe we die hebben opgelost.

**Belangrijkste conclusie:** De oude Google Photos Library API scopes (`photoslibrary`, `photoslibrary.readonly`, `photoslibrary.sharing`) zijn **per 31 maart 2025 verwijderd** door Google. Je MOET nu de nieuwe **Google Photos Picker API** gebruiken om foto's uit de bibliotheek van gebruikers te selecteren.

---

## Deel 1: Wat We Hebben Gedaan

### 1.1 Oorspronkelijke Aanpak (WERKT NIET MEER)

We begonnen met de Google Photos Library API:

```typescript
// OUDE CODE - WERKT NIET MEER
const SCOPES = 'https://www.googleapis.com/auth/photoslibrary.readonly';

// Albums ophalen
const response = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
  headers: { Authorization: `Bearer ${accessToken}` }
});

// Media items ophalen
const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

**Resultaat:** 403 PERMISSION_DENIED - "Request had insufficient authentication scopes"

### 1.2 Nieuwe Aanpak: Google Photos Picker API

Na onderzoek bleek dat Google de Library API scopes heeft verwijderd. De nieuwe aanpak is de **Picker API**:

```typescript
// NIEUWE CODE - WERKT WEL
const SCOPES = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';
const PICKER_API_BASE = 'https://photospicker.googleapis.com/v1';
```

---

## Deel 2: Specifieke Problemen en Oplossingen

### Probleem 1: 403 PERMISSION_DENIED

**Foutmelding:**
```json
{
  "error": {
    "code": 403,
    "message": "Request had insufficient authentication scopes.",
    "status": "PERMISSION_DENIED"
  }
}
```

**Wat we probeerden (werkte niet):**
- Scope wijzigen van `photoslibrary` naar `photoslibrary.readonly`
- OAuth consent screen scopes toevoegen
- Test users toevoegen
- App publiceren naar Production mode
- Nieuwe OAuth Client ID aanmaken
- Photos Library API uit- en weer inschakelen

**Oorzaak:** Google heeft per 31 maart 2025 de volgende scopes verwijderd:
- `https://www.googleapis.com/auth/photoslibrary`
- `https://www.googleapis.com/auth/photoslibrary.readonly`
- `https://www.googleapis.com/auth/photoslibrary.sharing`

**Oplossing:** Migreren naar de Google Photos Picker API

### Probleem 2: Token had correcte scope maar API weigerde

We valideerden de token via Google's tokeninfo endpoint:

```typescript
const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
const data = await response.json();
console.log('Token scopes:', data.scope);
// Output: "https://www.googleapis.com/auth/photoslibrary.readonly"
```

De token HAD de correcte scope, maar de API accepteerde het niet meer omdat de scope was verwijderd aan de server-kant.

### Probleem 3: OAuth consent screen niet-geverifieerde scopes

In de Google Cloud Console zagen we bij de scopes een oranje waarschuwingsdriehoek met "this scope is not yet verified". Dit was een indicatie dat de scopes problematisch waren.

---

## Deel 3: Huidige Werkende Implementatie

### 3.1 Authenticatie Methode

**OAuth 2.0 Implicit Flow** voor client-side web applicaties:

```typescript
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';
const REDIRECT_URI = window.location.origin;

function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'token',
    scope: SCOPES,
    include_granted_scopes: 'true',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
```

### 3.2 Picker API Flow

De Picker API werkt fundamenteel anders dan de oude Library API:

```
1. Gebruiker logt in via OAuth
2. App maakt een "session" aan via POST /v1/sessions
3. App opent de pickerUri in een nieuw venster
4. Gebruiker selecteert foto's in de Google Photos interface
5. App pollt de session totdat mediaItemsSet = true
6. App haalt geselecteerde items op via GET /v1/mediaItems
7. App verwijdert de session via DELETE /v1/sessions/{id}
```

### 3.3 Volledige Service Code

```typescript
const PICKER_API_BASE = 'https://photospicker.googleapis.com/v1';

export interface PickerSession {
  id: string;
  pickerUri: string;
  pollingConfig?: {
    pollInterval: string;
    timeoutIn: string;
  };
  mediaItemsSet?: boolean;
}

export interface PickerMediaItem {
  id: string;
  baseUrl: string;
  mimeType: string;
  mediaFile: {
    filename: string;
    mimeType: string;
    baseUrl: string;
  };
}

// 1. Maak een picker session
async function createSession(accessToken: string): Promise<PickerSession> {
  const response = await fetch(`${PICKER_API_BASE}/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.status}`);
  }

  return response.json();
}

// 2. Open de picker (in nieuw venster, GEEN iframe!)
function openPicker(pickerUri: string): Window | null {
  // /autoclose zorgt dat het venster automatisch sluit na selectie
  const url = pickerUri + '/autoclose';
  return window.open(url, 'google-photos-picker', 'width=800,height=600');
}

// 3. Poll de session
async function pollSession(accessToken: string, sessionId: string): Promise<PickerSession> {
  const response = await fetch(`${PICKER_API_BASE}/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.json();
}

// 4. Haal geselecteerde items op
async function getSelectedMediaItems(accessToken: string, sessionId: string): Promise<PickerMediaItem[]> {
  const items: PickerMediaItem[] = [];
  let pageToken = '';

  do {
    const url = new URL(`${PICKER_API_BASE}/mediaItems`);
    url.searchParams.set('sessionId', sessionId);
    url.searchParams.set('pageSize', '100');
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (data.mediaItems) {
      items.push(...data.mediaItems);
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return items;
}

// 5. Verwijder de session
async function deleteSession(accessToken: string, sessionId: string): Promise<void> {
  await fetch(`${PICKER_API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
```

---

## Deel 4: Google Cloud Console Configuratie

### 4.1 Vereiste APIs

Je moet de volgende API inschakelen:
- **Photos Picker API** (NIET de oude "Photos Library API")

Ga naar: APIs & Services → Library → Zoek "Photos Picker API" → Enable

### 4.2 OAuth Consent Screen

1. Ga naar APIs & Services → OAuth consent screen
2. User Type: External (of Internal voor Workspace)
3. Voeg de scope toe: `https://www.googleapis.com/auth/photospicker.mediaitems.readonly`
4. Voeg test users toe (als in Testing mode)

### 4.3 OAuth Client ID

1. Ga naar APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Application type: Web application
4. Authorized JavaScript origins: `http://localhost:5173` (en productie URL)
5. Authorized redirect URIs: `http://localhost:5173` (en productie URL)

### 4.4 Testing vs Production Mode

- **Testing mode:** Alleen test users kunnen inloggen. Geen Google verificatie nodig.
- **Production mode:** Iedereen kan inloggen, maar je ziet "Google has not verified this app" waarschuwing totdat je app is geverifieerd.

---

## Deel 5: Base URL vs Download URL

### 5.1 Base URL Structuur

De Picker API retourneert een `baseUrl` voor elke foto:

```json
{
  "mediaFile": {
    "baseUrl": "https://lh3.googleusercontent.com/...",
    "filename": "IMG_1234.jpg",
    "mimeType": "image/jpeg"
  }
}
```

### 5.2 URL Parameters voor Afbeeldingen

De baseUrl moet worden aangevuld met parameters:

```typescript
// Thumbnail (vierkant, gecropped)
function getThumbnailUrl(baseUrl: string, size = 300): string {
  return `${baseUrl}=w${size}-h${size}-c`;
}

// Volledige foto met specifieke afmetingen
function getPhotoUrl(baseUrl: string, width = 800, height = 600): string {
  return `${baseUrl}=w${width}-h${height}`;
}

// Download origineel (maximale kwaliteit)
function getDownloadUrl(baseUrl: string): string {
  return `${baseUrl}=d`;
}
```

**Beschikbare parameters:**
- `w{width}` - breedte in pixels
- `h{height}` - hoogte in pixels
- `c` - crop naar vierkant
- `d` - download origineel bestand
- `s{size}` - max dimensie (langste zijde)

### 5.3 Tijdelijke URLs - BELANGRIJK!

**Base URLs zijn slechts 60 minuten geldig!**

Na 60 minuten moet je een nieuwe session maken en de items opnieuw ophalen om verse URLs te krijgen. Dit betekent:

1. **NIET cachen** van baseUrls voor lange termijn
2. **WEL opslaan** van de media item ID (`item.id`)
3. Bij weergave: controleer of URL nog geldig is, zo niet: nieuwe session maken

```typescript
// Sla alleen het ID op, niet de URL
const photoToSave = {
  id: `google-${item.id}`,
  googleId: item.id,  // Bewaar dit voor later ophalen
  // NIET: url: item.mediaFile.baseUrl (verloopt na 60 min!)
};
```

---

## Deel 6: Belangrijke Verschillen met Oude API

| Aspect | Oude Library API | Nieuwe Picker API |
|--------|------------------|-------------------|
| Scope | `photoslibrary.readonly` | `photospicker.mediaitems.readonly` |
| Endpoint | `photoslibrary.googleapis.com` | `photospicker.googleapis.com` |
| Toegang | Hele bibliotheek | Alleen geselecteerde foto's |
| Albums browsen | Ja | Nee (gebruiker selecteert zelf) |
| UI | Eigen UI bouwen | Google's picker UI |
| Iframe | Mogelijk | **NIET** mogelijk |

---

## Deel 7: Rate Limiting en Quota

### 7.1 Picker API Quota

- **Sessions create:** Gelimiteerd per gebruiker per dag
- **Polling:** Gebruik het `pollInterval` uit de session response (meestal 3-5 seconden)
- **MediaItems list:** Standaard paginering, max 100 items per request

### 7.2 Best Practices

```typescript
// Respecteer het poll interval uit de API response
const pollInterval = session.pollingConfig?.pollInterval
  ? parseInt(session.pollingConfig.pollInterval) * 1000
  : 5000; // Default 5 seconden

// Gebruik paginering voor grote selecties
let pageToken = '';
do {
  const url = new URL(`${PICKER_API_BASE}/mediaItems`);
  url.searchParams.set('pageSize', '100'); // Max 100
  if (pageToken) url.searchParams.set('pageToken', pageToken);
  // ...
} while (pageToken);
```

---

## Deel 8: Huidige Status en Openstaand Probleem

### Wat werkt:
- OAuth authenticatie met nieuwe scope
- Session aanmaken
- Picker openen in nieuw venster
- Gebruiker kan foto's selecteren

### Openstaand probleem:
De geselecteerde foto's worden niet weergegeven na selectie. Dit kan liggen aan:
1. Polling detecteert niet correct wanneer `mediaItemsSet` true wordt
2. Het venster sluit voordat de selectie is bevestigd
3. De mediaItems response structuur is anders dan verwacht

### Debug stappen:
1. Controleer console logs voor "Poll session response:"
2. Verifieer dat `mediaItemsSet: true` wordt geretourneerd
3. Controleer de structuur van de mediaItems response

---

## Deel 9: Checklist voor Nieuwe Implementatie

- [ ] Photos Picker API inschakelen in Google Cloud Console
- [ ] OAuth consent screen configureren met `photospicker.mediaitems.readonly` scope
- [ ] OAuth Client ID aanmaken met correcte origins en redirect URIs
- [ ] Test user toevoegen (als in Testing mode)
- [ ] Scope in code: `https://www.googleapis.com/auth/photospicker.mediaitems.readonly`
- [ ] API endpoint: `https://photospicker.googleapis.com/v1`
- [ ] Session flow implementeren (create → open picker → poll → get items → delete)
- [ ] Picker openen in nieuw venster (NIET iframe)
- [ ] Poll interval respecteren uit session response
- [ ] Base URLs behandelen als tijdelijk (60 min geldig)
- [ ] Media item IDs opslaan voor lange-termijn referentie

---

## Deel 10: Nuttige Links

- [Google Photos Picker API Documentatie](https://developers.google.com/photos/picker/guides/get-started-picker)
- [API Reference](https://developers.google.com/photos/picker/reference/rest)
- [Authorization Scopes](https://developers.google.com/photos/overview/authorization)
- [Updates en Migratie Info](https://developers.google.com/photos/support/updates)
- [OAuth 2.0 Scopes voor Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes)

---

*Document gegenereerd op: 22 januari 2026*
*Getest met: Vite + React + TypeScript*
