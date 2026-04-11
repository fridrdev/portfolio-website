import { useState } from 'react'

/* ─── keyframes injected once ─────────────────────────────────────────────── */
const STYLES = `
@keyframes tunnel-flow {
  0%   { left: -45%; }
  100% { left: 145%; }
}
@keyframes vm-fly-right {
  0%   { transform: translateX(0)   opacity: 1; }
  40%  { transform: translateX(30px); opacity: 0.6; }
  60%  { transform: translateX(60%); opacity: 0.6; }
  100% { transform: translateX(330px); opacity: 1; }
}
@keyframes vm-fly-left {
  0%   { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(-330px); opacity: 1; }
}
`

/* ─── Animated tunnel line ─────────────────────────────────────────────────── */
function TunnelLine() {
  return (
    <div className="relative w-full h-2 bg-blue-900/20 rounded-full overflow-hidden">
      <div
        className="absolute top-0 h-full rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
        style={{ width: '45%', animation: 'tunnel-flow 2s linear infinite' }}
      />
    </div>
  )
}

/* ─── Architecture diagram ─────────────────────────────────────────────────── */
function ArchDiagram() {
  const [vmSide, setVmSide]       = useState('ny')   // 'ny' | 'bxl'
  const [migrating, setMigrating] = useState(false)

  function demo() {
    if (migrating) return
    setMigrating(true)
    setTimeout(() => {
      setVmSide(s => s === 'ny' ? 'bxl' : 'ny')
      setMigrating(false)
    }, 1800)
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-stretch gap-4">

          {/* ── NY Datacenter ── */}
          <div className="flex-1 rounded-lg border border-blue-500/40 bg-[#0F1117] p-4 flex flex-col gap-2 min-w-0">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">🌆 New York DC</p>

            {/* proxmox-ny */}
            <div className="rounded border border-[#2D3148] bg-[#1A1D27] p-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-white font-mono">proxmox-ny</span>
              </div>
              <p className="text-xs text-gray-600 font-mono mt-0.5">10.132.0.3 · europe-west1-b</p>
            </div>

            {/* VM 100 (NY side) */}
            <div
              className="rounded border border-blue-600 bg-blue-900/30 p-2 transition-all duration-700"
              style={{
                opacity:    vmSide === 'ny' ? 1 : 0,
                transform:  vmSide === 'ny' ? 'translateX(0)' : 'translateX(20px)',
              }}
            >
              <p className="text-xs text-blue-300 font-mono">📦 VM 100 — test-vm-ny</p>
              <p className="text-xs text-gray-600 mt-0.5">Debian 12 · 2 vCPU · 4 GB RAM</p>
            </div>

            {/* Flask API */}
            <div className="mt-auto rounded border border-gray-700/50 bg-[#0F1117] p-1.5 text-center">
              <p className="text-xs text-gray-500 font-mono">Flask API · 10.132.0.4</p>
            </div>
          </div>

          {/* ── VPN tunnel ── */}
          <div className="flex flex-col items-center justify-center gap-3 shrink-0 sm:w-32 w-full sm:py-0 py-2">
            <p className="text-xs text-blue-400 font-semibold whitespace-nowrap">IPSec IKEv2</p>
            <TunnelLine />
            <p className="text-xs text-gray-600 whitespace-nowrap">AES-256 · SHA256</p>
            <button
              onClick={demo}
              disabled={migrating}
              className="mt-1 text-xs px-3 py-1.5 rounded border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {migrating
                ? '⏳ migrating…'
                : vmSide === 'ny' ? '→ Demo →' : '← Demo ←'}
            </button>
          </div>

          {/* ── BXL Datacenter ── */}
          <div className="flex-1 rounded-lg border border-blue-500/40 bg-[#0F1117] p-4 flex flex-col gap-2 min-w-0">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">🏛️ Brussels DC</p>

            {/* proxmox-bxl */}
            <div className="rounded border border-[#2D3148] bg-[#1A1D27] p-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-white font-mono">proxmox-bxl</span>
              </div>
              <p className="text-xs text-gray-600 font-mono mt-0.5">10.164.0.2 · europe-west4-a</p>
            </div>

            {/* VM 100 (BXL side) */}
            <div
              className="rounded border border-blue-600 bg-blue-900/30 p-2 transition-all duration-700"
              style={{
                opacity:   vmSide === 'bxl' ? 1 : 0,
                transform: vmSide === 'bxl' ? 'translateX(0)' : 'translateX(-20px)',
              }}
            >
              <p className="text-xs text-blue-300 font-mono">📦 VM 100 — test-vm-ny</p>
              <p className="text-xs text-gray-600 mt-0.5">Debian 12 · 2 vCPU · 4 GB RAM</p>
            </div>

            {/* GCP zone */}
            <div className="mt-auto rounded border border-gray-700/50 bg-[#0F1117] p-1.5 text-center">
              <p className="text-xs text-gray-500 font-mono">GCP · europe-west4-a</p>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-gray-600">
          Klik <span className="text-blue-400">→ Demo →</span> om de VM live te migreren zonder downtime
        </p>
      </div>
    </>
  )
}

