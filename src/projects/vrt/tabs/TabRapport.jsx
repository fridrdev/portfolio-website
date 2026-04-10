const STATIC_FINDINGS = [
  {
    title: 'End-to-end tracing succesvol geïmplementeerd',
    body: 'Alle 5 Lambda-services zijn geconfigureerd met AWS X-Ray SDK. Traces zijn volledig zichtbaar in de X-Ray servicemap, inclusief downstream calls en latentiemetingen per segment.',
    type: 'success',
  },
  {
    title: 'Auth Service – 401 rate ~10%',
    body: 'Zoals verwacht geeft de Auth Service in ~10% van de calls een 401 Unauthorized terug. Dit is een gesimuleerde foutcondition voor het demonstreren van error-tracing in X-Ray.',
    type: 'info',
  },
  {
    title: 'Analytics Service – consistente 300–500ms latentie',
    body: 'De Analytics Service toont een artificiële vertraging van 300–500ms. In CloudWatch is een latentie-alarm ingesteld bij >800ms. Grafana toont de p50/p90/p99 latentie in realtime.',
    type: 'warning',
  },
  {
    title: 'Recommendation Service – bimodale verdeling',
    body: '~30% van de requests duurt >2 seconden (slow path) en ~20% geeft een 500 error terug. Load tests bevestigen deze verdeling. De X-Ray trace map toont duidelijk de twee paden.',
    type: 'warning',
  },
  {
    title: 'Grafana – geautomatiseerde alerting',
    body: "Bij een error rate >15% over een window van 5 minuten stuurt het systeem automatisch een alert naar het ops-team. Getest en bevestigd tijdens load test scenario's.",
    type: 'success',
  },
]

const TYPE_STYLES = {
  success: { border: 'border-green-800',  bg: 'bg-green-900/20',  dot: 'bg-green-400',  label: 'Bevinding', labelColor: 'text-green-400' },
  info:    { border: 'border-blue-800',   bg: 'bg-blue-900/20',   dot: 'bg-blue-400',   label: 'Info',      labelColor: 'text-blue-400' },
  warning: { border: 'border-orange-800', bg: 'bg-orange-900/20', dot: 'bg-orange-400', label: 'Let op',    labelColor: 'text-orange-400' },
}

