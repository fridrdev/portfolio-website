import { useState, useEffect, useCallback, useRef } from 'react'

const BASE = 'https://api.fridrdev.uk'
const COOLDOWN_SECONDS = 180   // 3 minuten

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function ts() {
  return new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function fmtCountdown(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
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
        <pre className="mt-2 text-xs bg-[#0F1117] rounded p-3 text-emerald-300 overflow-x-auto whitespace-pre-wrap">
{`gcloud compute ssh flask-api --zone=europe-west1-b --project=proxmox-poc
sudo systemctl restart poc-api`}
        </pre>
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
function NodeCard({ name, info }) {
  const online = info?.status === 'online'
  const isNy   = name === 'proxmox-ny'
  return (
    <div className="flex-1 rounded-lg border border-[#2D3148] bg-[#1A1D27] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-xs text-gray-500">{isNy ? '🌆 New York DC' : '🏛️ Brussels DC'}</p>
          <p className="text-sm font-semibold text-white font-mono">{name}</p>
          <p className="text-xs text-gray-600 font-mono">{info?.ip ?? '—'}</p>
          <p className="text-xs text-gray-600">{isNy ? 'europe-west1-b' : 'europe-west4-a'}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
          info === undefined
            ? 'bg-gray-800 text-gray-500 border-gray-700'
            : online
              ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700/50'
              : 'bg-red-900/50 text-red-400 border-red-700/50'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${
            info === undefined ? 'bg-gray-500'
            : online ? 'bg-emerald-400 animate-pulse'
            : 'bg-red-400'
          }`} />
          {info === undefined ? 'laden…' : online ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>
    </div>
  )
}

/* ─── VM status card ───────────────────────────────────────────────────────── */
function VmCard({ vm }) {
  if (!vm) return null
  const running = vm.status === 'running'
  return (
    <div className="rounded-lg border border-[#2D3148] bg-[#1A1D27] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">VM {vm.id}</p>
          <p className="text-base font-semibold text-white font-mono">{vm.name ?? `vm-${vm.id}`}</p>
          <p className="text-sm text-gray-400 mt-1">
            Huidige locatie:{' '}
            <span className="text-blue-300 font-mono">{vm.current_node ?? '—'}</span>
            {vm.current_node === 'proxmox-ny'  && <span className="text-gray-500 ml-1">(New York DC)</span>}
            {vm.current_node === 'proxmox-bxl' && <span className="text-gray-500 ml-1">(Brussels DC)</span>}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          running
            ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700/50'
            : 'bg-gray-800 text-gray-400 border-gray-600'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${running ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
          {vm.status?.toUpperCase() ?? '—'}
        </span>
      </div>

      {/* Informatieve badge — nested KVM */}
      {vm.status === 'stopped' && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-700/30 bg-blue-900/10 px-3 py-2">
          <span className="text-blue-400 mt-0.5 shrink-0">ℹ️</span>
          <p className="text-xs text-blue-300 leading-relaxed">
            {vm.note ?? 'Gestopt — nested KVM niet beschikbaar op cloud nodes. Migratie werkt wel.'}
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Latency row ──────────────────────────────────────────────────────────── */
function LatencyRow({ label, ms, status }) {
  const color = ms == null ? 'text-gray-500'
    : ms < 5   ? 'text-emerald-400'
    : ms < 30  ? 'text-blue-400'
    : ms < 100 ? 'text-yellow-400'
    : 'text-red-400'
  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-[#2D3148] bg-[#1A1D27]">
      <p className="text-xs text-gray-400 font-mono">{label}</p>
      <p className={`text-sm font-bold font-mono ${color}`}>
        {status === 'timeout' ? 'timeout' : ms != null ? `${ms} ms` : '—'}
      </p>
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
      className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-3 max-h-44 overflow-y-auto font-mono text-xs flex flex-col gap-1"
    >
      {lines.map((l, i) => (
        <p key={i} className={
          l.type === 'success' ? 'text-emerald-400'
          : l.type === 'error' ? 'text-red-400'
          : l.type === 'warn'  ? 'text-yellow-400'
          : 'text-gray-400'
        }>
          <span className="text-gray-600 mr-2">[{l.time}]</span>{l.msg}
        </p>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function TabLiveDemo() {
  const [status,         setStatus]         = useState(null)
  const [apiOffline,     setApiOffline]     = useState(false)
  const [firstLoad,      setFirstLoad]      = useState(true)
  const [latency,        setLatency]        = useState(null)
  const [latencyLoading, setLatencyLoading] = useState(false)
  const [pingNodes,      setPingNodes]      = useState(null)
  const [pingLoading,    setPingLoading]    = useState(false)
  const [migrating,      setMigrating]      = useState(null)   // 'bxl' | 'ny' | null
  const [migLog,         setMigLog]         = useState([])
  const [migSlowWarn,    setMigSlowWarn]    = useState(false)
  const [migElapsed,     setMigElapsed]     = useState(0)      // seconden oplopend tijdens migratie
  const [lastUpdate,     setLastUpdate]     = useState(null)
  const [countdown,      setCountdown]      = useState(0)      // seconds remaining
  const [verify,         setVerify]         = useState(null)
  const [verifyLoading,  setVerifyLoading]  = useState(false)

  const pollRef        = useRef(null)
  const countdownRef   = useRef(null)
  const slowWarnRef    = useRef(null)
  const migTimerRef    = useRef(null)   // oplopende secondenteller tijdens migratie

  /* ── fetch /status ─────────────────────────────────────────────────────── */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/status`, { signal: AbortSignal.timeout(7000) })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setStatus(data)
      setApiOffline(false)
      setLastUpdate(new Date())

      // Sync countdown from server
      const srvSec = data?.migration_cooldown?.retry_after_seconds ?? 0
      if (srvSec > 0) {
        setCountdown(prev => srvSec > prev ? srvSec : prev)
      }

      // Auto-verify bij elke status refresh (fire-and-forget, geen await)
      fetch(`${BASE}/verify`, { signal: AbortSignal.timeout(20_000) })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setVerify(d) })
        .catch(() => {})

      return data
    } catch {
      setApiOffline(true)
      return null
    } finally {
      setFirstLoad(false)
    }
  }, [])

  /* ── fetch /latency ────────────────────────────────────────────────────── */
  const fetchLatency = useCallback(async () => {
    setLatencyLoading(true)
    try {
      const res = await fetch(`${BASE}/latency`, { signal: AbortSignal.timeout(15_000) })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      setLatency(await res.json())
    } catch (e) {
      setLatency({ error: e.message })
    } finally {
      setLatencyLoading(false)
    }
  }, [])

  /* ── fetch /ping-nodes ─────────────────────────────────────────────────── */
  const fetchPingNodes = useCallback(async () => {
    setPingLoading(true)
    try {
      const res = await fetch(`${BASE}/ping-nodes`, { signal: AbortSignal.timeout(15_000) })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      setPingNodes(await res.json())
    } catch (e) {
      setPingNodes({ error: e.message })
    } finally {
      setPingLoading(false)
    }
  }, [])

  /* ── fetch /verify ────────────────────────────────────────────────────── */
  const fetchVerify = useCallback(async () => {
    setVerifyLoading(true)
    try {
      const res = await fetch(`${BASE}/verify`, { signal: AbortSignal.timeout(20_000) })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      setVerify(await res.json())
    } catch (e) {
      setVerify({ error: e.message })
    } finally {
      setVerifyLoading(false)
    }
  }, [])

  /* ── initial load ──────────────────────────────────────────────────────── */
  useEffect(() => {
    fetchStatus()
    fetchLatency()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── adaptive polling ──────────────────────────────────────────────────── */
  const startPolling = useCallback((fast) => {
    clearInterval(pollRef.current)
    pollRef.current = setInterval(fetchStatus, fast ? 3_000 : 30_000)
  }, [fetchStatus])

  useEffect(() => {
    startPolling(false)
    return () => clearInterval(pollRef.current)
  }, [startPolling])

  useEffect(() => {
    const inProgress = status?.migration_in_progress ?? false
    startPolling(inProgress)
  }, [status?.migration_in_progress, startPolling])

  /* ── countdown tick ────────────────────────────────────────────────────── */
  useEffect(() => {
    clearInterval(countdownRef.current)
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown(p => {
          if (p <= 1) { clearInterval(countdownRef.current); return 0 }
          return p - 1
        })
      }, 1_000)
    }
    return () => clearInterval(countdownRef.current)
  }, [countdown])

  /* ── log helper ────────────────────────────────────────────────────────── */
  const log = (msg, type = 'info') =>
    setMigLog(prev => [...prev, { msg, type, time: ts() }])

  /* ── refresh all ───────────────────────────────────────────────────────── */
  function refreshAll() {
    fetchStatus()
    fetchLatency()
    if (pingNodes) fetchPingNodes()
  }

  /* ── migrate ───────────────────────────────────────────────────────────── */
  async function migrate(direction) {
    if (migrating || countdown > 0 || status?.migration_in_progress) return
    const dest      = direction === 'bxl' ? 'proxmox-bxl' : 'proxmox-ny'
    const destLabel = direction === 'bxl' ? 'Brussels DC (proxmox-bxl)' : 'New York DC (proxmox-ny)'
    const srcLabel  = direction === 'bxl' ? 'proxmox-ny' : 'proxmox-bxl'

    setMigrating(direction)
    setMigLog([])
    setMigSlowWarn(false)
    setMigElapsed(0)

    // Oplopende secondenteller — stopt in finally
    migTimerRef.current = setInterval(() => {
      setMigElapsed(s => s + 1)
    }, 1_000)

    log(`Migratie gestart naar ${destLabel}`)
    log(`VM 100 wordt verplaatst van ${srcLabel} naar ${dest}`)
    log('Verwachte duur: ~47 seconden')

    // Slow warning na 120s (API wacht max 120s server-side)
    slowWarnRef.current = setTimeout(() => setMigSlowWarn(true), 120_000)

    try {
      // Timeout 135s — geeft server 120s + 15s marge
      const res = await fetch(`${BASE}/migrate/to-${direction}`, {
        method: 'POST',
        signal: AbortSignal.timeout(135_000),
      })
      const data = await res.json()

      if (res.status === 429) {
        const retry = data.retry_after_seconds
        if (retry) setCountdown(retry)
        throw new Error(data.message ?? 'Rate limit bereikt')
      }
      if (!res.ok || data.status === 'error') {
        throw new Error(data.message ?? data.error ?? 'Onbekende fout')
      }

      // API geeft pas success terug als VM gegarandeerd op dest staat
      log(`✅ Migratie geslaagd! VM 100 staat nu op ${dest}`, 'success')

      // Status ophalen met retry — API kan even herstarten na migratie
      let fresh = null
      for (let attempt = 1; attempt <= 3; attempt++) {
        fresh = await fetchStatus()
        if (fresh) break
        if (attempt < 3) {
          log(`Status ophalen mislukt, opnieuw proberen over 5s… (poging ${attempt}/3)`, 'warn')
          await new Promise(r => setTimeout(r, 5_000))
        }
      }
      const srvCd = fresh?.migration_cooldown?.retry_after_seconds ?? COOLDOWN_SECONDS
      setCountdown(srvCd)

    } catch (err) {
      log(`❌ Fout: ${err.message}`, 'error')
    } finally {
      clearInterval(migTimerRef.current)
      clearTimeout(slowWarnRef.current)
      setMigSlowWarn(false)
      setMigrating(null)
      startPolling(false)
    }
  }

  /* ── Loading ────────────────────────────────────────────────────────────── */
  if (firstLoad) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-gray-500 text-sm">Verbinden met API…</p>
      </div>
    )
  }

  /* ── Derived ─────────────────────────────────────────────────────────────── */
  const nyInfo  = status?.nodes?.['proxmox-ny']
  const bxlInfo = status?.nodes?.['proxmox-bxl']
  const vm      = status?.vm
  const vmNode  = vm?.current_node
  const serverInProgress = status?.migration_in_progress ?? false
  const blocked = !!(migrating || countdown > 0 || serverInProgress || apiOffline)

  return (
    <div className="flex flex-col gap-8">

      {/* ── Offline banner ────────────────────────────────────────────────── */}
      {apiOffline && <OfflineBanner onRetry={fetchStatus} />}

      {/* ── Header: laatste update + refresh ─────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${apiOffline ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
          <p className="text-xs text-gray-500">
            {apiOffline ? 'API offline' : 'Live verbinding'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-gray-600">
              Laatste update: {lastUpdate.toLocaleTimeString('nl-BE')}
            </span>
          )}
          <button
            onClick={fetchVerify}
            disabled={verifyLoading || apiOffline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#2D3148] text-xs text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 transition-colors"
          >
            {verifyLoading
              ? <><div className="h-3 w-3 rounded-full border border-emerald-400 border-t-transparent animate-spin" /> Verifiëren…</>
              : '🔍 Verifieer locatie'
            }
          </button>
          <button
            onClick={refreshAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#2D3148] text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* SECTIE 1: NODE STATUS                                             */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Node Status
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <NodeCard name="proxmox-ny"  info={nyInfo}  />

          {/* VPC tunnel indicator */}
          <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 sm:w-24 py-2">
            <p className="text-xs text-blue-400 font-semibold">GCP VPC</p>
            <div className="relative w-full h-1 bg-blue-900/20 rounded-full overflow-hidden">
              <div
                className="absolute top-0 h-full rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                style={{ width: '45%', animation: !apiOffline ? 'tunnel-flow 2s linear infinite' : 'none', opacity: apiOffline ? 0.1 : 1 }}
              />
            </div>
            <p className={`text-xs font-medium ${!apiOffline ? 'text-emerald-400' : 'text-red-400'}`}>
              {!apiOffline ? '● Verbonden' : '○ Offline'}
            </p>
          </div>

          <NodeCard name="proxmox-bxl" info={bxlInfo} />
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* SECTIE 2: VM 100 STATUS                                           */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          VM 100 Status
        </h3>
        {vm
          ? <VmCard vm={vm} />
          : <p className="text-xs text-gray-600">Status niet beschikbaar — API offline?</p>
        }
      </section>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* SECTIE 3 + 4: LATENCY & PING-NODES                               */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Latentie &amp; Ping
          </h3>
          <div className="flex gap-2">
            <button
              onClick={fetchLatency}
              disabled={latencyLoading || apiOffline}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#2D3148] text-xs text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 transition-colors"
            >
              {latencyLoading
                ? <><div className="h-3 w-3 rounded-full border border-blue-400 border-t-transparent animate-spin" /> laden…</>
                : '⚡ Meet latentie'
              }
            </button>
            <button
              onClick={fetchPingNodes}
              disabled={pingLoading || apiOffline}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#2D3148] text-xs text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 transition-colors"
            >
              {pingLoading
                ? <><div className="h-3 w-3 rounded-full border border-blue-400 border-t-transparent animate-spin" /> pingen…</>
                : '📡 Ping uitvoeren'
              }
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* Latency automatisch bij laden — alleen NY en BXL basismeting */}
          {latency?.error ? (
            <p className="text-xs text-red-400 px-1">{latency.error}</p>
          ) : (
            <>
              <LatencyRow label="NY datacenter latency"  ms={latency?.['proxmox-ny']?.latency_ms} />
              <LatencyRow label="BXL datacenter latency" ms={latency?.['proxmox-bxl']?.latency_ms} />
            </>
          )}

          {/* Ping uitvoeren — 3 directe rijen, vervangt latency rijen niet */}
          {pingNodes && !pingNodes.error && (
            <>
              <div className="border-t border-[#2D3148] my-1" />
              <LatencyRow
                label="flask-api → proxmox-ny"
                ms={pingNodes?.flask_to_ny?.latency_ms}
                status={pingNodes?.flask_to_ny?.status}
              />
              <LatencyRow
                label="flask-api → proxmox-bxl"
                ms={pingNodes?.flask_to_bxl?.latency_ms}
                status={pingNodes?.flask_to_bxl?.status}
              />
              <LatencyRow
                label="proxmox-ny → proxmox-bxl (via GCP VPC)"
                ms={pingNodes?.ny_to_bxl?.latency_ms}
                status={pingNodes?.ny_to_bxl?.status}
              />
            </>
          )}
          {pingNodes?.error && (
            <p className="text-xs text-red-400 px-1">{pingNodes.error}</p>
          )}
          {!pingNodes && !pingLoading && (
            <p className="text-xs text-gray-600 text-center py-1">
              Klik "Ping uitvoeren" voor volledige verbindingsmeting.
            </p>
          )}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* SECTIE 5 + 6 + 7: MIGRATIE                                       */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          VM Migratie
        </h3>

        <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-5 flex flex-col gap-4">

          {/* Migration in progress banner */}
          {(migrating || serverInProgress) && (
            <div className="flex flex-col gap-2 rounded-lg border border-blue-700/40 bg-blue-900/15 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />
                  <p className="text-sm font-medium text-blue-300">Migratie bezig… VM wordt verplaatst</p>
                </div>
                {migrating && (
                  <span className="font-mono text-sm font-bold text-blue-200 tabular-nums">
                    {migElapsed}s
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-400/80 ml-6">
                <span className="font-mono">{migrating === 'bxl' ? 'proxmox-ny' : 'proxmox-bxl'}</span>
                {' '}→{' '}
                <span className="font-mono">{migrating === 'bxl' ? 'proxmox-bxl' : 'proxmox-ny'}</span>
              </p>
              <p className="text-xs text-gray-500 ml-6">Verwachte duur: ~47 seconden · API wacht op bevestiging</p>
            </div>
          )}

          {/* Slow warning */}
          {migSlowWarn && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-700/40 bg-yellow-900/15 px-4 py-2">
              <span className="text-yellow-400 shrink-0">⏳</span>
              <p className="text-xs text-yellow-300">Duurt langer dan verwacht… nog aan het pollen.</p>
            </div>
          )}

          {/* Cooldown banner */}
          {!migrating && !serverInProgress && countdown > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-orange-700/40 bg-orange-900/15 px-4 py-3 gap-4">
              <div>
                <p className="text-sm text-orange-300 font-medium">
                  Volgende migratie mogelijk over{' '}
                  <span className="font-bold font-mono text-orange-200">{fmtCountdown(countdown)}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Cooldown — 3 minuten tussen migraties</p>
              </div>
              {/* Progress bar */}
              <div className="hidden sm:block h-1.5 w-32 bg-orange-900/40 rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / COOLDOWN_SECONDS) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Knoppen */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* → Brussel */}
            <button
              onClick={() => migrate('bxl')}
              disabled={blocked || vmNode !== 'proxmox-ny'}
              title={
                countdown > 0        ? `Cooldown: nog ${fmtCountdown(countdown)}`
                : serverInProgress   ? 'Migratie bezig'
                : vmNode !== 'proxmox-ny' ? 'VM staat niet op proxmox-ny'
                : undefined
              }
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-blue-600/60 bg-blue-900/20 text-blue-300 text-sm font-medium hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {migrating === 'bxl'
                ? <><div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" /> Migreren…</>
                : <>🚀 Migreer naar Brussel</>
              }
            </button>

            {/* → New York */}
            <button
              onClick={() => migrate('ny')}
              disabled={blocked || vmNode !== 'proxmox-bxl'}
              title={
                countdown > 0         ? `Cooldown: nog ${fmtCountdown(countdown)}`
                : serverInProgress    ? 'Migratie bezig'
                : vmNode !== 'proxmox-bxl' ? 'VM staat niet op proxmox-bxl'
                : undefined
              }
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-blue-600/60 bg-blue-900/20 text-blue-300 text-sm font-medium hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {migrating === 'ny'
                ? <><div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" /> Migreren…</>
                : <>🔄 Migreer naar New York</>
              }
            </button>
          </div>

          {/* Hulptekst */}
          {!apiOffline && !migrating && !serverInProgress && countdown === 0 && vmNode && (
            <p className="text-xs text-gray-600 text-center">
              VM staat op{' '}
              <span className="font-mono text-blue-400">{vmNode}</span>.{' '}
              {vmNode === 'proxmox-ny'  && 'Klik "Migreer naar Brussel" om VM 100 te verplaatsen.'}
              {vmNode === 'proxmox-bxl' && 'Klik "Migreer naar New York" om VM 100 te verplaatsen.'}
            </p>
          )}

          <MigLog lines={migLog} />
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* CLUSTER VERIFICATIE                                               */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Cluster Verificatie
          </h3>
          <button
            onClick={fetchVerify}
            disabled={verifyLoading || apiOffline}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#2D3148] text-xs text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 transition-colors"
          >
            {verifyLoading
              ? <><div className="h-3 w-3 rounded-full border border-emerald-400 border-t-transparent animate-spin" /> Verifiëren…</>
              : '🔍 Voer verificatie uit'
            }
          </button>
        </div>

        {/* Terminal box */}
        {verify && !verify.error && (verify['proxmox-ny'] || verify['proxmox-bxl']) && (
          <div className="rounded-lg border border-[#2D3148] bg-[#0d1117] p-4 font-mono text-xs flex flex-col gap-3">
            {/* proxmox-ny */}
            {verify['proxmox-ny'] != null && (
              <div className="flex flex-col gap-0.5">
                <p className="text-gray-500">
                  <span className="text-blue-400">[proxmox-ny] </span>
                  <span className="text-gray-600">$</span>
                  <span className="text-gray-300"> qm status 100</span>
                </p>
                <p className={`pl-4 ${verify['proxmox-ny'].startsWith('status:') ? 'text-emerald-400' : 'text-gray-500'}`}>
                  → {verify['proxmox-ny']}
                </p>
              </div>
            )}

            {/* proxmox-bxl */}
            {verify['proxmox-bxl'] != null && (
              <div className="flex flex-col gap-0.5">
                <p className="text-gray-500">
                  <span className="text-blue-400">[proxmox-bxl]</span>
                  <span className="text-gray-600"> $</span>
                  <span className="text-gray-300"> qm status 100</span>
                </p>
                <p className={`pl-4 ${verify['proxmox-bxl'].startsWith('status:') ? 'text-emerald-400' : 'text-gray-500'}`}>
                  → {verify['proxmox-bxl']}
                </p>
              </div>
            )}

            {/* Conclusie */}
            <div className="border-t border-[#2D3148] pt-3">
              {verify.confirmed_node
                ? <p className="text-emerald-400">✅ VM 100 bevestigd op {verify.confirmed_node}</p>
                : <p className="text-red-400">❌ VM 100 niet gevonden op een van de nodes</p>
              }
            </div>
          </div>
        )}

        {verify?.error && (
          <p className="text-xs text-red-400 font-mono px-1">{verify.error}</p>
        )}

        {!verify && !verifyLoading && (
          <p className="text-xs text-gray-600 text-center py-1">
            Klik "🔍 Verifieer locatie" om live via de Proxmox API te bevestigen op welke node VM 100 staat.
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
