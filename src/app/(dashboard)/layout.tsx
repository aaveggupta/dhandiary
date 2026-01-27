import { Sidebar, MobileNav } from '@/components/layout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-text selection:bg-primary/30 selection:text-white">
      <Sidebar />

      <main className="relative flex-1 overflow-y-auto scroll-smooth">
        <div className="mx-auto w-full max-w-7xl p-4 pb-24 md:p-8 md:pb-6">{children}</div>
      </main>

      <MobileNav />
    </div>
  );
}