/* ─── Benchmark card ───────────────────────────────────────────────────────── */
function BenchCard({ icon, value, label, color }) {
  return (
    <div className="rounded-xl border border-[#2D3148] bg-[#1A1D27] p-4 flex flex-col gap-1">
      <p className="text-xl">{icon}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

/* ─── Tech badge ───────────────────────────────────────────────────────────── */
function Tech({ name, detail, color }) {
  return (
    <div className={`rounded-lg border ${color} bg-opacity-10 px-3 py-2`}>
      <p className="text-xs font-semibold text-white">{name}</p>
      <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
    </div>
  )
}

/* ─── Main export ──────────────────────────────────────────────────────────── */
export default function TabOverview() {
  return (
    <div className="flex flex-col gap-10">

      {/* Hero */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-white">Multi-Site Datacenter PoC</h2>
        <p className="text-gray-400 leading-relaxed max-w-3xl">
          Dit project simuleert een enterprise multi-site infrastructuur op een lokale machine. Twee virtuele
          datacenters — New York en Brussel — zijn verbonden via een versleutelde <strong className="text-white">IPSec IKEv2 VPN-tunnel</strong>.
          Een Proxmox-cluster van twee nodes laat toe om virtuele machines <strong className="text-white">live te migreren zonder downtime</strong>,
          exact zoals vMotion in VMware vSphere. Realtime monitoring via <strong className="text-white">Grafana + Prometheus</strong> toont CPU,
          geheugen en netwerk van beide nodes. Een Python Flask API en een Cloudflare-tunnel maken de
          volledige infrastructuur extern bereikbaar.
        </p>
      </section>

      {/* Architecture diagram */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Architectuur</h3>
        <ArchDiagram />
      </section>

      {/* Benchmarks */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Benchmark Resultaten</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <BenchCard icon="⚡" value="0.286ms"        label="Management Latentie"       color="text-emerald-400" />
          <BenchCard icon="🔐" value="0.681ms"        label="VPN Tunnel Latentie"       color="text-blue-400"    />
          <BenchCard icon="🌍" value="100.337ms"      label="Gesimuleerde WAN (netem)"  color="text-yellow-400"  />
          <BenchCard icon="🚀" value="6.82 Gbits/s"   label="Bandbreedte NY↔BXL"        color="text-blue-300"    />
          <BenchCard icon="✅" value="0%"             label="Packet Loss bij migratie"  color="text-emerald-400" />
        </div>
      </section>

      {/* Tech stack */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Technologieën</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Tech name="Proxmox VE 9.1"           detail="Hypervisor + live migratie"     color="border-orange-700/40"  />
          <Tech name="pfSense 2.8.1"            detail="Firewall + IPSec VPN"           color="border-blue-700/40"    />
          <Tech name="IPSec IKEv2"              detail="AES-256 · SHA256 · DH-14"       color="border-purple-700/40"  />
          <Tech name="Grafana 11.4.0"           detail="Realtime monitoring"            color="border-orange-700/40"  />
          <Tech name="Prometheus"               detail="Metrics + Node Exporter"        color="border-red-700/40"     />
          <Tech name="Python Flask"             detail="REST API · proxmoxer"           color="border-green-700/40"   />
          <Tech name="Cloudflare Zero Trust"    detail="Tunnel naar api.fridrdev.uk"    color="border-yellow-700/40"  />
          <Tech name="VMware Workstation 17"    detail="Nested virtualisation host"     color="border-gray-600/40"    />
        </div>
      </section>

    </div>
  )
}
