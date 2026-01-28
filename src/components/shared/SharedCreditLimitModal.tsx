'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import { Modal, AmountInput } from '@/components/shared';
import type { SharedCreditLimitWithStats } from '@/types';

interface SharedCreditLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; totalLimit: number; description?: string }) => void;
  isLoading?: boolean;
  editingLimit?: SharedCreditLimitWithStats | null;
  currency: string;
}

export function SharedCreditLimitModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingLimit,
  currency,
}: SharedCreditLimitModalProps) {
  const [name, setName] = useState('');
  const [totalLimit, setTotalLimit] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editingLimit) {
      setName(editingLimit.name);
      setTotalLimit(String(editingLimit.totalLimit));
      setDescription(editingLimit.description || '');
    } else {
      setName('');
      setTotalLimit('');
      setDescription('');
    }
  }, [editingLimit, isOpen]);

  const handleSubmit = () => {
    if (!name || !totalLimit) return;

    onSubmit({
      name,
      totalLimit: parseFloat(totalLimit),
      description: description || undefined,
    });
  };

  const isEdit = !!editingLimit;
  const title = isEdit ? 'Edit Shared Credit Limit' : 'Create Shared Credit Limit';
  const submitLabel = isEdit ? 'Save Changes' : 'Create';
  const loadingLabel = isEdit ? 'Saving...' : 'Creating...';

  // Show warning if editing and new limit is lower than current outstanding
  const showLimitWarning =
    isEdit &&
    editingLimit &&
    parseFloat(totalLimit) > 0 &&
    parseFloat(totalLimit) < editingLimit.totalOutstanding;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <Input
          label="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. HDFC Combined Limit"
        />

        <AmountInput
          label="Total Credit Limit"
          value={totalLimit}
          onChange={setTotalLimit}
          currency={currency}
          placeholder="0"
          size="sm"
        />

        <Input
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Shared limit for all HDFC cards"
        />

        {showLimitWarning && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
            Warning: The new limit ({parseFloat(totalLimit).toLocaleString()}) is lower than the
            current combined outstanding ({editingLimit?.totalOutstanding.toLocaleString()}). This
            may prevent new transactions on linked cards.
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="ghost" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!name || !totalLimit || isLoading}
          className="flex-1"
        >
          {isLoading ? loadingLabel : submitLabel}
        </Button>
      </div>
    </Modal>
  );
}