export default function TabRapport({ project, loadTestData, onGoToLoadTest }) {

  async function exportPDF() {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()
    let y = 40

    doc.setFontSize(22)
    doc.setTextColor(255, 102, 0)
    doc.text('VRT – Distributed Tracing Rapport', W / 2, y, { align: 'center' })
    y += 30

    doc.setFontSize(11)
    doc.setTextColor(150, 150, 150)
    doc.text(`Odisee Hogeschool  •  April 2026  •  AWS eu-west-3`, W / 2, y, { align: 'center' })
    y += 30

    doc.setDrawColor(45, 49, 72)
    doc.line(40, y, W - 40, y)
    y += 20

    // Summary
    doc.setFontSize(13)
    doc.setTextColor(255, 255, 255)
    doc.text('Projectsamenvatting', 40, y)
    y += 16

    doc.setFontSize(10)
    doc.setTextColor(180, 180, 180)
    const summary = `Dit project implementeerde end-to-end distributed tracing voor de VRT microservices-architectuur op AWS. Vijf Lambda-services werden geïnstrumenteerd met de AWS X-Ray SDK, aangevuld met real-time monitoring via CloudWatch en Grafana.`
    const lines = doc.splitTextToSize(summary, W - 80)
    doc.text(lines, 40, y)
    y += lines.length * 13 + 16

    // Live stats if available
    if (loadTestData) {
      doc.setFontSize(13)
      doc.setTextColor(255, 255, 255)
      doc.text('Load Test Resultaten (live meting)', 40, y)
      y += 16

      doc.setFontSize(10)
      doc.setTextColor(180, 180, 180)
      doc.text(`Uitgevoerd: ${loadTestData.timestamp}  •  ${loadTestData.total} requests`, 40, y)
      y += 14
      doc.text(`Gemiddelde latentie: ${loadTestData.avg} ms`, 40, y); y += 12
      doc.text(`Error rate: ${loadTestData.errors}%`, 40, y); y += 12
      doc.text(`Slow requests (>1s): ${loadTestData.slow}%`, 40, y); y += 20
    }

    // Findings
    doc.setFontSize(13)
    doc.setTextColor(255, 255, 255)
    doc.text('Bevindingen', 40, y)
    y += 16

    STATIC_FINDINGS.forEach((f, i) => {
      if (y > 720) { doc.addPage(); y = 40 }
      doc.setFontSize(10)
      doc.setTextColor(220, 220, 220)
      doc.text(`${i + 1}. ${f.title}`, 40, y); y += 13
      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      const bodyLines = doc.splitTextToSize(f.body, W - 90)
      doc.text(bodyLines, 50, y)
      y += bodyLines.length * 12 + 10
    })

    // Footer
    const pages = doc.getNumberOfPages()
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p)
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      doc.text(
        `Pagina ${p} van ${pages}  •  Frider Dev Portfolio  •  ${new Date().toLocaleDateString('nl-BE')}`,
        W / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' }
      )
    }

    doc.save('VRT-Distributed-Tracing-Rapport.pdf')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Projectrapport</h3>
          <p className="text-sm text-gray-500 mt-1">Samenvatting en bevindingen — April 2026</p>
        </div>
        <button
          onClick={exportPDF}
          className="inline-flex items-center gap-2 rounded-lg bg-[#FF6600] px-4 py-2 text-sm font-medium text-white hover:bg-[#e55c00] transition-colors shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exporteer PDF
        </button>
      </div>

      {/* Project summary */}
      <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-5">
        <h4 className="text-sm font-semibold text-white mb-2">Samenvatting</h4>
        <p className="text-sm text-gray-400 leading-relaxed">
          Dit project implementeerde end-to-end distributed tracing voor de VRT microservices-architectuur
          op AWS. Vijf Lambda-services werden geïnstrumenteerd met de AWS X-Ray SDK, aangevuld met
          real-time monitoring via CloudWatch en Grafana. Load tests bevestigden de verwachte
          gedragspatronen van elke service, en alerting werd geautomatiseerd bij afwijkende error rates.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Services',  value: '5' },
            { label: 'Endpoints', value: '5' },
            { label: 'Platform',  value: 'AWS' },
            { label: 'Regio',     value: 'eu-west-3' },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-[#0F1117] p-3 text-center">
              <p className="text-xl font-bold text-[#FF6600]">{s.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live load test stats ── */}
      {loadTestData ? (
        <div className="rounded-xl border border-[#FF6600]/30 bg-[#FF6600]/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#FF6600]" />
              <h4 className="text-sm font-semibold text-white">Load Test Resultaten – Live meting</h4>
            </div>
            <span className="text-xs text-gray-500">{loadTestData.timestamp}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Gemiddelde latentie',
                value: `${loadTestData.avg} ms`,
                color: loadTestData.avg > 1000 ? '#EF4444' : loadTestData.avg > 500 ? '#F59E0B' : '#10B981',
              },
              {
                label: '% Errors',
                value: `${loadTestData.errors}%`,
                color: loadTestData.errors > 20 ? '#EF4444' : loadTestData.errors > 5 ? '#F59E0B' : '#10B981',
              },
              {
                label: '% Slow (>1s)',
                value: `${loadTestData.slow}%`,
                color: loadTestData.slow > 30 ? '#EF4444' : loadTestData.slow > 10 ? '#F59E0B' : '#10B981',
              },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-[#2D3148] bg-[#12151F] p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Gebaseerd op {loadTestData.total} requests naar <span className="font-mono text-[#F59E0B]">/recommendation-service</span>
          </p>
        </div>
      ) : (
        /* CTA when no load test done yet */
        <div className="rounded-xl border border-dashed border-[#2D3148] p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1D27]">
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Geen meetdata beschikbaar</p>
            <p className="text-xs text-gray-500 mt-1">
              Voer eerst een Load Test uit om echte meetdata in het rapport te zien.
            </p>
          </div>
          <button
            onClick={onGoToLoadTest}
            className="inline-flex items-center gap-2 rounded-lg border border-[#FF6600]/40 px-4 py-2 text-sm font-medium text-[#FF6600] hover:bg-[#FF6600]/10 transition-colors"
          >
            Ga naar Load Test
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Static findings */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white">Bevindingen</h4>
        {STATIC_FINDINGS.map((f, i) => {
          const s = TYPE_STYLES[f.type]
          return (
            <div key={i} className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
              <div className="flex items-start gap-3">
                <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-sm font-medium text-white">{f.title}</h5>
                    <span className={`text-[10px] font-medium ${s.labelColor}`}>{s.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{f.body}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
