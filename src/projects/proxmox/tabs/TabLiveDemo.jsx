import { useState, useEffect, useCallback, useRef } from 'react'

const BASE = '/api'

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function ts() { return new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }

function latencyColor(val) {
  const ms = parseFloat(val)
  if (isNaN(ms)) return 'text-gray-400'
  if (ms < 1)   return 'text-emerald-400'
  if (ms < 10)  return 'text-blue-400'
  if (ms < 50)  return 'text-yellow-400'
  return 'text-red-400'
}

/* ─── Offline banner ───────────────────────────────────────────────────────── */
function OfflineBanner({ onRetry }) {
  return (
    <div className="rounded-xl border border-yellow-700/50 bg-yellow-900/20 p-5 flex flex-col sm:flex-row sm:items-start gap-3">
      <span className="text-2xl shrink-0">⚠️</span>
      <div className="flex-1">
        <p className="font-semibold text-yellow-300">Demo offline</p>
        <p className="text-sm text-gray-400 mt-1">
          De Flask API is niet bereikbaar. Start hem lokaal om live data te zien:
        </p>
        <pre className="mt-2 text-xs bg-[#0F1117] rounded p-3 text-emerald-300 overflow-x-auto">
          cd C:\poc-api{'\n'}python app.py
        </pre>
        <p className="text-xs text-gray-600 mt-2">
          In productie: <span className="text-blue-400">https://api.fridrdev.uk</span> via Cloudflare Tunnel
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

/* ─── Node status card ─────────────────────────────────────────────────────── */
function NodeCard({ name, data, vmLocation }) {
  const isNy  = name === 'pve-ny-01'
  const hasVm = isNy ? vmLocation === 'ny' : vmLocation === 'bxl'
  const online = data?.status === 'online'

  return (
    <div className="flex-1 rounded-lg border border-[#2D3148] bg-[#1A1D27] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white font-mono">{name}</p>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
          online ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50'
                 : 'bg-red-900/50 text-red-400 border border-red-700/50'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          {online ? 'Online' : 'Offline'}
        </span>
      </div>

      <p className="text-xs text-gray-600 font-mono">
        {isNy ? '192.168.99.10' : '192.168.99.11'}
      </p>

      {data?.vms !== undefined && (
        <p className="text-xs text-gray-400">{data.vms} VM{data.vms !== 1 ? "'s" : ''} actief</p>
      )}

      {/* VM badge */}
      <div className={`rounded border p-2 transition-all duration-500 ${
        hasVm ? 'border-blue-600/60 bg-blue-900/20 opacity-100' : 'border-gray-700/30 bg-transparent opacity-0'
      }`}>
        <p className="text-xs text-blue-300 font-mono">📦 VM 100</p>
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

/* ─── Metric card ──────────────────────────────────────────────────────────── */
function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[#2D3148] bg-[#1A1D27] p-3 flex flex-col gap-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${latencyColor(value)}`}>{value ?? '—'}</p>
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
  const [vmLocation,     setVmLocation]     = useState('ny')   // 'ny' | 'bxl'
  const [lastUpdate,     setLastUpdate]     = useState(null)
  const [pingData,       setPingData]       = useState(null)
  const [latencyData,    setLatencyData]    = useState(null)
  const [pingLoading,    setPingLoading]    = useState(false)
  const [latencyLoading, setLatencyLoading] = useState(false)
  const timerRef = useRef(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/status`, { signal: AbortSignal.timeout(6000) })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setStatus(data)
      setApiOffline(false)
      setLastUpdate(new Date())
      // Determine VM location from VM counts
      const nyVms  = data?.nodes?.['pve-ny-01']?.vms  ?? 0
      const bxlVms = data?.nodes?.['pve-bxl-01']?.vms ?? 0
      if (bxlVms > 0 && bxlVms >= nyVms) setVmLocation('bxl')
      else setVmLocation('ny')
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

  const log = (msg, type = 'info') =>
    setMigLog(prev => [...prev, { msg, type, time: ts() }])

  async function migrate(direction) {
    if (migrating) return
    const to = direction === 'bxl' ? 'Brussel (pve-bxl-01)' : 'New York (pve-ny-01)'
    setMigrating(direction)
    setMigLog([])
    log(`Migratie naar ${to} gestart…`)
    try {
      await new Promise(r => setTimeout(r, 600))
      log('Verbinding met Proxmox API…')
      const res = await fetch(`${BASE}/migrate/to-${direction}`, { signal: AbortSignal.timeout(20_000) })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Onbekende fout')
      log('Live migratie gestart — VM blijft actief tijdens overdracht…')
      await new Promise(r => setTimeout(r, 1200))
      log(`✅ Migratie geslaagd! VM 100 draait nu op pve-${direction === 'bxl' ? 'bxl' : 'ny'}-01`, 'success')
      setVmLocation(direction)
      await fetchStatus()
    } catch (err) {
      log(`❌ Fout: ${err.message}`, 'error')
    } finally {
      setMigrating(null)
    }
  }

  async function doPing() {
    setPingLoading(true)
    setPingData(null)
    try {
      const res = await fetch(`${BASE}/ping`, { signal: AbortSignal.timeout(15_000) })
      setPingData(await res.json())
    } catch {
      setPingData({ error: 'Ping mislukt — is de API online?' })
    } finally {
      setPingLoading(false)
    }
  }

  async function doLatency() {
    setLatencyLoading(true)
    setLatencyData(null)
    try {
      const res = await fetch(`${BASE}/latency`, { signal: AbortSignal.timeout(15_000) })
      setLatencyData(await res.json())
    } catch {
      setLatencyData({ error: 'Meting mislukt — is de API online?' })
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

  const nyData  = status?.nodes?.['pve-ny-01']
  const bxlData = status?.nodes?.['pve-bxl-01']

  return (
    <div className="flex flex-col gap-8">

      {/* Offline banner */}
      {apiOffline && <OfflineBanner onRetry={fetchStatus} />}

      {/* ── Cluster status ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Cluster Status</h3>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-gray-600">
                Bijgewerkt {lastUpdate.toLocaleTimeString('nl-BE')}
              </span>
            )}
            <button
              onClick={fetchStatus}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Architecture visualisation */}
        <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-4">
          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            <NodeCard name="pve-ny-01"  data={nyData}  vmLocation={vmLocation} />

            {/* Tunnel */}
            <div className="flex flex-col items-center justify-center gap-2 shrink-0 sm:w-28">
              <p className="text-xs text-blue-400 font-semibold whitespace-nowrap">IPSec VPN</p>
              <div className="relative w-full h-1.5 bg-blue-900/20 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 h-full rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent ${!apiOffline ? '' : 'opacity-20'}`}
                  style={{ width: '45%', animation: !apiOffline ? 'tunnel-flow 2s linear infinite' : 'none' }}
                />
              </div>
              <p className={`text-xs font-medium ${!apiOffline ? 'text-emerald-400' : 'text-red-400'}`}>
                {!apiOffline ? '● ESTABLISHED' : '○ OFFLINE'}
              </p>
            </div>

            <NodeCard name="pve-bxl-01" data={bxlData} vmLocation={vmLocation} />
          </div>
        </div>

        {/* Cluster info strip */}
        {status && (
          <div className="rounded-lg border border-[#2D3148] bg-[#1A1D27] px-4 py-2.5 flex flex-wrap gap-4 text-xs text-gray-400">
            <span><span className="text-gray-600">Cluster: </span><span className="text-white">{status.cluster ?? 'poc-cluster'}</span></span>
            <span><span className="text-gray-600">Tunnel: </span>
              <span className={status.tunnel === 'active' ? 'text-emerald-400' : 'text-red-400'}>
                {status.tunnel ?? 'unknown'}
              </span>
            </span>
          </div>
        )}
      </section>

      {/* ── Migratie control ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">VM Migratie</h3>
        <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => migrate('bxl')}
              disabled={!!migrating || apiOffline || vmLocation === 'bxl'}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-blue-600/60 bg-blue-900/20 text-blue-300 text-sm font-medium hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {migrating === 'bxl'
                ? <><div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" /> Migrating…</>
                : <>🚀 NY → Brussel</>
              }
            </button>
            <button
              onClick={() => migrate('ny')}
              disabled={!!migrating || apiOffline || vmLocation === 'ny'}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-blue-600/60 bg-blue-900/20 text-blue-300 text-sm font-medium hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {migrating === 'ny'
                ? <><div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" /> Migrating…</>
                : <>🔄 Brussel → NY</>
              }
            </button>
          </div>

          {apiOffline && (
            <p className="text-xs text-yellow-500 text-center">
              Start de Flask API om live migratie te triggeren
            </p>
          )}

          <MigLog lines={migLog} />
        </div>
      </section>

      {/* ── Netwerk metrics ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Netwerk Metrics</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Ping panel */}
          <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Ping</p>
              <button
                onClick={doPing}
                disabled={pingLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#2D3148] text-xs text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 transition-colors"
              >
                {pingLoading
                  ? <><div className="h-3 w-3 rounded-full border border-blue-400 border-t-transparent animate-spin" /> Pinging…</>
                  : '📡 Ping alle nodes'
                }
              </button>
            </div>
            {pingData && !pingData.error && (
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="NY → BXL"    value={pingData.ny_to_bxl}    />
                <MetricCard label="BXL → NY"    value={pingData.bxl_to_ny}    />
                <MetricCard label="pfSense-NY"  value={pingData.pfsense_ny}   />
                <MetricCard label="pfSense-BXL" value={pingData.pfsense_bxl}  />
              </div>
            )}
            {pingData?.error && (
              <p className="text-xs text-red-400">{pingData.error}</p>
            )}
          </div>

          {/* Latency panel */}
          <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Latentie</p>
              <button
                onClick={doLatency}
                disabled={latencyLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#2D3148] text-xs text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 transition-colors"
              >
                {latencyLoading
                  ? <><div className="h-3 w-3 rounded-full border border-blue-400 border-t-transparent animate-spin" /> Meting…</>
                  : '⚡ Meet latentie'
                }
              </button>
            </div>
            {latencyData && !latencyData.error && (
              <div className="grid grid-cols-1 gap-2">
                <MetricCard label="Management netwerk" value={latencyData.management_network} />
                <MetricCard label="VPN Tunnel"         value={latencyData.vpn_tunnel}         />
                <MetricCard label="Internet (8.8.8.8)" value={latencyData.internet}           />
              </div>
            )}
            {latencyData?.error && (
              <p className="text-xs text-red-400">{latencyData.error}</p>
            )}
          </div>
        </div>
      </section>

      {/* Inline keyframes for tunnel animation */}
      <style>{`
        @keyframes tunnel-flow {
          0%   { left: -45%; }
          100% { left: 145%; }
        }
      `}</style>

    </div>
  )
}
