import { useParams, useNavigate } from 'react-router-dom'
import { Suspense, lazy, useMemo } from 'react'
import { projects } from '../projects.config.js'

// Dynamically import project components
const projectComponents = {
  'vrt-tracing': lazy(() => import('../projects/vrt/VRTProject.jsx')),
}

export default function ProjectPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const project = useMemo(() => projects.find(p => p.slug === slug), [slug])
  const Component = projectComponents[slug]

  if (!project || !Component) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex flex-col items-center justify-center gap-4 text-gray-400">
        <p className="text-2xl font-semibold text-white">Project niet gevonden</p>
        <button onClick={() => navigate('/')} className="text-[#FF6600] hover:underline text-sm">
          ← Terug naar overzicht
        </button>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-[#FF6600] border-t-transparent animate-spin" />
            <p className="text-gray-500 text-sm">Laden...</p>
          </div>
        </div>
      }
    >
      <Component project={project} />
    </Suspense>
  )
}
