import { useState, useEffect, useRef } from 'react'

/* ── Node definitions ─────────────────────────────────────────────── */
const NODES = [
  { id: 'api',      label: 'API Gateway',      short: 'AG', x: 50,  y: 12,  color: '#FF6600' },
  { id: 'video',    label: 'Video Service',     short: 'VS', x: 10,  y: 54,  color: '#3B82F6' },
  { id: 'user',     label: 'User Service',      short: 'US', x: 30,  y: 54,  color: '#8B5CF6' },
  { id: 'auth',     label: 'Auth Service',      short: 'AS', x: 50,  y: 54,  color: '#EF4444' },
  { id: 'analytics',label: 'Analytics',         short: 'AN', x: 70,  y: 54,  color: '#10B981' },
  { id: 'rec',      label: 'Recommendation',    short: 'RC', x: 90,  y: 54,  color: '#F59E0B' },
  { id: 'xray',     label: 'AWS X-Ray',         short: 'XR', x: 50,  y: 90,  color: '#FF6600' },
]

const EDGES = [
  ['api','video'], ['api','user'], ['api','auth'], ['api','analytics'], ['api','rec'],
  ['video','xray'], ['user','xray'], ['auth','xray'], ['analytics','xray'], ['rec','xray'],
]

/* Animation path: request flows api→auth→video→user→analytics→rec, then all→xray */
const ANIM_STEPS = [
  { from: 'api',       to: 'auth',      label: 'Auth check' },
  { from: 'api',       to: 'video',     label: 'Fetch video' },
  { from: 'api',       to: 'user',      label: 'Load user' },
  { from: 'api',       to: 'analytics', label: 'Log event' },
  { from: 'api',       to: 'rec',       label: 'Get recs' },
  { from: 'auth',      to: 'xray',      label: 'Trace auth' },
  { from: 'video',     to: 'xray',      label: 'Trace video' },
  { from: 'user',      to: 'xray',      label: 'Trace user' },
  { from: 'analytics', to: 'xray',      label: 'Trace analytics' },
  { from: 'rec',       to: 'xray',      label: 'Trace rec' },
]

function getNode(id) { return NODES.find(n => n.id === id) }

/* Lerp between two points at t∈[0,1] */
function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

/* The animated dot position for current step + progress 0→1 */
function dotPos(step, progress) {
  if (step == null || step >= ANIM_STEPS.length) return null
  const { from, to } = ANIM_STEPS[step]
  const a = getNode(from), b = getNode(to)
  const origin = { x: a.x, y: a.y + 5.5 }
  const dest   = { x: b.x, y: b.y - 5.5 }
  return lerp(origin, dest, progress)
}

const STEP_DURATION = 520   // ms per step
const FPS_INTERVAL  = 16    // ~60fps

