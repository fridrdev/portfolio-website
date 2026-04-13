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
          src="https://viewer:viewer123@grafana.fridrdev.uk/d/adswlgx/vrt-tracing-dashboard?orgId=1&theme=dark&refresh=30s"
          style={{
            width: '100%',
            height: 'calc(100% + 90px)',
            border: 'none',
            marginTop: '-90px',
          }}
        />
      </div>

      {/* Uitlegblok */}
      <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-5 space-y-2">
        <h4 className="text-sm font-semibold text-white">Over dit dashboard</h4>
        <p className="text-sm text-gray-400 leading-relaxed">
          Dit dashboard toont live telemetrie van de VRT recommendation-service, gemeten tijdens load tests op AWS Lambda.
          Data wordt verzameld via AWS X-Ray en CloudWatch, en gevisualiseerd via Grafana.
          De grafieken tonen latentie, errors en invocations in real-time.
        </p>
      </div>

    </div>
  )
}
