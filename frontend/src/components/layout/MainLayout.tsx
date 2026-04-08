import Sidebar from './Sidebar'

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-[240px] h-[100svh] overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  )
}

