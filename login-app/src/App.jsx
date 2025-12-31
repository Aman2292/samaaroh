import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Login from './components/Login'
import Register from './components/Register'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ClientsList from './pages/Clients/ClientsList'
import EventsList from './pages/Events/EventsList'
import EventDetail from './pages/Events/EventDetail'
import CreateEvent from './pages/Events/CreateEvent'
import OutstandingPayments from './pages/Payments/OutstandingPayments'
import OrganizationsList from './pages/Admin/OrganizationsList'
import AdminOrganizationDetails from './pages/Admin/AdminOrganizationDetails'
import UsersList from './pages/Admin/UsersList'
import AdminEvents from './pages/Admin/AdminEvents'
import MyProfile from './pages/Profile/MyProfile'
import OrganizationSettings from './pages/Settings/OrganizationSettings'
import ActivityLogs from './pages/ActivityLogs/ActivityLogs'
import SetPassword from './pages/Public/SetPassword'
import TeamList from './pages/Team/TeamList'
import Venue from './pages/Venue/Venue'
import TasksPage from './pages/Tasks/TasksPage'
import InvoicesList from './pages/Invoices/InvoicesList'
import CreateInvoice from './pages/Invoices/CreateInvoice'
import GuestsList from './pages/Guests/GuestsList'
import CheckInScanner from './pages/CheckIn/CheckInScanner'
import DocumentsList from './pages/Documents/DocumentsList'

// Wrapper component to handle authentication state
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
    navigate('/')
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    setIsAuthenticated(false)
    navigate('/login')
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public Routes */}
        <Route path="/accept-invitation/:token" element={<SetPassword />} />
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} onNavigate={(path) => navigate('/' + path)} /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!isAuthenticated ? <Register onLogin={handleLogin} onNavigate={(path) => navigate('/' + path)} /> : <Navigate to="/" replace />} />

        {/* Protected Routes */}
        <Route path="/" element={isAuthenticated ? <Layout onLogout={handleLogout}><Dashboard /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/admin/organizations" element={isAuthenticated ? <Layout onLogout={handleLogout}><OrganizationsList /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/admin/organizations/:id" element={isAuthenticated ? <Layout onLogout={handleLogout}><AdminOrganizationDetails /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/admin/users" element={isAuthenticated ? <Layout onLogout={handleLogout}><UsersList /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/admin/events" element={isAuthenticated ? <Layout onLogout={handleLogout}><AdminEvents /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/clients" element={isAuthenticated ? <Layout onLogout={handleLogout}><ClientsList /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/events" element={isAuthenticated ? <Layout onLogout={handleLogout}><EventsList /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/events/create" element={isAuthenticated ? <Layout onLogout={handleLogout}><CreateEvent /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/events/:id" element={isAuthenticated ? <Layout onLogout={handleLogout}><EventDetail /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/payments/outstanding" element={isAuthenticated ? <Layout onLogout={handleLogout}><OutstandingPayments /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={isAuthenticated ? <Layout onLogout={handleLogout}><MyProfile /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={isAuthenticated ? <Layout onLogout={handleLogout}><OrganizationSettings /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/activity-logs" element={isAuthenticated ? <Layout onLogout={handleLogout}><ActivityLogs /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/team" element={isAuthenticated ? <Layout onLogout={handleLogout}><TeamList /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/venue" element={isAuthenticated ? <Layout onLogout={handleLogout}><Venue /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/tasks" element={isAuthenticated ? <Layout onLogout={handleLogout}><TasksPage /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/invoices" element={isAuthenticated ? <Layout onLogout={handleLogout}><InvoicesList /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/invoices/create" element={isAuthenticated ? <Layout onLogout={handleLogout}><CreateInvoice /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/invoices/edit/:id" element={isAuthenticated ? <Layout onLogout={handleLogout}><CreateInvoice mode="edit" /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/events/:eventId/guests" element={isAuthenticated ? <Layout onLogout={handleLogout}><GuestsList /></Layout> : <Navigate to="/login" replace />} />
        <Route path="/events/:eventId/check-in" element={isAuthenticated ? <CheckInScanner /> : <Navigate to="/login" replace />} />
        <Route path="/documents" element={isAuthenticated ? <Layout onLogout={handleLogout}><DocumentsList /></Layout> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
