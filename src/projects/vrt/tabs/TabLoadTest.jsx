import { useState, useRef } from 'react'

const BASE_URL = '/api'
const ENDPOINT = '/recommendation-service'

async function singleRequest(idx) {
  const start = performance.now()
  try {
    const res = await fetch(`${BASE_URL}${ENDPOINT}`)
    const ms = Math.round(performance.now() - start)
    const type = res.status >= 500 ? 'error' : ms > 1000 ? 'slow' : 'ok'
    return { idx, status: res.status, ms, type }
  } catch (e) {
    const ms = Math.round(performance.now() - start)
    return { idx, status: 'ERR', ms, type: 'error', error: e.message }
  }
}

function TypeBadge({ type }) {
  if (type === 'ok') return <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-900/40 text-green-400 border border-green-800">OK</span>
  if (type === 'slow') return <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-900/40 text-orange-400 border border-orange-800">SLOW</span>
  return <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/40 text-red-400 border border-red-800">ERROR</span>
}

export default function TabLoadTest({ onComplete }) {
  const [count, setCount] = useState(10)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0)
  const [results, setResults] = useState([])
  const abortRef = useRef(false)

  const stats = results.length > 0 ? {
    avg: Math.round(results.reduce((a, r) => a + r.ms, 0) / results.length),
    errors: Math.round(results.filter(r => r.type === 'error').length / results.length * 100),
    slow: Math.round(results.filter(r => r.type === 'slow').length / results.length * 100),
    total: results.length,
    timestamp: new Date().toLocaleString('nl-BE'),
  } : null

  async function start() {
    abortRef.current = false
    setRunning(true)
    setDone(0)
    setResults([])

    const collected = []
    for (let i = 0; i < count; i++) {
      if (abortRef.current) break
      const res = await singleRequest(i + 1)
      collected.push(res)
      setDone(i + 1)
      setResults(r => [...r, res])
    }
    setRunning(false)

    // Notify parent with final stats
    if (!abortRef.current && collected.length > 0 && onComplete) {
      const finalStats = {
        avg: Math.round(collected.reduce((a, r) => a + r.ms, 0) / collected.length),
        errors: Math.round(collected.filter(r => r.type === 'error').length / collected.length * 100),
        slow: Math.round(collected.filter(r => r.type === 'slow').length / collected.length * 100),
        total: collected.length,
        timestamp: new Date().toLocaleString('nl-BE'),
        rows: collected,
      }
      onComplete(finalStats)
    }
  }

  function stop() {
    abortRef.current = true
    setRunning(false)
  }

  const progress = running && count > 0 ? (done / count) * 100 : results.length > 0 ? 100 : 0

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Stuur meerdere gelijktijdige requests naar de <span className="text-[#F59E0B] font-mono">/recommendation-service</span> en
        analyseer de latentieverdeling, errors en slow responses.
      </p>

      {/* Controls */}
      <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-5 space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <label className="text-gray-400">Aantal requests</label>
            <span className="font-semibold text-white">{count}</span>
          </div>
          <input
            type="range" min={1} max={20} value={count}
            onChange={e => setCount(Number(e.target.value))}
            disabled={running}
            className="w-full accent-[#FF6600]"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>1</span><span>20</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={start}
            disabled={running}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-all bg-[#FF6600] hover:bg-[#e55c00] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? `Testen... (${done}/${count})` : 'Start Load Test'}
          </button>
          {running && (
            <button
              onClick={stop}
              className="rounded-lg border border-red-700 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20"
            >
              Stop
            </button>
          )}
        </div>

        {/* Progress bar */}
        {(running || progress === 100) && (
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-[#2D3148] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF6600] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 text-right">{done} / {count} voltooid</p>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Gemiddelde latentie', value: `${stats.avg} ms`, color: stats.avg > 1000 ? '#EF4444' : stats.avg > 500 ? '#F59E0B' : '#10B981' },
            { label: '% Errors', value: `${stats.errors}%`, color: stats.errors > 20 ? '#EF4444' : stats.errors > 5 ? '#F59E0B' : '#10B981' },
            { label: '% Slow (>1s)', value: `${stats.slow}%`, color: stats.slow > 30 ? '#EF4444' : stats.slow > 10 ? '#F59E0B' : '#10B981' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[#2D3148] bg-[#12151F] p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div className="rounded-xl border border-[#2D3148] bg-[#12151F] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2D3148]">
            <h4 className="text-sm font-semibold text-white">Resultaten ({results.length})</h4>
          </div>
          <div className="overflow-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#12151F]">
                <tr className="border-b border-[#2D3148] text-gray-500">
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Latentie</th>
                  <th className="px-4 py-2 text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {results.sort((a, b) => a.idx - b.idx).map(r => (
                  <tr key={r.idx} className="border-b border-[#1A1D27] hover:bg-[#1A1D27]">
                    <td className="px-4 py-2 text-gray-600">{r.idx}</td>
                    <td className="px-4 py-2 text-gray-300">{r.status}</td>
                    <td className="px-4 py-2 text-gray-300">{r.ms} ms</td>
                    <td className="px-4 py-2"><TypeBadge type={r.type} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
