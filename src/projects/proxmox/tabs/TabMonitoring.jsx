export default function TabMonitoring() {
  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">
          Live Monitoring
        </h3>
        <p className="text-sm text-gray-400">
          Live monitoring van <span className="text-white font-mono">proxmox-ny</span> via Prometheus + Grafana
        </p>
      </div>

      {/* Grafana iframe — toolbar verborgen via negatieve marginTop */}
      <div className="rounded-xl border border-[#2D3148]" style={{
        width: '100%',
        height: '800px',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '8px',
      }}>
        <iframe
          src="https://grafana.fridrdev.uk/d/rYdddlPWk/node-exporter-full?orgId=1&theme=dark&refresh=30s"
          style={{
            width: '100%',
            height: 'calc(100% + 90px)',
            border: 'none',
            marginTop: '-90px',
          }}
          title="Grafana — proxmox-ny live dashboard"
          allow="fullscreen"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>

      {/* Footer link */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-gray-600">
          Powered by Grafana 11 + Prometheus · Node Exporter Full (ID 1860)
        </p>
        <a
          href="https://grafana.fridrdev.uk"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          Open in nieuw tabblad
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

    </div>
  )
}
