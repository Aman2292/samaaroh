import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Login from './components/Login'
import Register from './components/Register'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ClientsList from './pages/Clients/ClientsList'
import EventsList from './pages/Events/EventsList'
import CreateEvent from './pages/Events/CreateEvent'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentView, setCurrentView] = useState('login') // 'login' | 'register'

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    setIsAuthenticated(false)
    setCurrentView('login')
  }

  if (!isAuthenticated) {
    return (
      <>
        {currentView === 'login' ? (
          <Login onLogin={handleLogin} onNavigate={setCurrentView} />
        ) : (
          <Register onLogin={handleLogin} onNavigate={setCurrentView} />
        )}
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    )
  }

  return (
    <Router>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/events" element={<EventsList />} />
          <Route path="/events/create" element={<CreateEvent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  )
}

export default App
