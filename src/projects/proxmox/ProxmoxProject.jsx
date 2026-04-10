import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TabOverview from './tabs/TabOverview.jsx'
import TabLiveDemo from './tabs/TabLiveDemo.jsx'
import TabNetwerk from './tabs/TabNetwerk.jsx'
import TabMonitoring from './tabs/TabMonitoring.jsx'
import TabAPI from './tabs/TabAPI.jsx'

const TABS = [
  { id: 'overview',    label: 'Overzicht'   },
  { id: 'live',        label: 'Live Demo'   },
  { id: 'netwerk',     label: 'Netwerk'     },
  { id: 'monitoring',  label: 'Monitoring'  },
  { id: 'api',         label: 'API Docs'    },
]

const BADGE_COLORS = {
  'Proxmox VE':        'bg-orange-900/60 text-orange-300 border-orange-700',
  'pfSense':           'bg-blue-900/60 text-blue-300 border-blue-700',
  'IPSec VPN':         'bg-purple-900/60 text-purple-300 border-purple-700',
  'Grafana':           'bg-orange-900/60 text-orange-300 border-orange-700',
  'Prometheus':        'bg-red-900/60 text-red-300 border-red-700',
  'Python Flask':      'bg-green-900/60 text-green-300 border-green-700',
  'Cloudflare Tunnel': 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
  'React':             'bg-cyan-900/60 text-cyan-300 border-cyan-700',
}

export default function ProxmoxProject({ project }) {
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0F1117]">
      {/* Header */}
      <header className="border-b border-[#2D3148] bg-[#0F1117]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Portfolio
          </button>
          <span className="text-[#2D3148]">/</span>
          <span className="text-sm text-white font-medium truncate">Multi-Site Datacenter PoC</span>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-[#2D3148] bg-[#12151F]">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {/* Logo mark */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3B82F6]">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="h-6 w-px bg-[#2D3148]" />
                <span className="text-xs text-gray-500">{project.school}</span>
              </div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{project.title}</h1>
              <p className="mt-2 text-gray-400 max-w-2xl leading-relaxed">{project.shortDescription}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.badges.map(b => (
                  <span
                    key={b}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${BADGE_COLORS[b] || 'bg-gray-800 text-gray-300 border-gray-600'}`}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-sm font-medium text-[#3B82F6]">{project.date}</span>
              <span className="text-xs text-gray-600">poc-cluster</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-5xl px-6">
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#3B82F6] text-[#3B82F6]'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {activeTab === 'overview'   && <TabOverview />}
        {activeTab === 'live'       && <TabLiveDemo />}
        {activeTab === 'netwerk'    && <TabNetwerk />}
        {activeTab === 'monitoring' && <TabMonitoring />}
        {activeTab === 'api'        && <TabAPI />}
      </main>
    </div>
  )
}
