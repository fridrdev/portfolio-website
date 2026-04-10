function MetricRow({ name, query, description }) {
  return (
    <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
      <div>
        <p className="text-sm text-white font-medium">{name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <code className="text-xs text-emerald-300 font-mono shrink-0 sm:text-right">{query}</code>
    </div>
  )
}

export default function TabMonitoring() {
  return (
    <div className="flex flex-col gap-10">

      {/* Grafana section */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Grafana Dashboard</h3>
        <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600/20 border border-orange-700/50">
                <span className="text-orange-400 font-bold text-sm">G</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Grafana 11.4.0</p>
                <p className="text-xs text-gray-500">Node Exporter Full — Dashboard ID 1860</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Real-time monitoring van beide Proxmox-nodes. CPU-gebruik, geheugen, netwerk I/O en
              schijfactiviteit worden elke 15 seconden bijgewerkt via Prometheus scraping.
              Het dashboard toont de impact van een live VM-migratie op de infrastructuur.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Intern: http://192.168.99.10:3000
              </span>
              <span>·</span>
              <span>Login: admin / admin</span>
            </div>
          </div>
          <a
            href="https://grafana.fridrdev.uk"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors"
          >
            Open Grafana Dashboard
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* What is monitored */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '🖥️', label: 'CPU Gebruik',    detail: 'Per core utilization' },
            { icon: '💾', label: 'Geheugen',       detail: 'RAM usage & cache' },
            { icon: '🌐', label: 'Netwerk I/O',    detail: 'TX/RX per interface' },
            { icon: '💿', label: 'Schijf I/O',     detail: 'Read/write throughput' },
          ].map(({ icon, label, detail }) => (
            <div key={label} className="rounded-lg border border-[#2D3148] bg-[#1A1D27] p-3 text-center">
              <p className="text-xl mb-1">{icon}</p>
              <p className="text-xs font-semibold text-white">{label}</p>
              <p className="text-xs text-gray-600 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prometheus section */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Prometheus + Node Exporter</h3>
        <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2 rounded border border-[#2D3148] bg-[#0F1117] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-gray-300">Prometheus</span>
              <span className="text-gray-600">http://localhost:9090</span>
            </div>
            <div className="flex items-center gap-2 rounded border border-[#2D3148] bg-[#0F1117] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-300">Node Exporter</span>
              <span className="text-gray-600">:9100/metrics</span>
            </div>
            <div className="flex items-center gap-2 rounded border border-[#2D3148] bg-[#0F1117] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-gray-300">Grafana</span>
              <span className="text-gray-600">:3000</span>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Node Exporter draait op pve-ny-01 en scrapet systeemmetrics. Prometheus scrapt elke 15 seconden.
            Grafana visualiseert via de Prometheus datasource (URL: <code className="text-blue-300">http://localhost:9090</code>).
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <MetricRow
            name="CPU Usage"
            query="100 - (avg by(cpu)(rate(node_cpu_seconds_total{mode='idle'}[5m])) * 100)"
            description="Gemiddeld CPU gebruik over 5 minuten"
          />
          <MetricRow
            name="Memory Available"
            query="node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100"
            description="Percentage beschikbaar RAM"
          />
          <MetricRow
            name="Network TX"
            query="rate(node_network_transmit_bytes_total{device='vmbr0'}[1m]) * 8"
            description="Netwerk doorvoer (bits/sec) op vmbr0"
          />
          <MetricRow
            name="Disk Read"
            query="rate(node_disk_read_bytes_total[1m])"
            description="Schijf leessnelheid per seconde"
          />
        </div>
      </section>

      {/* Setup recap */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Setup (recap)</h3>
        <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-4">
          <ol className="flex flex-col gap-2 text-sm text-gray-400 list-decimal list-inside">
            <li>Grafana 11.4.0 installeren op pve-ny-01 via apt</li>
            <li><code className="text-emerald-300 text-xs">apt install prometheus prometheus-node-exporter</code></li>
            <li>Grafana datasource: Prometheus → <code className="text-blue-300 text-xs">http://localhost:9090</code></li>
            <li>Dashboard importeren: ID <strong className="text-white">1860</strong> (Node Exporter Full)</li>
            <li>Datasource selecteren: <code className="text-blue-300 text-xs">prometheus</code> → Import</li>
          </ol>
        </div>
      </section>

    </div>
  )
}
