'use client';

import { useState } from 'react';
import { Card, Button, Input, Select, Spinner } from '@/components/ui';
import { Modal, ConfirmDialog, AccountCard } from '@/components/shared';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useCreateTransaction,
  useSettings,
} from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { ACCOUNT_TYPES, getAccountTypeOptions, isLiabilityAccount } from '@/lib/constants';
import { Plus } from 'lucide-react';
import type { Account, AccountType } from '@/types';

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const { data: settings } = useSettings();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createTransaction = useCreateTransaction();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [adjustingAccount, setAdjustingAccount] = useState<Account | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    type: ACCOUNT_TYPES.BANK as AccountType,
    balance: 0,
    creditLimit: 0,
    bankName: '',
    lastFourDigits: '',
    description: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    creditLimit: 0,
    bankName: '',
    lastFourDigits: '',
    description: '',
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    targetBalance: 0,
    note: 'Balance adjustment',
  });

  const currency = settings?.currency || 'INR';

  // Calculate totals (convert Decimal to number)
  const totalAssets =
    accounts?.reduce((acc, curr) => {
      if (!isLiabilityAccount(curr.type)) {
        return acc + Number(curr.balance);
      }
      return acc;
    }, 0) || 0;

  const totalLiabilities =
    accounts?.reduce((acc, curr) => {
      if (isLiabilityAccount(curr.type)) {
        return acc + Math.abs(Number(curr.balance));
      }
      return acc;
    }, 0) || 0;

  const netWorth = totalAssets - totalLiabilities;

  // Modal handlers
  const openCreateModal = () => {
    setCreateForm({
      name: '',
      type: ACCOUNT_TYPES.BANK as AccountType,
      balance: 0,
      creditLimit: 0,
      bankName: '',
      lastFourDigits: '',
      description: '',
    });
    setShowCreateModal(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setEditForm({
      name: account.name,
      creditLimit: Number(account.creditLimit) || 0,
      bankName: account.bankName || '',
      lastFourDigits: account.lastFourDigits || '',
      description: account.description || '',
    });
  };

  const openAdjustModal = (account: Account) => {
    setAdjustingAccount(account);
    setAdjustmentForm({
      targetBalance: Number(account.balance),
      note: 'Balance adjustment',
    });
  };

  // CRUD handlers
  const handleCreate = async () => {
    if (!createForm.name) return;

    try {
      const isCreditCard = createForm.type === ACCOUNT_TYPES.CREDIT;
      await createAccount.mutateAsync({
        name: createForm.name,
        type: createForm.type,
        balance: isCreditCard ? -Math.abs(createForm.balance) : createForm.balance,
        creditLimit: isCreditCard ? createForm.creditLimit : undefined,
        currency,
        bankName: createForm.bankName || undefined,
        lastFourDigits: createForm.lastFourDigits || undefined,
        description: createForm.description || undefined,
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingAccount || !editForm.name) return;

    try {
      await updateAccount.mutateAsync({
        id: editingAccount.id,
        name: editForm.name,
        creditLimit:
          editingAccount.type === ACCOUNT_TYPES.CREDIT ? editForm.creditLimit : undefined,
        bankName: editForm.bankName || null,
        lastFourDigits: editForm.lastFourDigits || null,
        description: editForm.description || null,
      });
      setEditingAccount(null);
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const handleAdjustment = async () => {
    if (!adjustingAccount) return;

    const currentBalance = Number(adjustingAccount.balance);
    const difference = adjustmentForm.targetBalance - currentBalance;
    if (difference === 0) {
      setAdjustingAccount(null);
      return;
    }

    try {
      await createTransaction.mutateAsync({
        amount: Math.abs(difference),
        type: difference > 0 ? 'INCOME' : 'EXPENSE',
        accountId: adjustingAccount.id,
        note: adjustmentForm.note || 'Balance adjustment',
        date: new Date().toISOString(),
      });
      setAdjustingAccount(null);
    } catch (error) {
      console.error('Error creating adjustment:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteAccount.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const isCreditType = createForm.type === ACCOUNT_TYPES.CREDIT;
  const isBankType = createForm.type === ACCOUNT_TYPES.BANK;
  const showBankFields = isCreditType || isBankType;

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <div className="mt-2 flex gap-6 text-sm">
            <div>
              <span className="text-muted">Assets:</span>{' '}
              <span className="font-medium text-emerald-400">
                {formatCurrency(totalAssets, currency)}
              </span>
            </div>
            <div>
              <span className="text-muted">Liabilities:</span>{' '}
              <span className="font-medium text-red-400">
                {formatCurrency(totalLiabilities, currency)}
              </span>
            </div>
            <div>
              <span className="text-muted">Net Worth:</span>{' '}
              <span className={`font-bold ${netWorth >= 0 ? 'text-white' : 'text-red-400'}`}>
                {formatCurrency(netWorth, currency)}
              </span>
            </div>
          </div>
        </div>
        <Button icon={<Plus size={18} />} onClick={openCreateModal}>
          Add Account
        </Button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts?.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onEdit={openEditModal}
            onDelete={setDeleteConfirmId}
            onAdjust={openAdjustModal}
          />
        ))}

        {/* Add New Card */}
        <button
          onClick={openCreateModal}
          className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-800 bg-surface/30 text-muted transition-all hover:border-zinc-700 hover:bg-surface/50 hover:text-text"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
            <Plus size={32} />
          </div>
          <span className="font-semibold">Add New Account</span>
        </button>
      </div>

      {/* Create Account Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Account">
        <div className="space-y-4">
          <Input
            label="Account Name"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder={isCreditType ? 'e.g. HDFC Regalia' : 'e.g. HDFC Savings'}
          />

          <Select
            label="Account Type"
            value={createForm.type}
            onChange={(e) =>
              setCreateForm({
                ...createForm,
                type: e.target.value as AccountType,
                balance: 0,
                creditLimit: 0,
              })
            }
            options={getAccountTypeOptions()}
          />

          {showBankFields && (
            <>
              <Input
                label={isCreditType ? 'Card Issuer / Bank' : 'Bank Name'}
                value={createForm.bankName}
                onChange={(e) => setCreateForm({ ...createForm, bankName: e.target.value })}
                placeholder={isCreditType ? 'e.g. HDFC, ICICI, Amex' : 'e.g. HDFC Bank, SBI'}
              />
              <Input
                label={isCreditType ? 'Last 4 Digits of Card' : 'Last 4 Digits of Account'}
                value={createForm.lastFourDigits}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setCreateForm({ ...createForm, lastFourDigits: val });
                }}
                placeholder="e.g. 1234"
                maxLength={4}
              />
            </>
          )}

          {isCreditType ? (
            <>
              <Input
                label="Credit Limit"
                type="number"
                value={createForm.creditLimit || ''}
                onChange={(e) =>
                  setCreateForm({ ...createForm, creditLimit: parseFloat(e.target.value) || 0 })
                }
                placeholder="e.g. 200000"
              />
              <Input
                label="Current Outstanding (amount you owe)"
                type="number"
                value={createForm.balance || ''}
                onChange={(e) =>
                  setCreateForm({ ...createForm, balance: parseFloat(e.target.value) || 0 })
                }
                placeholder="e.g. 15000"
              />
            </>
          ) : (
            <Input
              label="Current Balance"
              type="number"
              value={createForm.balance || ''}
              onChange={(e) =>
                setCreateForm({ ...createForm, balance: parseFloat(e.target.value) || 0 })
              }
              placeholder="e.g. 50000"
            />
          )}

          <Input
            label="Description (Optional)"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            placeholder="e.g. Emergency fund, Joint account"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!createForm.name || createAccount.isPending}
            className="flex-1"
          >
            {createAccount.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </Modal>

      {/* Edit Account Modal */}
      <Modal isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} title="Edit Account">
        {editingAccount && (
          <>
            <div className="space-y-4">
              <Input
                label="Account Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />

              {(editingAccount.type === ACCOUNT_TYPES.BANK ||
                editingAccount.type === ACCOUNT_TYPES.CREDIT) && (
                <>
                  <Input
                    label={
                      editingAccount.type === ACCOUNT_TYPES.CREDIT
                        ? 'Card Issuer / Bank'
                        : 'Bank Name'
                    }
                    value={editForm.bankName}
                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                  />
                  <Input
                    label={
                      editingAccount.type === ACCOUNT_TYPES.CREDIT
                        ? 'Last 4 Digits of Card'
                        : 'Last 4 Digits of Account'
                    }
                    value={editForm.lastFourDigits}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setEditForm({ ...editForm, lastFourDigits: val });
                    }}
                    maxLength={4}
                  />
                </>
              )}

              {editingAccount.type === ACCOUNT_TYPES.CREDIT && (
                <Input
                  label="Credit Limit"
                  type="number"
                  value={editForm.creditLimit || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, creditLimit: parseFloat(e.target.value) || 0 })
                  }
                />
              )}

              <Input
                label="Description (Optional)"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />

              <Card className="border-border p-4">
                <p className="mb-1 text-xs text-muted">Current Balance</p>
                <p className="font-mono text-xl font-bold">
                  {formatCurrency(Number(editingAccount.balance), editingAccount.currency)}
                </p>
                <p className="mt-2 text-xs text-muted">
                  To change the balance, use the &quot;Adjust Balance&quot; button.
                </p>
              </Card>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="ghost" onClick={() => setEditingAccount(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={!editForm.name || updateAccount.isPending}
                className="flex-1"
              >
                {updateAccount.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Adjust Balance Modal */}
      <Modal
        isOpen={!!adjustingAccount}
        onClose={() => setAdjustingAccount(null)}
        title="Adjust Balance"
      >
        {adjustingAccount && (
          <>
            <Card className="border-border p-4">
              <p className="mb-1 font-medium">{adjustingAccount.name}</p>
              <p className="text-sm text-muted">
                Current balance:{' '}
                <span className="font-mono font-bold text-white">
                  {formatCurrency(Number(adjustingAccount.balance), adjustingAccount.currency)}
                </span>
              </p>
            </Card>

            <div className="mt-4 space-y-4">
              <Input
                label={
                  adjustingAccount.type === ACCOUNT_TYPES.CREDIT
                    ? 'Correct Outstanding Amount'
                    : 'Correct Balance'
                }
                type="number"
                value={adjustmentForm.targetBalance}
                onChange={(e) =>
                  setAdjustmentForm({
                    ...adjustmentForm,
                    targetBalance: parseFloat(e.target.value) || 0,
                  })
                }
              />

              <Input
                label="Note"
                value={adjustmentForm.note}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, note: e.target.value })}
                placeholder="Reason for adjustment"
              />

              {adjustmentForm.targetBalance !== Number(adjustingAccount.balance) && (
                <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm">
                  This will create an adjustment transaction of{' '}
                  <span
                    className={`font-bold ${adjustmentForm.targetBalance > Number(adjustingAccount.balance) ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    {adjustmentForm.targetBalance > Number(adjustingAccount.balance) ? '+' : ''}
                    {formatCurrency(
                      adjustmentForm.targetBalance - Number(adjustingAccount.balance),
                      adjustingAccount.currency
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="ghost" onClick={() => setAdjustingAccount(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleAdjustment}
                disabled={
                  adjustmentForm.targetBalance === Number(adjustingAccount.balance) ||
                  createTransaction.isPending
                }
                className="flex-1"
              >
                {createTransaction.isPending ? 'Adjusting...' : 'Adjust'}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Account?"
        message="This will permanently delete this account and all its transactions."
        confirmLabel="Delete"
        isLoading={deleteAccount.isPending}
        variant="danger"
      />
    </div>
  );
}
