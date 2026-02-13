'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { CategoryManager } from '@/components/shared/CategoryManager';

export default function CategoriesPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl animate-fade-in pb-24">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted">
            Manage your transaction categories for expenses, income, and transfers.
          </p>
        </div>
      </div>

      <CategoryManager />
    </div>
  );
}
