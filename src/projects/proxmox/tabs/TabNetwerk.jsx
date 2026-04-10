/* ─── helpers ──────────────────────────────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mt-2">
      {children}
    </h3>
  )
}

function Table({ head, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#2D3148]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2D3148] bg-[#12151F]">
            {head.map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-[#2D3148]/60 last:border-0 hover:bg-[#1A1D27]/60 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-gray-300 text-sm font-mono">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Badge({ children, color }) {
  const cls = {
    green:  'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    blue:   'bg-blue-900/40 text-blue-400 border-blue-700/50',
    purple: 'bg-purple-900/40 text-purple-400 border-purple-700/50',
  }[color] ?? 'bg-gray-800 text-gray-400 border-gray-600'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {children}
    </span>
  )
}

/* ─── IPSec detail block ───────────────────────────────────────────────────── */
function IPSecSide({ title, data }) {
  return (
    <div className="flex-1 rounded-xl border border-[#2D3148] bg-[#12151F] p-4 flex flex-col gap-2">
      <p className="text-sm font-semibold text-blue-400">{title}</p>
      {data.map(([k, v]) => (
        <div key={k} className="flex justify-between text-xs gap-2">
          <span className="text-gray-500 shrink-0">{k}</span>
          <span className="text-gray-200 font-mono text-right">{v}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── pfSense column ───────────────────────────────────────────────────────── */
function PfSenseCard({ title, rows }) {
  return (
    <div className="flex-1 rounded-xl border border-[#2D3148] bg-[#12151F] p-4 flex flex-col gap-2">
      <p className="text-sm font-semibold text-blue-400">{title}</p>
      {rows.map(([iface, ip, purpose]) => (
        <div key={iface} className="rounded border border-[#2D3148] bg-[#0F1117] px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white">{iface}</span>
            <span className="text-xs font-mono text-blue-300">{ip}</span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">{purpose}</p>
        </div>
      ))}
    </div>
  )
}

/* ─── Main ─────────────────────────────────────────────────────────────────── */
export default function TabNetwerk() {
  return (
    <div className="flex flex-col gap-8">

      {/* VMware virtual networks */}
      <section className="flex flex-col gap-4">
        <SectionTitle>VMware Workstation Virtuele Netwerken</SectionTitle>
        <Table
          head={['VMnet', 'Subnet', 'IP (host-side)', 'Functie']}
          rows={[
            ['VMnet2', '192.168.10.0/24', '192.168.10.1',  'New York LAN'],
            ['VMnet3', '192.168.20.0/24', '192.168.20.1',  'Brussel LAN'],
            ['VMnet4', '192.168.30.0/24', '192.168.30.1',  'VPN Tunnel / WAN'],
            ['VMnet5', '192.168.99.0/24', '192.168.99.1',  'Management (Proxmox web-UI)'],
            ['VMnet8', 'NAT (DHCP)',       '192.168.21.1',  'Internet (package installs)'],
          ]}
        />
        <p className="text-xs text-gray-600">
          Alle VMnets zijn geconfigureerd als <strong className="text-gray-400">Host-only</strong> (geïsoleerd), behalve VMnet8 (NAT).
          De Windows-host heeft een virtuele NIC in elke VMnet zodat Proxmox bereikbaar is via de browser.
        </p>
      </section>

      {/* Proxmox nodes */}
      <section className="flex flex-col gap-4">
        <SectionTitle>Proxmox Cluster — Node IP-tabel</SectionTitle>
        <Table
          head={['Node', 'Management IP', 'LAN IP', 'Tunnel IP', 'Web-UI']}
          rows={[
            ['pve-ny-01',  '192.168.99.10', '192.168.10.x', '192.168.30.x', 'https://192.168.99.10:8006'],
            ['pve-bxl-01', '192.168.99.11', '192.168.20.x', '192.168.30.x', 'https://192.168.99.11:8006'],
          ]}
        />
        <div className="rounded-xl border border-blue-700/30 bg-blue-900/10 p-4 text-xs text-blue-300">
          <strong>Opmerking:</strong> De internet-route op pve-ny-01 moet na elke herstart manueel hersteld worden:
          <pre className="mt-2 text-emerald-300 bg-[#0F1117] rounded p-2 overflow-x-auto">
            ip link set ens39 up && dhclient ens39{'\n'}
            ip route add default via 192.168.21.2 dev ens39
          </pre>
        </div>
      </section>

      {/* IPSec details */}
      <section className="flex flex-col gap-4">
        <SectionTitle>IPSec VPN Tunnel — Configuratie</SectionTitle>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge color="green">● ESTABLISHED</Badge>
          <Badge color="blue">IKEv2 Initiator</Badge>
          <Badge color="purple">AES_CBC_256 / HMAC_SHA2_256</Badge>
          <Badge color="blue">Child SA: 1 Connected</Badge>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <IPSecSide
            title="Phase 1 — IKE SA"
            data={[
              ['Key Exchange',  'IKEv2'],
              ['Interface',     'VPNTUNNEL (VMnet4)'],
              ['Authentication','Mutual PSK'],
              ['PSK',           'PocTunnel@2025!'],
              ['Encryption',    'AES 256-bit'],
              ['Hash',          'SHA256'],
              ['DH Group',      '14 (2048-bit)'],
              ['Lifetime',      '28800s'],
            ]}
          />
          <IPSecSide
            title="Phase 2 — Child SA (Tunnel)"
            data={[
              ['Mode',          'Tunnel IPv4'],
              ['NY local',      '192.168.10.0/24'],
              ['NY remote GW',  '192.168.30.2 (BXL)'],
              ['BXL local',     '192.168.20.0/24'],
              ['BXL remote GW', '192.168.30.1 (NY)'],
              ['Protocol',      'ESP'],
              ['Encryption',    'AES256'],
              ['Hash',          'SHA256'],
              ['PFS Group',     '14'],
              ['Keep Alive',    '192.168.10.1 / 192.168.20.1'],
            ]}
          />
        </div>
      </section>

      {/* pfSense */}
      <section className="flex flex-col gap-4">
        <SectionTitle>pfSense Firewall Configuratie</SectionTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <PfSenseCard
            title="pfSense-NY (192.168.30.1)"
            rows={[
              ['WAN',        'DHCP (VMnet8)',    'Internet toegang'],
              ['LAN',        '192.168.10.1/24',  'New York interne LAN'],
              ['VPNTUNNEL',  '192.168.30.1/24',  'IPSec tunnel endpoint'],
            ]}
          />
          <PfSenseCard
            title="pfSense-BXL (192.168.30.2)"
            rows={[
              ['WAN',        'DHCP (VMnet8)',    'Internet toegang'],
              ['LAN',        '192.168.20.1/24',  'Brussel interne LAN'],
              ['VPNTUNNEL',  '192.168.30.2/24',  'IPSec tunnel endpoint'],
            ]}
          />
        </div>
        <Table
          head={['Firewall regel', 'Interface', 'Actie', 'Beide nodes']}
          rows={[
            ['Allow LAN outbound', 'LAN',   'Pass / Any / LAN subnet → Any', '✅'],
            ['Allow IPsec inbound','IPsec', 'Pass / Any / Any → Any',        '✅'],
            ['Allow VPN tunnel',   'WAN',   'Pass / UDP / 500 + 4500',       '✅'],
          ]}
        />
      </section>

      {/* Ping benchmark */}
      <section className="flex flex-col gap-4">
        <SectionTitle>Latentie Resultaten (gemeten met ping)</SectionTitle>
        <Table
          head={['Scenario', 'Gemiddelde (avg)', 'Packet Loss', 'Methode']}
          rows={[
            ['Lokaal management (NY → BXL)', '0.286 ms',   '0%', 'ping via VMnet5'],
            ['Via IPSec VPN tunnel',          '0.681 ms',   '0%', 'ping via VMnet4'],
            ['Gesimuleerde WAN (+100ms)',      '100.337 ms', '0%', 'tc netem delay 100ms op vmbr0'],
          ]}
        />
        <p className="text-xs text-gray-600">
          Latentie simulatie: <code className="text-emerald-300">tc qdisc add dev vmbr0 root netem delay 100ms</code>
          &nbsp; — simuleert een transatlantische WAN-verbinding (typisch 80–120ms).
        </p>
      </section>

    </div>
  )
}
