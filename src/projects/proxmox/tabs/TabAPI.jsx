import { useState } from 'react'

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function MethodBadge({ method }) {
  const cls = {
    GET:    'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    POST:   'bg-blue-900/40 text-blue-400 border-blue-700/50',
    DELETE: 'bg-red-900/40 text-red-400 border-red-700/50',
  }[method] ?? 'bg-gray-800 text-gray-400 border-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border font-mono ${cls}`}>
      {method}
    </span>
  )
}

function EndpointRow({ method, path, description, response }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#2D3148]/60 last:border-0">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1A1D27]/60 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <MethodBadge method={method} />
        <code className="text-sm text-white font-mono flex-1">{path}</code>
        <span className="text-xs text-gray-500 hidden sm:block">{description}</span>
        <svg
          className={`h-4 w-4 text-gray-600 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          <p className="text-xs text-gray-400 sm:hidden">{description}</p>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">Response</p>
          <pre className="text-xs text-emerald-300 bg-[#0F1117] rounded-lg p-3 overflow-x-auto border border-[#2D3148]">
            {response}
          </pre>
        </div>
      )}
    </div>
  )
}

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="rounded-xl border border-[#2D3148] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#12151F] border-b border-[#2D3148]">
        <span className="text-xs text-gray-500 font-mono">{lang}</span>
        <button
          onClick={copy}
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          {copied ? '✅ Gekopieerd' : '📋 Kopieer'}
        </button>
      </div>
      <pre className="text-xs text-gray-300 bg-[#0F1117] p-4 overflow-x-auto font-mono leading-relaxed">
        {code}
      </pre>
    </div>
  )
}

/* ─── Main ─────────────────────────────────────────────────────────────────── */
export default function TabAPI() {
  return (
    <div className="flex flex-col gap-8">

      {/* Header info */}
      <section className="rounded-xl border border-[#2D3148] bg-[#12151F] p-5 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <p className="text-sm font-semibold text-white">Proxmox Multi-Site PoC API</p>
            <p className="text-xs text-gray-500 mt-0.5">Python Flask · proxmoxer · CORS enabled</p>
          </div>
          <div className="ml-auto flex gap-2 text-xs">
            <span className="rounded border border-[#2D3148] px-2 py-1 text-gray-400 font-mono">v1.0.0</span>
            <span className="rounded border border-emerald-700/50 bg-emerald-900/20 px-2 py-1 text-emerald-400">● Live</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 w-20">Lokaal:</span>
            <span className="text-blue-300">http://localhost:5000</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 w-20">Productie:</span>
            <span className="text-blue-300">https://api.fridrdev.uk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 w-20">Via proxy:</span>
            <span className="text-blue-300">/api/*  →  api.fridrdev.uk</span>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Endpoints</h3>
        <p className="text-xs text-gray-600">Klik op een endpoint voor het response formaat.</p>
        <div className="rounded-xl border border-[#2D3148] bg-[#12151F] overflow-hidden">
          <EndpointRow
            method="GET" path="/"
            description="API info en beschikbare endpoints"
            response={`{
  "name": "Proxmox Multi-Site PoC API",
  "version": "1.0.0",
  "endpoints": ["/status", "/migrate/to-bxl", "/migrate/to-ny", "/ping", "/latency"]
}`}
          />
          <EndpointRow
            method="GET" path="/status"
            description="Status van beide Proxmox-nodes en cluster"
            response={`{
  "timestamp": "2026-04-10 14:32:01",
  "cluster": "poc-cluster",
  "tunnel": "active",
  "nodes": {
    "pve-ny-01":  { "status": "online", "vms": 0 },
    "pve-bxl-01": { "status": "online", "vms": 1 }
  }
}`}
          />
          <EndpointRow
            method="GET" path="/migrate/to-bxl"
            description="Live migreer VM 100 van NY naar Brussel"
            response={`{
  "status": "migration_started",
  "vm": 100,
  "from": "pve-ny-01",
  "to": "pve-bxl-01",
  "type": "live (online)"
}`}
          />
          <EndpointRow
            method="GET" path="/migrate/to-ny"
            description="Live migreer VM 100 van Brussel naar NY"
            response={`{
  "status": "migration_started",
  "vm": 100,
  "from": "pve-bxl-01",
  "to": "pve-ny-01",
  "type": "live (online)"
}`}
          />
          <EndpointRow
            method="GET" path="/ping"
            description="Ping test tussen alle nodes en pfSense"
            response={`{
  "ny_to_bxl":   "Minimum = 0ms, Maximum = 1ms, Moyenne = 0ms",
  "bxl_to_ny":   "Minimum = 0ms, Maximum = 1ms, Moyenne = 0ms",
  "pfsense_ny":  "Minimum = 0ms, Maximum = 1ms, Moyenne = 0ms",
  "pfsense_bxl": "Minimum = 1ms, Maximum = 1ms, Moyenne = 1ms"
}`}
          />
          <EndpointRow
            method="GET" path="/latency"
            description="Latentiemeting management, VPN tunnel en internet"
            response={`{
  "management_network": "Minimum = 0ms, Maximum = 0ms, Moyenne = 0ms",
  "vpn_tunnel":         "Minimum = 0ms, Maximum = 1ms, Moyenne = 0ms",
  "internet":           "Minimum = 14ms, Maximum = 16ms, Moyenne = 15ms"
}`}
          />
        </div>
      </section>

      {/* Code examples */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Code Voorbeelden</h3>

        <CodeBlock lang="JavaScript (fetch)" code={`// Status ophalen
const res = await fetch('/api/status');
const data = await res.json();
console.log(data.nodes['pve-ny-01'].status); // "online"

// VM migreren naar Brussel
const migration = await fetch('/api/migrate/to-bxl');
const result = await migration.json();
// { "status": "migration_started", "vm": 100, ... }

// Ping alle nodes
const ping = await fetch('/api/ping');
const latency = await ping.json();
console.log(latency.ny_to_bxl); // round-trip time`} />

        <CodeBlock lang="Python (requests)" code={`import requests

BASE = "https://api.fridrdev.uk"

# Cluster status
status = requests.get(f"{BASE}/status").json()
print(status["cluster"])  # poc-cluster

# VM migratie starten
result = requests.get(f"{BASE}/migrate/to-bxl").json()
print(result["status"])  # migration_started

# Latentie meten
latency = requests.get(f"{BASE}/latency").json()
print(latency["vpn_tunnel"])`} />

        <CodeBlock lang="cURL" code={`# Cluster status
curl https://api.fridrdev.uk/status

# Migreer naar Brussel
curl https://api.fridrdev.uk/migrate/to-bxl

# Ping test
curl https://api.fridrdev.uk/ping

# Lokaal (Flask dev server)
curl http://localhost:5000/status`} />
      </section>

      {/* Starten */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Lokaal starten</h3>
        <CodeBlock lang="PowerShell / bash" code={`cd C:\\poc-api
pip install flask flask-cors proxmoxer requests
python app.py
# API draait op http://localhost:5000`} />
      </section>

    </div>
  )
}
