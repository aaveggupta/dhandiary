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

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="glass fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 md:hidden">
        <div className="flex items-center justify-around p-2 pb-5">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex h-14 w-16 flex-col items-center justify-center rounded-xl transition-all ${isActive ? 'text-primary' : 'text-muted hover:text-text'} `}
              >
                <div className={`rounded-lg p-1 ${isActive ? 'bg-primary/10' : 'bg-transparent'}`}>
                  {item.icon}
                </div>
                <span className="mt-1 text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Floating Add Button */}
      <Link
        href="/transactions/add"
        className="gradient-primary fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-primary/30 transition-transform active:scale-90 md:hidden"
      >
        <Plus size={28} />
      </Link>
    </>
  );
}
