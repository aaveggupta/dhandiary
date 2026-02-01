'use client';

import { useState, useMemo } from 'react';
import { Card, Button, Input, Select, Spinner } from '@/components/ui';
import {
  Modal,
  ConfirmDialog,
  AccountCard,
  SharedCreditLimitModal,
  LinkCardModal,
  SharedLimitGroup,
} from '@/components/shared';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useCreateTransaction,
  useSettings,
  useSharedCreditLimits,
  useCreateSharedCreditLimit,
  useUpdateSharedCreditLimit,
  useDeleteSharedCreditLimit,
  useLinkAccountToSharedLimit,
  useUnlinkAccountFromSharedLimit,
} from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { ACCOUNT_TYPES, getAccountTypeOptions, isLiabilityAccount } from '@/lib/constants';
import { Plus, Link2 } from 'lucide-react';
import type { Account, AccountType, SharedCreditLimitWithStats } from '@/types';

export default function AccountsPage() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: settings } = useSettings();
  const { data: sharedLimits, isLoading: sharedLimitsLoading } = useSharedCreditLimits();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createTransaction = useCreateTransaction();
  const createSharedLimit = useCreateSharedCreditLimit();
  const updateSharedLimit = useUpdateSharedCreditLimit();
  const deleteSharedLimit = useDeleteSharedCreditLimit();
  const linkAccount = useLinkAccountToSharedLimit();
  const unlinkAccount = useUnlinkAccountFromSharedLimit();

  // Account modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [adjustingAccount, setAdjustingAccount] = useState<Account | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Shared credit limit modal states
  const [showSharedLimitModal, setShowSharedLimitModal] = useState(false);
  const [editingSharedLimit, setEditingSharedLimit] = useState<SharedCreditLimitWithStats | null>(
    null
  );
  const [managingCardsLimitId, setManagingCardsLimitId] = useState<string | null>(null);
  const [deleteSharedLimitId, setDeleteSharedLimitId] = useState<string | null>(null);

  // Get fresh shared limit data for the link card modal
  const managingCardsLimit = managingCardsLimitId
    ? sharedLimits?.find((sl) => sl.id === managingCardsLimitId) || null
    : null;

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    type: ACCOUNT_TYPES.BANK as AccountType,
    balance: 0,
    creditLimit: 0,
    bankName: '',
    lastFourDigits: '',
    description: '',
    // Credit card specific fields
    billingCycleDay: '',
    paymentDueDay: '',
    utilizationAlertEnabled: true,
    utilizationAlertPercent: 30,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    creditLimit: 0,
    bankName: '',
    lastFourDigits: '',
    description: '',
    // Credit card specific fields
    billingCycleDay: '',
    paymentDueDay: '',
    utilizationAlertEnabled: true,
    utilizationAlertPercent: 30,
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    targetBalance: 0,
    note: 'Balance adjustment',
  });

  const currency = settings?.currency || 'INR';
  const isLoading = accountsLoading || sharedLimitsLoading;

  // Create a map of sharedLimitId -> sharedLimitWithStats for easy lookup
  const sharedLimitMap = useMemo(() => {
    const map = new Map<string, SharedCreditLimitWithStats>();
    sharedLimits?.forEach((limit) => {
      map.set(limit.id, limit);
    });
    return map;
  }, [sharedLimits]);

  // Group accounts: those in shared limits vs standalone
  const { accountsBySharedLimit, standaloneAccounts } = useMemo(() => {
    const bySharedLimit = new Map<string, Account[]>();
    const standalone: Account[] = [];

    accounts?.forEach((account) => {
      if (account.sharedCreditLimitId) {
        const existing = bySharedLimit.get(account.sharedCreditLimitId) || [];
        bySharedLimit.set(account.sharedCreditLimitId, [...existing, account]);
      } else {
        standalone.push(account);
      }
    });

    return { accountsBySharedLimit: bySharedLimit, standaloneAccounts: standalone };
  }, [accounts]);

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

  // Modal handlers - Accounts
  const openCreateModal = () => {
    setCreateForm({
      name: '',
      type: ACCOUNT_TYPES.BANK as AccountType,
      balance: 0,
      creditLimit: 0,
      bankName: '',
      lastFourDigits: '',
      description: '',
      billingCycleDay: '',
      paymentDueDay: '',
      utilizationAlertEnabled: true,
      utilizationAlertPercent: 30,
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
      billingCycleDay: account.billingCycleDay?.toString() || '',
      paymentDueDay: account.paymentDueDay?.toString() || '',
      utilizationAlertEnabled: account.utilizationAlertEnabled ?? true,
      utilizationAlertPercent: account.utilizationAlertPercent ?? 30,
    });
  };

  const openAdjustModal = (account: Account) => {
    setAdjustingAccount(account);
    setAdjustmentForm({
      targetBalance: Number(account.balance),
      note: 'Balance adjustment',
    });
  };

  // Modal handlers - Shared Credit Limits
  const openCreateSharedLimitModal = () => {
    setEditingSharedLimit(null);
    setShowSharedLimitModal(true);
  };

  const openEditSharedLimitModal = (limit: SharedCreditLimitWithStats) => {
    setEditingSharedLimit(limit);
    setShowSharedLimitModal(true);
  };

  // CRUD handlers - Accounts
  const handleCreate = async () => {
    if (!createForm.name) return;

    try {
      const isCreditCard = createForm.type === ACCOUNT_TYPES.CREDIT;
      await createAccount.mutateAsync({
        name: createForm.name,
        type: createForm.type,
        // For credit cards: positive outstanding → negative balance, negative (credit) → positive
        balance: isCreditCard ? -createForm.balance : createForm.balance,
        creditLimit: isCreditCard ? createForm.creditLimit : undefined,
        currency,
        bankName: createForm.bankName || undefined,
        lastFourDigits: createForm.lastFourDigits || undefined,
        description: createForm.description || undefined,
        // Credit card specific fields
        billingCycleDay: isCreditCard && createForm.billingCycleDay 
          ? parseInt(createForm.billingCycleDay) 
          : undefined,
        paymentDueDay: isCreditCard && createForm.paymentDueDay 
          ? parseInt(createForm.paymentDueDay) 
          : undefined,
        utilizationAlertEnabled: isCreditCard ? createForm.utilizationAlertEnabled : undefined,
        utilizationAlertPercent: isCreditCard ? createForm.utilizationAlertPercent : undefined,
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingAccount || !editForm.name) return;

    try {
      const isCreditCard = editingAccount.type === ACCOUNT_TYPES.CREDIT;
      await updateAccount.mutateAsync({
        id: editingAccount.id,
        name: editForm.name,
        creditLimit: isCreditCard ? editForm.creditLimit : undefined,
        bankName: editForm.bankName || null,
        lastFourDigits: editForm.lastFourDigits || null,
        description: editForm.description || null,
        // Credit card specific fields
        billingCycleDay: isCreditCard 
          ? (editForm.billingCycleDay ? parseInt(editForm.billingCycleDay) : null) 
          : undefined,
        paymentDueDay: isCreditCard 
          ? (editForm.paymentDueDay ? parseInt(editForm.paymentDueDay) : null) 
          : undefined,
        utilizationAlertEnabled: isCreditCard ? editForm.utilizationAlertEnabled : undefined,
        utilizationAlertPercent: isCreditCard ? editForm.utilizationAlertPercent : undefined,
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

  // CRUD handlers - Shared Credit Limits
  const handleCreateOrUpdateSharedLimit = async (data: {
    name: string;
    totalLimit: number;
    description?: string;
  }) => {
    try {
      if (editingSharedLimit) {
        await updateSharedLimit.mutateAsync({
          id: editingSharedLimit.id,
          ...data,
        });
      } else {
        await createSharedLimit.mutateAsync(data);
      }
      setShowSharedLimitModal(false);
      setEditingSharedLimit(null);
    } catch (error) {
      console.error('Error saving shared credit limit:', error);
    }
  };

  const handleDeleteSharedLimit = async () => {
    if (!deleteSharedLimitId) return;
    try {
      await deleteSharedLimit.mutateAsync(deleteSharedLimitId);
      setDeleteSharedLimitId(null);
    } catch (error) {
      console.error('Error deleting shared credit limit:', error);
    }
  };

  const handleLinkAccount = async (accountId: string) => {
    if (!managingCardsLimitId) return;
    try {
      await linkAccount.mutateAsync({
        sharedLimitId: managingCardsLimitId,
        accountId,
      });
    } catch (error) {
      console.error('Error linking account:', error);
    }
  };

  const handleUnlinkAccount = async (accountId: string) => {
    if (!managingCardsLimitId) return;
    try {
      await unlinkAccount.mutateAsync({
        sharedLimitId: managingCardsLimitId,
        accountId,
      });
    } catch (error) {
      console.error('Error unlinking account:', error);
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
        <div className="flex gap-3">
          <Button variant="outline" icon={<Link2 size={18} />} onClick={openCreateSharedLimitModal}>
            Shared Limit
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreateModal}>
            Add Account
          </Button>
        </div>
      </div>

      {/* Shared Credit Pools - Credit cards grouped under their shared limits */}
      {sharedLimits && sharedLimits.length > 0 && (
        <div className="space-y-6">
          {sharedLimits.map((limit) => (
            <SharedLimitGroup
              key={limit.id}
              sharedLimit={limit}
              linkedAccounts={accountsBySharedLimit.get(limit.id) || []}
              currency={currency}
              onEditLimit={openEditSharedLimitModal}
              onDeleteLimit={setDeleteSharedLimitId}
              onManageCards={(l) => setManagingCardsLimitId(l.id)}
              onEditAccount={openEditModal}
              onDeleteAccount={setDeleteConfirmId}
              onAdjustAccount={openAdjustModal}
            />
          ))}
        </div>
      )}

      {/* Standalone Accounts - Not in any shared limit group */}
      {standaloneAccounts.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-white/50">
            {sharedLimits && sharedLimits.length > 0 ? 'Other Accounts' : 'All Accounts'}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {standaloneAccounts.map((account) => (
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
        </div>
      )}

      {/* Show add button when there are no standalone accounts */}
      {standaloneAccounts.length === 0 && (
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-white/50">
            Add More Accounts
          </h2>
          <button
            onClick={openCreateModal}
            className="flex min-h-[180px] w-full max-w-sm flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-800 bg-surface/30 text-muted transition-all hover:border-zinc-700 hover:bg-surface/50 hover:text-text"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
              <Plus size={28} />
            </div>
            <span className="font-semibold">Add New Account</span>
          </button>
        </div>
      )}

      {/* Create Account Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Account" size="lg">
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
              
              {/* Credit Card Due Date Settings */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Billing Cycle Day"
                  type="number"
                  min={1}
                  max={31}
                  value={createForm.billingCycleDay}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, billingCycleDay: e.target.value })
                  }
                  placeholder="e.g. 15"
                />
                <Input
                  label="Payment Due Day"
                  type="number"
                  min={1}
                  max={31}
                  value={createForm.paymentDueDay}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, paymentDueDay: e.target.value })
                  }
                  placeholder="e.g. 5"
                />
              </div>
              <p className="text-xs text-muted">
                Set the day of month for billing cycle end and payment due date to receive reminders.
              </p>

              {/* Utilization Alert Settings */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Utilization Alerts</p>
                    <p className="text-xs text-muted">
                      Get warned when credit usage exceeds threshold
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={createForm.utilizationAlertEnabled}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, utilizationAlertEnabled: e.target.checked })
                      }
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-zinc-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                  </label>
                </div>
                {createForm.utilizationAlertEnabled && (
                  <div className="mt-3">
                    <label className="text-sm text-muted">Alert threshold: {createForm.utilizationAlertPercent}%</label>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      step={5}
                      value={createForm.utilizationAlertPercent}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, utilizationAlertPercent: parseInt(e.target.value) })
                      }
                      className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700"
                    />
                    <p className="mt-1 text-xs text-muted">
                      Recommended: 30% (affects credit score above this)
                    </p>
                  </div>
                )}
              </div>
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
      <Modal isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} title="Edit Account" size="lg">
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
                <>
                  {/* Show shared limit info if card is in a group */}
                  {editingAccount.sharedCreditLimitId &&
                    sharedLimitMap.get(editingAccount.sharedCreditLimitId) && (
                      <Card className="border-indigo-500/20 bg-indigo-500/10 p-4">
                        <div className="flex items-center gap-2">
                          <Link2 size={16} className="text-indigo-400" />
                          <p className="text-sm font-medium text-indigo-300">
                            Part of Shared Limit
                          </p>
                        </div>
                        <p className="mt-1 text-lg font-bold text-white">
                          {sharedLimitMap.get(editingAccount.sharedCreditLimitId)?.name}
                        </p>
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-muted">Shared Limit:</span>
                          <span className="font-mono text-white">
                            {formatCurrency(
                              sharedLimitMap.get(editingAccount.sharedCreditLimitId)?.totalLimit ||
                                0,
                              currency
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted">Available (combined):</span>
                          <span className="font-mono text-emerald-400">
                            {formatCurrency(
                              sharedLimitMap.get(editingAccount.sharedCreditLimitId)
                                ?.availableCredit || 0,
                              currency
                            )}
                          </span>
                        </div>
                      </Card>
                    )}

                  <Input
                    label={
                      editingAccount.sharedCreditLimitId
                        ? 'Individual Credit Limit (fallback)'
                        : 'Credit Limit'
                    }
                    type="number"
                    value={editForm.creditLimit || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, creditLimit: parseFloat(e.target.value) || 0 })
                    }
                  />
                  {editingAccount.sharedCreditLimitId && (
                    <p className="text-xs text-muted">
                      This limit is only used if the card is removed from the shared limit group.
                    </p>
                  )}

                  {/* Credit Card Due Date Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Billing Cycle Day"
                      type="number"
                      min={1}
                      max={31}
                      value={editForm.billingCycleDay}
                      onChange={(e) =>
                        setEditForm({ ...editForm, billingCycleDay: e.target.value })
                      }
                      placeholder="e.g. 15"
                    />
                    <Input
                      label="Payment Due Day"
                      type="number"
                      min={1}
                      max={31}
                      value={editForm.paymentDueDay}
                      onChange={(e) =>
                        setEditForm({ ...editForm, paymentDueDay: e.target.value })
                      }
                      placeholder="e.g. 5"
                    />
                  </div>
                  <p className="text-xs text-muted">
                    Set for billing cycle end and payment due date reminders.
                  </p>

                  {/* Utilization Alert Settings */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">Utilization Alerts</p>
                        <p className="text-xs text-muted">
                          Get warned when credit usage exceeds threshold
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={editForm.utilizationAlertEnabled}
                          onChange={(e) =>
                            setEditForm({ ...editForm, utilizationAlertEnabled: e.target.checked })
                          }
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-zinc-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                      </label>
                    </div>
                    {editForm.utilizationAlertEnabled && (
                      <div className="mt-3">
                        <label className="text-sm text-muted">Alert threshold: {editForm.utilizationAlertPercent}%</label>
                        <input
                          type="range"
                          min={10}
                          max={90}
                          step={5}
                          value={editForm.utilizationAlertPercent}
                          onChange={(e) =>
                            setEditForm({ ...editForm, utilizationAlertPercent: parseInt(e.target.value) })
                          }
                          className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700"
                        />
                        <p className="mt-1 text-xs text-muted">
                          Recommended: 30% (affects credit score above this)
                        </p>
                      </div>
                    )}
                  </div>
                </>
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
        size="md"
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

      {/* Shared Credit Limit Modal */}
      <SharedCreditLimitModal
        isOpen={showSharedLimitModal}
        onClose={() => {
          setShowSharedLimitModal(false);
          setEditingSharedLimit(null);
        }}
        onSubmit={handleCreateOrUpdateSharedLimit}
        isLoading={createSharedLimit.isPending || updateSharedLimit.isPending}
        editingLimit={editingSharedLimit}
        currency={currency}
      />

      {/* Link Card Modal */}
      <LinkCardModal
        isOpen={!!managingCardsLimit}
        onClose={() => setManagingCardsLimitId(null)}
        sharedLimit={managingCardsLimit}
        accounts={accounts || []}
        onLinkAccount={handleLinkAccount}
        onUnlinkAccount={handleUnlinkAccount}
        isLinking={linkAccount.isPending}
        isUnlinking={unlinkAccount.isPending}
        currency={currency}
      />

      {/* Delete Account Confirmation */}
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

      {/* Delete Shared Limit Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteSharedLimitId}
        onClose={() => setDeleteSharedLimitId(null)}
        onConfirm={handleDeleteSharedLimit}
        title="Delete Shared Credit Limit?"
        message="This will delete the shared limit group. All linked cards will become standalone accounts with their individual credit limits."
        confirmLabel="Delete"
        isLoading={deleteSharedLimit.isPending}
        variant="danger"
      />
    </div>
  );
}
