'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-[340px]',
  md: 'max-w-[420px]',
  lg: 'max-w-[520px]',
  xl: 'max-w-[640px]',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <Card
        className={`relative w-full ${sizeClasses[size]} animate-slide-up rounded-2xl border border-white/10 bg-surface shadow-2xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-text"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-5 py-4">{children}</div>
      </Card>
    </div>
  );
}
