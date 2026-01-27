'use client';

import { X } from 'lucide-react';
import { Card } from '@/components/ui';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className={`w-full ${sizeClasses[size]} space-y-6 p-6`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted transition-colors hover:text-text"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}
