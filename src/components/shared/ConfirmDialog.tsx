'use client';

import { Trash2, AlertTriangle } from 'lucide-react';
import { Card, Button } from '@/components/ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isLoading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const Icon = variant === 'danger' ? Trash2 : AlertTriangle;
  const iconBgClass = variant === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10';
  const iconTextClass = variant === 'danger' ? 'text-red-500' : 'text-amber-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-sm space-y-6 p-6">
        <div className="text-center">
          <div
            className={`h-16 w-16 rounded-full ${iconBgClass} mx-auto mb-4 flex items-center justify-center`}
          >
            <Icon size={32} className={iconTextClass} />
          </div>
          <h2 className="mb-2 text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted">{message}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