export default function TabOverview() {
  const [animStep, setAnimStep]         = useState(null)   // null = idle
  const [progress, setProgress]         = useState(0)      // 0..1 within step
  const [activeNodes, setActiveNodes]   = useState(new Set())
  const [animLabel, setAnimLabel]       = useState('')
  const rafRef  = useRef(null)
  const stateRef = useRef({ step: null, startTime: null })

  function startAnimation() {
    cancelAnimation()
    setActiveNodes(new Set(['api']))
    setAnimStep(0)
    setProgress(0)
    setAnimLabel(ANIM_STEPS[0].label)
    stateRef.current = { step: 0, startTime: performance.now() }
    tick()
  }

  function cancelAnimation() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }

  function tick() {
    rafRef.current = requestAnimationFrame((now) => {
      const { step, startTime } = stateRef.current
      if (step == null) return
      const elapsed  = now - startTime
      const prog     = Math.min(elapsed / STEP_DURATION, 1)
      setProgress(prog)

      if (prog >= 1) {
        // step done — activate destination node
        const { to } = ANIM_STEPS[step]
        setActiveNodes(prev => new Set([...prev, to]))

        const nextStep = step + 1
        if (nextStep < ANIM_STEPS.length) {
          stateRef.current = { step: nextStep, startTime: performance.now() }
          setAnimStep(nextStep)
          setAnimLabel(ANIM_STEPS[nextStep].label)
          setProgress(0)
          tick()
        } else {
          // done
          stateRef.current = { step: null, startTime: null }
          setAnimStep(null)
          setAnimLabel('Voltooid ✓')
          setTimeout(() => {
            setActiveNodes(new Set())
            setAnimLabel('')
          }, 1200)
        }
      } else {
        tick()
      }
    })
  }

  // cleanup on unmount
  useEffect(() => () => cancelAnimation(), [])

  const dot = dotPos(animStep, progress)
  const isRunning = animStep !== null

  return (
    <div className="space-y-10">

      {/* Description */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Projectbeschrijving</h3>
        <p className="text-gray-400 leading-relaxed">
          Tijdens mijn stage bij VRT implementeerde ik een volledig distributed tracing systeem
          voor hun AWS microservices-architectuur. Het doel was om end-to-end zichtbaarheid te
          krijgen in hoe requests zich bewegen doorheen vijf Lambda-services, en anomalieën
          snel te kunnen opsporen via X-Ray, CloudWatch en Grafana.
        </p>
      </section>

      {/* Objectives */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Doelstellingen</h3>
        <ul className="space-y-2">
          {[
            'End-to-end tracing implementeren over 5 microservices',
            'Real-time monitoring dashboards opzetten in Grafana',
            'Automated alerting bij latentie-uitschieters en errors',
            "Load testing scenario's bouwen voor stressanalyse",
            'Documentatie en runbooks opstellen voor het ops-team',
          ].map(obj => (
            <li key={obj} className="flex items-start gap-2.5 text-sm text-gray-400">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6600]/20 text-[#FF6600] text-xs">✓</span>
              {obj}
            </li>
          ))}
        </ul>
      </section>

      {/* Tech stack */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Technologiestack</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { name: 'AWS Lambda',    desc: '5 Python microservices' },
            { name: 'AWS X-Ray',     desc: 'Distributed tracing' },
            { name: 'CloudWatch',    desc: 'Metrics & logs' },
            { name: 'API Gateway',   desc: 'HTTP REST endpoints' },
            { name: 'Grafana',       desc: 'Visualisatie dashboards' },
            { name: 'Python 3.12',   desc: 'Service implementatie' },
          ].map(t => (
            <div key={t.name} className="rounded-lg border border-[#2D3148] bg-[#12151F] p-3">
              <p className="text-sm font-medium text-white">{t.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture diagram */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Architectuurdiagram</h3>
          <div className="flex items-center gap-3">
            {animLabel && (
              <span className="text-xs text-[#FF6600] font-mono animate-pulse">{animLabel}</span>
            )}
            <button
              onClick={isRunning ? cancelAnimation : startAnimation}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isRunning
                  ? 'border border-red-700 text-red-400 hover:bg-red-900/20'
                  : 'bg-[#FF6600] text-white hover:bg-[#e55c00]'
              }`}
            >
              {isRunning ? (
                <>
                  <span className="h-2 w-2 rounded-sm bg-red-400" />
                  Stop
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Start animatie
                </>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#2D3148] bg-[#12151F] p-4">
          <svg viewBox="0 0 100 100" className="w-full" style={{ maxHeight: 360 }}>
            <defs>
              {/* Glow filter for active nodes */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Edges */}
            {EDGES.map(([a, b]) => {
              const na = getNode(a), nb = getNode(b)
              const isActive = animStep !== null &&
                ANIM_STEPS[animStep]?.from === a &&
                ANIM_STEPS[animStep]?.to === b
              return (
                <line
                  key={`${a}-${b}`}
                  x1={na.x} y1={na.y + 5.5}
                  x2={nb.x} y2={nb.y - 5.5}
                  stroke={isActive ? '#FF6600' : '#2D3148'}
                  strokeWidth={isActive ? '0.7' : '0.4'}
                  strokeDasharray={isActive ? 'none' : '1.5 1'}
                  style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                />
              )
            })}

            {/* Nodes */}
            {NODES.map(node => {
              const isActive = activeNodes.has(node.id)
              const isCurrent = animStep != null &&
                (ANIM_STEPS[animStep]?.from === node.id || ANIM_STEPS[animStep]?.to === node.id)
              return (
                <g key={node.id} filter={isCurrent ? 'url(#glow)' : undefined}>
                  {/* Outer glow ring when active */}
                  {isActive && (
                    <circle
                      cx={node.x} cy={node.y} r="7.5"
                      fill="none"
                      stroke={node.color}
                      strokeWidth="0.4"
                      opacity="0.4"
                    />
                  )}
                  {/* Main circle */}
                  <circle
                    cx={node.x} cy={node.y} r="5.5"
                    fill={node.color}
                    fillOpacity={isActive ? 0.35 : 0.12}
                    stroke={node.color}
                    strokeWidth={isActive ? '0.9' : '0.5'}
                    style={{ transition: 'fill-opacity 0.3s, stroke-width 0.3s' }}
                  />
                  {/* Abbreviation */}
                  <text
                    x={node.x} y={node.y + 0.8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="2.6"
                    fill={node.color}
                    fontWeight="bold"
                  >
                    {node.short}
                  </text>
                  {/* Label below */}
                  <text
                    x={node.x} y={node.y + 8.5}
                    textAnchor="middle"
                    fontSize="2.1"
                    fill={isActive ? '#D1D5DB' : '#6B7280'}
                    style={{ transition: 'fill 0.3s' }}
                  >
                    {node.label}
                  </text>
                </g>
              )
            })}

            {/* Animated dot */}
            {dot && (
              <circle
                cx={dot.x} cy={dot.y} r="1.6"
                fill="#FF6600"
                style={{ filter: 'drop-shadow(0 0 2px #FF6600)' }}
              />
            )}
          </svg>

          {/* Step progress bar */}
          {isRunning && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                <span>Stap {(animStep ?? 0) + 1} / {ANIM_STEPS.length}</span>
                <span className="text-[#FF6600]">{ANIM_STEPS[animStep]?.label}</span>
              </div>
              <div className="h-0.5 rounded-full bg-[#2D3148] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#FF6600] transition-all"
                  style={{ width: `${(((animStep ?? 0) + progress) / ANIM_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-600 mt-3">
            API Gateway → 5 Lambda-services → AWS X-Ray tracing
          </p>
        </div>
      </section>
    </div>
  )
}
