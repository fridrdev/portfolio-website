import { useState, useEffect, useCallback, useRef } from 'react'

const BASE = '/api'

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function ts() {
  return new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/* ─── Offline banner ───────────────────────────────────────────────────────── */
function OfflineBanner({ onRetry }) {
  return (
    <div className="rounded-xl border border-yellow-700/50 bg-yellow-900/20 p-5 flex flex-col sm:flex-row sm:items-start gap-3">
      <span className="text-2xl shrink-0">⚠️</span>
      <div className="flex-1">
        <p className="font-semibold text-yellow-300">API niet bereikbaar</p>
        <p className="text-sm text-gray-400 mt-1">
          De Flask API reageert niet. Controleer of de service draait op de flask-api VM.
        </p>
        <pre className="mt-2 text-xs bg-[#0F1117] rounded p-3 text-emerald-300 overflow-x-auto">
          {`# Op flask-api VM (via Cloud Shell):
gcloud compute ssh flask-api --zone=europe-west1-b --project=proxmox-poc
sudo systemctl status poc-api
sudo systemctl restart poc-api`}
        </pre>
        <p className="text-xs text-gray-600 mt-2">
          Publiek: <span className="text-blue-400">https://api.fridrdev.uk</span> (Cloudflare Tunnel)
        </p>
      </div>
      <button
        onClick={onRetry}
        className="shrink-0 self-start px-3 py-1.5 rounded border border-yellow-600/50 text-yellow-400 text-xs hover:bg-yellow-500/10 transition-colors"
      >
        🔄 Retry
      </button>
    </div>
  )
}

/* ─── Node card ────────────────────────────────────────────────────────────── */
function NodeCard({ name, info, isVmHere }) {
  const online  = info?.status === 'online'
  const isNy    = name === 'proxmox-ny'
  const label   = isNy ? '🌆 New York' : '🏛️ Brussel'
  const zone    = isNy ? 'europe-west1-b' : 'europe-west4-a'

  return (
    <div className="flex-1 rounded-lg border border-[#2D3148] bg-[#1A1D27] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-sm font-semibold text-white font-mono">{name}</p>
          <p className="text-xs text-gray-600 font-mono">{info?.ip ?? '—'} · {zone}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
          info === undefined
            ? 'bg-gray-800 text-gray-500 border-gray-600'
            : online
              ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700/50'
              : 'bg-red-900/50 text-red-400 border-red-700/50'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${
            info === undefined ? 'bg-gray-500'
            : online ? 'bg-emerald-400 animate-pulse'
            : 'bg-red-400'
          }`} />
          {info === undefined ? 'laden…' : online ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* VM 100 badge */}
      <div className={`rounded border p-2 transition-all duration-500 ${
        isVmHere
          ? 'border-blue-600/60 bg-blue-900/20 opacity-100'
          : 'border-gray-700/20 opacity-0 pointer-events-none'
      }`}>
        <p className="text-xs text-blue-300 font-mono">📦 VM 100</p>
        <p className="text-xs text-gray-600 mt-0.5">{info?.vm_status ?? 'running'}</p>
      </div>
    </div>
  )
}

/* ─── Migration log ────────────────────────────────────────────────────────── */
function MigLog({ lines }) {
  const ref = useRef(null)
  useEffect(() => { ref.current?.scrollTo(0, ref.current.scrollHeight) }, [lines])
  if (!lines.length) return null
  return (
    <div
      ref={ref}
      className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-3 max-h-40 overflow-y-auto font-mono text-xs flex flex-col gap-1"
    >
      {lines.map((l, i) => (
        <p key={i} className={
          l.type === 'success' ? 'text-emerald-400'
          : l.type === 'error' ? 'text-red-400'
          : 'text-gray-400'
        }>
          <span className="text-gray-600 mr-2">[{l.time}]</span>{l.msg}
        </p>
      ))}
    </div>
  )
}

/* ─── Latency card ─────────────────────────────────────────────────────────── */
function LatencyCard({ node, ms }) {
  const color = ms === undefined ? 'text-gray-500'
    : ms < 5   ? 'text-emerald-400'
    : ms < 30  ? 'text-blue-400'
    : ms < 100 ? 'text-yellow-400'
    : 'text-red-400'
  return (
    <div className="rounded-lg border border-[#2D3148] bg-[#1A1D27] p-3 flex flex-col gap-1">
      <p className="text-xs text-gray-500">{node}</p>
      <p className={`text-2xl font-bold ${color}`}>
        {ms !== undefined ? `${ms} ms` : '—'}
      </p>
    </div>
  )
}

/* ─── Main ─────────────────────────────────────────────────────────────────── */
export default function TabLiveDemo() {
  const [status,         setStatus]         = useState(null)
  const [apiOffline,     setApiOffline]     = useState(false)
  const [firstLoad,      setFirstLoad]      = useState(true)
  const [migrating,      setMigrating]      = useState(null)   // 'bxl' | 'ny' | null
  const [migLog,         setMigLog]         = useState([])
  const [lastUpdate,     setLastUpdate]     = useState(null)
  const [latency,        setLatency]        = useState(null)
  const [latencyLoading, setLatencyLoading] = useState(false)
  const timerRef = useRef(null)

  /* ── fetch /status ── */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/status`, { signal: AbortSignal.timeout(6000) })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setStatus(data)
      setApiOffline(false)
      setLastUpdate(new Date())
    } catch {
      setApiOffline(true)
    } finally {
      setFirstLoad(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    timerRef.current = setInterval(fetchStatus, 30_000)
    return () => clearInterval(timerRef.current)
  }, [fetchStatus])

  /* ── log helper ── */
  const log = (msg, type = 'info') =>
    setMigLog(prev => [...prev, { msg, type, time: ts() }])

  /* ── migrate ── */
  async function migrate(direction) {
    if (migrating) return
    const dest      = direction === 'bxl' ? 'proxmox-bxl' : 'proxmox-ny'
    const destLabel = direction === 'bxl' ? 'Brussel (proxmox-bxl)' : 'New York (proxmox-ny)'
    setMigrating(direction)
    setMigLog([])
    log(`Migratie naar ${destLabel} gestart…`)

    try {
      await new Promise(r => setTimeout(r, 500))
      log('Verbinding met Proxmox API via Flask…')

      const res = await fetch(`${BASE}/migrate/to-${direction}`, {
        method: 'POST',
        signal: AbortSignal.timeout(60_000),   // migratie kan even duren
      })
      const data = await res.json()

      if (!res.ok || data.status === 'error') {
        throw new Error(data.message ?? data.error ?? 'Onbekende fout')
      }

      log(`✅ ${data.message ?? `VM 100 succesvol gemigreerd naar ${dest}`}`, 'success')
      await fetchStatus()
    } catch (err) {
      log(`❌ Fout: ${err.message}`, 'error')
    } finally {
      setMigrating(null)
    }
  }

  /* ── fetch /latency ── */
  async function fetchLatency() {
    setLatencyLoading(true)
    setLatency(null)
    try {
      const res = await fetch(`${BASE}/latency`, { signal: AbortSignal.timeout(15_000) })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      setLatency(await res.json())
    } catch (e) {
      setLatency({ error: e.message })
    } finally {
      setLatencyLoading(false)
    }
  }

  /* ── Loading skeleton ── */
  if (firstLoad) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-gray-500 text-sm">Verbinden met API…</p>
      </div>
    )
  }

  /* ── Derived state ── */
  const nyInfo    = status?.nodes?.['proxmox-ny']
  const bxlInfo   = status?.nodes?.['proxmox-bxl']
  const vmNode    = status?.vm?.current_node   // 'proxmox-ny' | 'proxmox-bxl'
  const vmStatus  = status?.vm?.status         // 'running' | 'stopped'

  const canMigrateToBxl = !migrating && !apiOffline && vmNode === 'proxmox-ny'  && vmStatus === 'running'
  const canMigrateToNy  = !migrating && !apiOffline && vmNode === 'proxmox-bxl' && vmStatus === 'running'

  return (
    <div className="flex flex-col gap-8">

      {/* Offline banner */}
      {apiOffline && <OfflineBanner onRetry={fetchStatus} />}

      {/* ── Cluster status ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Cluster Status</h3>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-xs text-gray-600">
                {lastUpdate.toLocaleTimeString('nl-BE')}
              </span>
            )}
            <button
              onClick={fetchStatus}
              disabled={firstLoad}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-40"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Node cards + tunnel */}
        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          <NodeCard name="proxmox-ny"  info={nyInfo}  isVmHere={vmNode === 'proxmox-ny'}  />

          {/* Tunnel indicator */}
          <div className="flex flex-col items-center justify-center gap-2 shrink-0 sm:w-28 py-2">
            <p className="text-xs text-blue-400 font-semibold whitespace-nowrap">GCP VPC</p>
            <div className="relative w-full h-1.5 bg-blue-900/20 rounded-full overflow-hidden">
              <div
                className="absolute top-0 h-full rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                style={{ width: '45%', animation: !apiOffline ? 'tunnel-flow 2s linear infinite' : 'none', opacity: apiOffline ? 0.15 : 1 }}
              />
            </div>
            <p className={`text-xs font-medium ${!apiOffline ? 'text-emerald-400' : 'text-red-400'}`}>
              {!apiOffline ? '● Verbonden' : '○ Offline'}
            </p>
          </div>

          <NodeCard name="proxmox-bxl" info={bxlInfo} isVmHere={vmNode === 'proxmox-bxl'} />
        </div>

        {/* VM status strip */}
        {status?.vm && (
          <div className="rounded-lg border border-[#2D3148] bg-[#1A1D27] px-4 py-3 flex flex-wrap gap-4 text-xs text-gray-400">
            <span>
              <span className="text-gray-600">Cluster: </span>
              <span className="text-white">poc-cluster</span>
            </span>
            <span>
              <span className="text-gray-600">VM 100 locatie: </span>
              <span className="text-blue-300 font-mono">{vmNode ?? '—'}</span>
            </span>
            <span>
              <span className="text-gray-600">VM status: </span>
              <span className={vmStatus === 'running' ? 'text-emerald-400' : 'text-yellow-400'}>
                {vmStatus ?? '—'}
              </span>
            </span>
          </div>
        )}
      </section>

      {/* ── Migratie controls ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">VM Migratie</h3>
        <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-5 flex flex-col gap-4">

          <div className="flex flex-col sm:flex-row gap-3">
            {/* NY → BXL */}
            <button
              onClick={() => migrate('bxl')}
              disabled={!canMigrateToBxl}
              title={!canMigrateToBxl && vmNode !== 'proxmox-ny' ? 'VM staat al op proxmox-bxl' : undefined}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-blue-600/60 bg-blue-900/20 text-blue-300 text-sm font-medium hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {migrating === 'bxl'
                ? <><div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" /> Migreren…</>
                : <>🚀 Migreer naar Brussel</>
              }
            </button>

            {/* BXL → NY */}
            <button
              onClick={() => migrate('ny')}
              disabled={!canMigrateToNy}
              title={!canMigrateToNy && vmNode !== 'proxmox-bxl' ? 'VM staat al op proxmox-ny' : undefined}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-blue-600/60 bg-blue-900/20 text-blue-300 text-sm font-medium hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {migrating === 'ny'
                ? <><div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" /> Migreren…</>
                : <>🔄 Migreer naar New York</>
              }
            </button>
          </div>

          {/* Why disabled */}
          {!apiOffline && vmStatus !== 'running' && (
            <p className="text-xs text-yellow-500 text-center">
              VM 100 moet in status <strong>running</strong> zijn voor live migratie.
            </p>
          )}
          {apiOffline && (
            <p className="text-xs text-yellow-500 text-center">
              Start de Flask API om live migratie te triggeren.
            </p>
          )}

          <MigLog lines={migLog} />
        </div>
      </section>

      {/* ── Latentie ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Latentie (flask-api → nodes)</h3>
          <button
            onClick={fetchLatency}
            disabled={latencyLoading || apiOffline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#2D3148] text-xs text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 transition-colors"
          >
            {latencyLoading
              ? <><div className="h-3 w-3 rounded-full border border-blue-400 border-t-transparent animate-spin" /> Meten…</>
              : '⚡ Meet latentie'
            }
          </button>
        </div>

        {latency?.error ? (
          <p className="text-xs text-red-400">{latency.error}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <LatencyCard node="proxmox-ny (europe-west1-b)"  ms={latency?.['proxmox-ny']?.latency_ms}  />
            <LatencyCard node="proxmox-bxl (europe-west4-a)" ms={latency?.['proxmox-bxl']?.latency_ms} />
          </div>
        )}

        {!latency && !latencyLoading && (
          <p className="text-xs text-gray-600 text-center">
            Klik "Meet latentie" om de round-trip tijd van de Flask API naar beide Proxmox-nodes te meten.
          </p>
        )}
      </section>

      {/* Keyframes */}
      <style>{`
        @keyframes tunnel-flow {
          0%   { left: -45%; }
          100% { left: 145%; }
        }
      `}</style>

    </div>
  )
}
