import { NavLink } from 'react-router-dom'
import {
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Truck,
  UserCog,
  Users,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

function roleLabel(role) {
  if (role === 'ADMIN') return 'Admin'
  return 'Vendor'
}

export default function Sidebar() {
  const { user, logout } = useAuth()

  const navItemClass =
    'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition'
  const navActiveClass = 'bg-purple-600 text-white'
  const navInactiveClass = 'text-slate-700 hover:bg-slate-100'

  const role = user?.role
  const showUsers = role === 'ADMIN'

  return (
    <aside className="fixed left-0 top-0 z-30 h-[100svh] w-[240px] border-r border-slate-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="px-4 py-5">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg ${
                isActive ? 'text-purple-700' : 'text-slate-900'
              }`
            }
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <Truck size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold leading-5 text-slate-900">
                Trucking CRM
              </div>
              <div className="mt-0.5 text-xs text-slate-500">Trucking Insurance</div>
            </div>
          </NavLink>
        </div>

        <nav className="flex-1 px-3">
          <div className="space-y-1">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `${navItemClass} ${isActive ? navActiveClass : navInactiveClass}`
              }
            >
              <LayoutDashboard size={16} />
              Dashboard
            </NavLink>

            <NavLink
              to="/clients"
              end
              className={({ isActive }) =>
                `${navItemClass} ${isActive ? navActiveClass : navInactiveClass}`
              }
            >
              <Users size={16} />
              Clients
            </NavLink>

            <NavLink
              to="/cases"
              end
              className={({ isActive }) =>
                `${navItemClass} ${isActive ? navActiveClass : navInactiveClass}`
              }
            >
              <FolderOpen size={16} />
              Cases
            </NavLink>

            <NavLink
              to="/policies"
              end
              className={({ isActive }) =>
                `${navItemClass} ${isActive ? navActiveClass : navInactiveClass}`
              }
            >
              <FileText size={16} />
              Policies
            </NavLink>

            {showUsers ? (
              <NavLink
                to="/users"
                end
                className={({ isActive }) =>
                  `${navItemClass} ${isActive ? navActiveClass : navInactiveClass}`
                }
              >
                <UserCog size={16} />
                Users
              </NavLink>
            ) : null}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">
                {user?.name || 'User'}
              </div>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    role === 'ADMIN'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {roleLabel(role)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}

