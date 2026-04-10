import { useState } from 'react'

// Drop grafana-dashboard.png into the /public folder and it appears automatically.
// No import needed — the file is served at /grafana-dashboard.png by Vite.
const SCREENSHOT_URL = '/grafana-dashboard.png'

const CARDS = [
  {
    label: 'Latentie (ms)',
    color: '#F59E0B',
    bgColor: '#F59E0B18',
    borderColor: '#F59E0B40',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    text: 'Gemiddelde uitvoertijd van de recommendation-service. Pieken tot 1750ms zichtbaar tijdens load tests. Normale waarde: 300–500ms. Trage requests (>1s) worden veroorzaakt door de gesimuleerde 30% slow path.',
  },
  {
    label: 'Errors',
    color: '#EF4444',
    bgColor: '#EF444418',
    borderColor: '#EF444440',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    text: 'Aantal 500-errors per tijdseenheid. Pieken van 5 errors tegelijk zichtbaar tijdens load tests. Veroorzaakt door de gesimuleerde 20% error rate in de recommendation-service.',
  },
  {
    label: 'Invocations',
    color: '#22C55E',
    bgColor: '#22C55E18',
    borderColor: '#22C55E40',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    text: 'Totaal aantal Lambda aanroepen per tijdseenheid. Piek van 21 aanroepen tijdens de load test met 20 gelijktijdige requests.',
  },
]

export default function TabDashboards() {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">Live Monitoring Dashboards</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Echte data van de recommendation-service tijdens load tests —
          gemeten via Grafana + AWS CloudWatch
        </p>
      </div>

      {/* Screenshot — shows image when present, placeholder when not */}
      <div className="rounded-xl border border-[#2D3148] overflow-hidden bg-[#0A0C14]">
        {imgFailed ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1A1D27] border border-[#2D3148]">
              <svg className="h-7 w-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Screenshot niet gevonden</p>
              <p className="text-xs text-gray-600 mt-1">
                Sla de Grafana screenshot op als{' '}
                <span className="font-mono text-[#FF6600]">public/grafana-dashboard.png</span>
              </p>
            </div>
          </div>
        ) : (
          <img
            src={SCREENSHOT_URL}
            alt="Grafana dashboard – VRT Distributed Tracing"
            className="w-full block"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>

      {/* Explanation cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {CARDS.map(card => (
          <div
            key={card.label}
            className="rounded-xl border p-4 flex flex-col gap-3"
            style={{ borderColor: card.borderColor, background: card.bgColor }}
          >
            {/* Label + icon */}
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${card.color}25`, color: card.color }}
              >
                {card.icon}
              </div>
              <span className="text-sm font-semibold" style={{ color: card.color }}>
                {card.label}
              </span>
            </div>
            {/* Explanation */}
            <p className="text-xs text-gray-400 leading-relaxed">{card.text}</p>
          </div>
        ))}
      </div>

      {/* Timestamp */}
      <p className="text-center text-xs text-gray-600">
        Screenshot genomen op 9 april 2026 tijdens load test
      </p>

    </div>
  )
}
