import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App page="dashboard" />} />
        <Route path="/daily" element={<App page="daily" />} />
        <Route path="/weekly" element={<App page="weekly" />} />
        <Route path="/completed" element={<App page="completed" />} />
        <Route path="/upcoming" element={<App page="upcoming" />} />
        <Route path="/analytics" element={<App page="analytics" />} />
        <Route path="/categories" element={<App page="categories" />} />
        <Route path="/settings" element={<App page="settings" />} />
        <Route path="*" element={<App page="dashboard" />} />
      </Routes>
    </Router>
  </StrictMode>,
)
