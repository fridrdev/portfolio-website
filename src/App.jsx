import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import ProjectPage from './pages/ProjectPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects/:slug" element={<ProjectPage />} />
    </Routes>
  )
}
