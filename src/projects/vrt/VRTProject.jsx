import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TabOverview from './tabs/TabOverview.jsx'
import TabLiveTester from './tabs/TabLiveTester.jsx'
import TabLoadTest from './tabs/TabLoadTest.jsx'
import TabDashboards from './tabs/TabDashboards.jsx'
import TabRapport from './tabs/TabRapport.jsx'

const TABS = [
  { id: 'overview', label: 'Overzicht' },
  { id: 'live', label: 'Live Tester' },
  { id: 'load', label: 'Load Test' },
  { id: 'dashboards', label: 'Dashboards' },
  { id: 'rapport', label: 'Rapport' },
]

const BADGE_COLORS = {
  'AWS Lambda': 'bg-orange-900/60 text-orange-300 border-orange-700',
  'X-Ray': 'bg-blue-900/60 text-blue-300 border-blue-700',
  'CloudWatch': 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
  'Grafana': 'bg-orange-900/60 text-orange-300 border-orange-700',
  'Python': 'bg-blue-900/60 text-blue-300 border-blue-700',
  'API Gateway': 'bg-purple-900/60 text-purple-300 border-purple-700',
}

export default function VRTProject({ project }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loadTestData, setLoadTestData] = useState(null)
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
          <span className="text-sm text-white font-medium truncate">VRT – Distributed Tracing</span>
        </div>
      </header>

      {/* Project hero */}
      <div className="border-b border-[#2D3148] bg-[#12151F]">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {/* VRT logo placeholder */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-16 items-center justify-center rounded-lg" style={{ background: '#FF6600' }}>
                  <span className="text-white font-black text-lg tracking-tighter">VRT</span>
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
              <span className="text-sm font-medium text-[#FF6600]">{project.date}</span>
              <span className="text-xs text-gray-600">AWS eu-west-3</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-5xl px-6">
          <nav className="flex gap-1 overflow-x-auto pb-0 -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#FF6600] text-[#FF6600]'
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
        {activeTab === 'overview' && <TabOverview />}
        {activeTab === 'live' && <TabLiveTester />}
        {activeTab === 'load' && <TabLoadTest onComplete={setLoadTestData} />}
        {activeTab === 'dashboards' && <TabDashboards />}
        {activeTab === 'rapport' && (
          <TabRapport
            project={project}
            loadTestData={loadTestData}
            onGoToLoadTest={() => setActiveTab('load')}
          />
        )}
      </main>
    </div>
  )
}
