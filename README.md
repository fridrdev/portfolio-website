# Frider Dev – Portfolio + Proxmox PoC API

Professioneel portfolio gebouwd met React 18 + Vite + Tailwind CSS,
inclusief een Flask API voor het Proxmox Multi-Site PoC project.

---

## Projectstructuur

```
/
├── src/                        # React portfolio broncode
│   ├── projects/vrt/           # VRT Distributed Tracing project
│   └── ...
├── public/
│   ├── favicon.svg
│   └── grafana-dashboard.png   # Grafana screenshot (dashboard tab)
├── api/
│   ├── app.py                  # Flask API – Proxmox PoC
│   └── requirements.txt        # Python dependencies
├── vite.config.js
├── netlify.toml                # Netlify deploy config + API proxy
├── vercel.json                 # Vercel deploy config + API proxy
└── package.json
```

---

## 1 – Portfolio website lokaal starten

### Vereisten
- Node.js 18+
- npm

### Installatie & start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

### Productie build

```bash
npm run build
npm run preview    # preview op http://localhost:4173
```

---

## 2 – Flask API lokaal starten

### Vereisten
- Python 3.9+
- Proxmox VE nodes bereikbaar op `192.168.99.10` en `192.168.99.11`

### Installatie & start

```bash
cd api
pip install -r requirements.txt
python app.py
```

API draait op `http://localhost:5000`

### Endpoints

| Endpoint | Beschrijving |
|----------|-------------|
| `GET /` | API info en beschikbare endpoints |
| `GET /status` | Status van beide Proxmox nodes + aantal VMs |
| `GET /migrate/to-bxl` | Live migratie VM 100 → pve-bxl-01 |
| `GET /migrate/to-ny` | Live migratie VM 100 → pve-ny-01 |
| `GET /ping` | Ping tussen beide sites |
| `GET /latency` | Latentie management, VPN tunnel, internet |

---

## 3 – Deploy portfolio op Netlify

1. Push naar GitHub
2. Ga naar [netlify.com](https://netlify.com) → **Add new site** → importeer repo
3. Stel in:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Klik **Deploy** — de `netlify.toml` regelt automatisch de API proxy rewrites

---

## 4 – Deploy portfolio op Vercel

1. Push naar GitHub
2. Ga naar [vercel.com](https://vercel.com) → **Add New Project** → importeer repo
3. Klik **Deploy** — de `vercel.json` regelt automatisch de API proxy rewrites

---

## 5 – Een nieuw project toevoegen aan het portfolio

1. Voeg een object toe aan `src/projects.config.js`
2. Maak `src/projects/<slug>/<Naam>Project.jsx` aan
3. Registreer de lazy import in `src/pages/ProjectPage.jsx`

De projectkaart verschijnt automatisch op de hoofdpagina.

---

## API proxy (CORS)

Alle fetch-calls gaan via `/api/...` — geen directe AWS URL's in de code.

| Omgeving | Proxy via |
|----------|-----------|
| `npm run dev` | `vite.config.js` server proxy |
| Netlify | `netlify.toml` redirects |
| Vercel | `vercel.json` rewrites |
