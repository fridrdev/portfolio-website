import { useState, useCallback } from 'react'

const BASE_URL = '/api'

const SERVICES = [
  {
    id: 'video',
    name: 'Video Service',
    endpoint: '/video-service',
    method: 'GET',
    description: 'Haalt video metadata op uit de catalog.',
    color: '#3B82F6',
  },
  {
    id: 'user',
    name: 'User Service',
    endpoint: '/user-service',
    method: 'GET',
    description: 'Beheert gebruikersprofielen en sessies.',
    color: '#8B5CF6',
  },
  {
    id: 'auth',
    name: 'Auth Service',
    endpoint: '/auth-service',
    method: 'GET',
    description: '10% kans op 401 Unauthorized response.',
    color: '#EF4444',
    note: '10% kans op 401',
  },
  {
    id: 'analytics',
    name: 'Analytics Service',
    endpoint: '/analytics-service',
    method: 'GET',
    description: 'Verwerkt events. 300–500ms artificiële latentie.',
    color: '#10B981',
    note: '300–500ms latentie',
  },
  {
    id: 'recommendation',
    name: 'Recommendation Service',
    endpoint: '/recommendation-service',
    method: 'GET',
    description: '30% kans op 2s delay, 20% kans op 500 error.',
    color: '#F59E0B',
    note: '30% slow / 20% error',
  },
]

function StatusBadge({ status }) {
  if (status === 'idle') return null
  if (status === 'loading') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-400 border border-gray-700">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse" />
      Laden...
    </span>
  )
  if (status >= 200 && status < 300) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-400 border border-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
      {status} OK
    </span>
  )
  if (status === 401) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-900/40 text-orange-400 border border-orange-700">
      <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
      {status} Unauthorized
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-900/40 text-red-400 border border-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      {status} Error
    </span>
  )
}

function ServiceCard({ service, result, onTest, loading }) {
  return (
    <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: service.color }} />
            <h4 className="font-semibold text-white text-sm">{service.name}</h4>
            {service.note && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1D27] text-gray-500 border border-[#2D3148]">
                {service.note}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">{service.description}</p>
          <p className="text-xs text-gray-600 mt-0.5 font-mono">{service.method} {service.endpoint}</p>
        </div>
        <button
          onClick={() => onTest(service)}
          disabled={loading}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all"
          style={{ background: loading ? '#2D3148' : service.color, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? '...' : 'Test'}
        </button>
      </div>

      {result && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={result.status} />
            {result.ms != null && (
              <span className="text-xs text-gray-500">{result.ms} ms</span>
            )}
            {result.timestamp && (
              <span className="text-xs text-gray-600 ml-auto">{result.timestamp}</span>
            )}
          </div>
          {result.body && (
            <pre className="text-[11px] text-green-300 bg-[#0A0C14] rounded-lg p-3 overflow-auto max-h-36 font-mono leading-relaxed border border-[#2D3148]">
              {JSON.stringify(result.body, null, 2)}
            </pre>
          )}
          {result.error && (
            <p className="text-xs text-red-400 font-mono">{result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}

async function callService(service) {
  const start = performance.now()
  const timestamp = new Date().toLocaleTimeString('nl-BE')
  try {
    const res = await fetch(`${BASE_URL}${service.endpoint}`)
    const ms = Math.round(performance.now() - start)
    let body = null
    try { body = await res.json() } catch { body = null }
    return { status: res.status, ms, body, timestamp }
  } catch (e) {
    const ms = Math.round(performance.now() - start)
    return { status: 'ERR', ms, error: e.message, timestamp }
  }
}

export default function TabLiveTester() {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState({})
  const [history, setHistory] = useState([])
  const [testingAll, setTestingAll] = useState(false)

  const runTest = useCallback(async (service) => {
    setLoading(l => ({ ...l, [service.id]: true }))
    const result = await callService(service)
    setResults(r => ({ ...r, [service.id]: result }))
    setHistory(h => [{ service: service.name, ...result }, ...h].slice(0, 10))
    setLoading(l => ({ ...l, [service.id]: false }))
  }, [])

  const testAll = useCallback(async () => {
    setTestingAll(true)
    await Promise.all(SERVICES.map(s => runTest(s)))
    setTestingAll(false)
  }, [runTest])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Test de live AWS endpoints rechtstreeks vanuit de browser.
        </p>
        <button
          onClick={testAll}
          disabled={testingAll}
          className="rounded-lg border border-[#FF6600]/50 px-4 py-2 text-sm font-medium text-[#FF6600] hover:bg-[#FF6600]/10 transition-colors disabled:opacity-50"
        >
          {testingAll ? 'Testen...' : 'Test alle services'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SERVICES.map(s => (
          <ServiceCard
            key={s.id}
            service={s}
            result={results[s.id]}
            onTest={runTest}
            loading={!!loading[s.id]}
          />
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Recente calls (laatste 10)</h4>
          <div className="rounded-xl border border-[#2D3148] bg-[#12151F] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2D3148] text-gray-500">
                  <th className="px-4 py-2 text-left">Service</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Latentie</th>
                  <th className="px-4 py-2 text-left">Tijdstip</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-[#1A1D27] hover:bg-[#1A1D27]">
                    <td className="px-4 py-2 text-gray-300">{h.service}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={h.status} />
                    </td>
                    <td className="px-4 py-2 text-gray-400">{h.ms} ms</td>
                    <td className="px-4 py-2 text-gray-600">{h.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
