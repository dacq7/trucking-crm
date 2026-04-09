import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="ml-0 h-[100svh] overflow-y-auto bg-slate-50 lg:ml-[240px]">
        {/* Mobile top bar — hamburger button */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-200"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-slate-900">Trucking CRM</span>
        </div>

        {children}
      </main>
    </div>
  )
}
