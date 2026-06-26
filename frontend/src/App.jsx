import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AuthProvider }    from './context/AuthContext.jsx'
import ProtectedRoute      from './components/auth/ProtectedRoute.jsx'

import AppShell     from './components/layout/AppShell.jsx'
import Dashboard    from './pages/Dashboard.jsx'
import Inventory    from './pages/Inventory.jsx'
import ItemDetail   from './pages/ItemDetail.jsx'
import Kits         from './pages/Kits.jsx'
import Reservations from './pages/Reservations.jsx'
import NotFound     from './pages/NotFound.jsx'
import Login        from './pages/Login.jsx'
import Register     from './pages/Register.jsx'

// ─── Router ───────────────────────────────────────────────────────────────────
// /login  and /register are public (no AppShell, no ProtectedRoute).
// All other routes live inside AppShell and require authentication.
// ──────────────────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  // ── Public auth pages (no sidebar, no topbar) ──────────────────────────────
  { path: '/login',    element: <Login /> },
  { path: '/register', element: <Register /> },

  // ── Protected app shell ────────────────────────────────────────────────────
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true,              element: <Dashboard /> },
      { path: 'inventory',        element: <Inventory /> },
      { path: 'inventory/:id',    element: <ItemDetail /> },
      { path: 'kits',             element: <Kits /> },
      { path: 'reservations',     element: <Reservations /> },
      { path: '*',                element: <NotFound /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
