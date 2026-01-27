'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, PieChart, Settings, Plus } from 'lucide-react';

const navItems = [
  { icon: <Home size={20} />, label: 'Overview', path: '/dashboard' },
  { icon: <CreditCard size={20} />, label: 'Accounts', path: '/accounts' },
  { icon: <PieChart size={20} />, label: 'Transactions', path: '/transactions' },
  { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-surface/50 backdrop-blur-xl md:flex">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-lg font-bold text-white">D</span>
          </div>
          <span className="text-xl font-bold tracking-tight">DhanDiary</span>
        </Link>
      </div>

      <nav className="mt-4 flex-1 space-y-2 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                isActive
                  ? 'border border-primary/10 bg-primary/10 font-medium text-primary'
                  : 'text-muted hover:bg-white/5 hover:text-text'
              } `}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <Link
          href="/transactions/add"
          className="gradient-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 active:scale-[0.98]"
        >
          <Plus size={20} />
          <span>Quick Add</span>
        </Link>
      </div>
    </aside>
  );
}
