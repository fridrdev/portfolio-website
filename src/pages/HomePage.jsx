import { useNavigate } from 'react-router-dom'
import { projects } from '../projects.config.js'

const BADGE_COLORS = {
  'AWS Lambda': 'bg-orange-900/60 text-orange-300 border-orange-700',
  'X-Ray': 'bg-blue-900/60 text-blue-300 border-blue-700',
  'CloudWatch': 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
  'Grafana': 'bg-orange-900/60 text-orange-300 border-orange-700',
  'Python': 'bg-blue-900/60 text-blue-300 border-blue-700',
  'API Gateway': 'bg-purple-900/60 text-purple-300 border-purple-700',
}

function Badge({ label }) {
  const cls = BADGE_COLORS[label] || 'bg-gray-800 text-gray-300 border-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  )
}

function ProjectCard({ project }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/projects/${project.slug}`)}
      className="group relative cursor-pointer rounded-xl border border-[#2D3148] bg-[#1A1D27] p-6 transition-all duration-300 hover:border-[#FF6600]/60 hover:bg-[#1E2133] hover:shadow-lg hover:shadow-[#FF6600]/10 hover:-translate-y-0.5"
    >
      {/* accent bar */}
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-[#FF6600] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white group-hover:text-[#FF6600] transition-colors duration-200">
            {project.title}
          </h2>
          <p className="mt-1.5 text-sm text-gray-400 leading-relaxed max-w-2xl">
            {project.shortDescription}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.badges.map(b => <Badge key={b} label={b} />)}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span className="text-xs text-gray-500">{project.school}</span>
          <span className="text-xs font-medium text-[#FF6600]">{project.date}</span>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 group-hover:text-[#FF6600] transition-colors duration-200">
            Bekijk project
            <svg className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F1117]">
      {/* Header */}
      <header className="border-b border-[#2D3148] bg-[#0F1117]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF6600] text-white font-bold text-sm">
              FD
            </div>
            <span className="text-white font-semibold tracking-tight">Frider Dev</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#projects" className="hover:text-white transition-colors">Projecten</a>
            <a href="mailto:contact@friderdev.be" className="hover:text-white transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-12">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#FF6600]/30 bg-[#FF6600]/10 px-3 py-1 text-xs text-[#FF6600]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF6600] animate-pulse" />
          Cloud & DevOps Engineer
        </div>
        <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">
          Portfolio{' '}
          <span className="text-[#FF6600]">Vitrine</span>
        </h1>
        <p className="mt-4 max-w-xl text-gray-400 text-lg leading-relaxed">
          Hands-on projecten rond cloud architectuur, observability en DevOps —
          gebouwd met AWS, Python en moderne tooling.
        </p>
      </section>

      {/* Projects */}
      <main id="projects" className="mx-auto max-w-4xl px-6 pb-24">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Projecten</h2>
          <div className="flex-1 h-px bg-[#2D3148]" />
          <span className="text-xs text-gray-600">{projects.length} project{projects.length !== 1 ? 'en' : ''}</span>
        </div>

        <div className="flex flex-col gap-4">
          {projects.map(p => <ProjectCard key={p.slug} project={p} />)}
        </div>

        {/* Placeholder */}
        <div className="mt-6 rounded-xl border border-dashed border-[#2D3148] p-6 text-center">
          <p className="text-sm text-gray-600">Meer projecten komen eraan...</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2D3148] py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Frider Dev — Odisee Hogeschool
      </footer>
    </div>
  )
}
