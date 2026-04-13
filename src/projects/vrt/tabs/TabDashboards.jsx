export default function TabDashboards() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">Live Monitoring Dashboards</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Live monitoring van VRT distributed tracing via Grafana + AWS CloudWatch
        </p>
      </div>

      {/* Grafana iframe — toolbar verborgen via negatieve marginTop */}
      <div style={{
        width: '100%',
        height: '800px',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '8px',
      }}>
        <iframe
          src="https://grafana.fridrdev.uk/d/adswlgx/vrt-tracing-dashboard?orgId=1&theme=dark&refresh=30s"
          style={{
            width: '100%',
            height: 'calc(100% + 90px)',
            border: 'none',
            marginTop: '-90px',
          }}
        />
      </div>

    </div>
  )
}
