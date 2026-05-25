import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, KanbanSquare, User, FileText,
  Radar, ClipboardList, Globe, ChevronLeft, ChevronRight, Sparkles, Terminal
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipeline', icon: KanbanSquare, label: 'Pipeline' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/cv', icon: FileText, label: 'CV Editor' },
  { to: '/scanner', icon: Radar, label: 'Scanner' },
  { to: '/reports', icon: ClipboardList, label: 'Reports' },
  { to: '/portals', icon: Globe, label: 'Portals' },
  { to: '/terminal', icon: Terminal, label: 'Terminal' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-surface-300/40 bg-surface-50 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-surface-300/40">
          <Sparkles className="w-6 h-6 text-primary-400 shrink-0" />
          {!collapsed && (
            <span className="font-heading font-bold text-base tracking-tight text-white truncate">
              career-ops
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-500/15 text-primary-300 shadow-sm shadow-primary-500/5'
                    : 'text-white/60 hover:bg-surface-200/60 hover:text-white/90'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center justify-center h-10 border-t border-surface-300/40 text-white/40 hover:text-white/70 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[oklch(0.12_0.01_260)]">
        <Outlet />
      </main>
    </div>
  );
}
