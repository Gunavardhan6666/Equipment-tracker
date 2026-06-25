import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import AppShell     from './components/layout/AppShell.jsx'
import Dashboard    from './pages/Dashboard.jsx'
import Inventory    from './pages/Inventory.jsx'
import ItemDetail   from './pages/ItemDetail.jsx'
import Kits         from './pages/Kits.jsx'
import Reservations from './pages/Reservations.jsx'
import NotFound     from './pages/NotFound.jsx'

// ─── Router ───────────────────────────────────────────────────────────────────
// AppShell is the root layout (sidebar + topbar). All pages are children
// injected via <Outlet/> in AppShell's <main>.
// ──────────────────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
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
  return <RouterProvider router={router} />
}
