import { Home, Settings2 } from 'lucide-react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/', label: '总览', icon: Home },
  { to: '/settings', label: '设置', icon: Settings2 },
]

export default function Layout() {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/farm')
    }
    return location.pathname === path
  }

  return (
    <div className="app-shell">
      <div className="mx-auto flex h-full w-full max-w-lg flex-col px-3 pb-3 pt-3 sm:px-4">
        <div className="app-page overflow-hidden rounded-[2.15rem] border border-white/70 bg-white/35 shadow-float backdrop-blur-sm">
          <header className="flex-shrink-0 px-4 pt-3">
            <div className="rounded-[1.35rem] border border-white/70 bg-white/72 p-1.5 shadow-panel backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-1.5">
                {navItems.map((item) => {
                  const active = isActive(item.to)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'inline-flex items-center justify-center gap-2 rounded-[1rem] px-3 py-2 text-sm font-medium transition',
                        active
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15'
                          : 'text-muted-foreground hover:bg-white/80 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
