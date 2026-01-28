'use client';

import { useState, useMemo } from 'react';
import { Button, Card } from '@/components/ui';
import { Modal } from '@/components/shared';
import { CreditCard, Check, Link2Off } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ACCOUNT_TYPES } from '@/lib/constants';
import type { Account, SharedCreditLimitWithStats } from '@/types';

interface LinkCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedLimit: SharedCreditLimitWithStats | null;
  accounts: Account[];
  onLinkAccount: (accountId: string) => void;
  onUnlinkAccount: (accountId: string) => void;
  isLinking?: boolean;
  isUnlinking?: boolean;
  currency: string;
}

export function LinkCardModal({
  isOpen,
  onClose,
  sharedLimit,
  accounts,
  onLinkAccount,
  onUnlinkAccount,
  isLinking,
  isUnlinking,
  currency,
}: LinkCardModalProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Get credit cards only
  const creditCards = useMemo(() => {
    return accounts.filter((acc) => acc.type === ACCOUNT_TYPES.CREDIT);
  }, [accounts]);

  // Separate linked and available cards
  const linkedCards = useMemo(() => {
    if (!sharedLimit) return [];
    return creditCards.filter((acc) => acc.sharedCreditLimitId === sharedLimit.id);
  }, [creditCards, sharedLimit]);

  const availableCards = useMemo(() => {
    return creditCards.filter((acc) => !acc.sharedCreditLimitId);
  }, [creditCards]);

  const cardsInOtherGroups = useMemo(() => {
    if (!sharedLimit) return [];
    return creditCards.filter(
      (acc) => acc.sharedCreditLimitId && acc.sharedCreditLimitId !== sharedLimit.id
    );
  }, [creditCards, sharedLimit]);

  const handleLink = (accountId: string) => {
    setPendingAction(accountId);
    onLinkAccount(accountId);
  };

  const handleUnlink = (accountId: string) => {
    setPendingAction(accountId);
    onUnlinkAccount(accountId);
  };

  if (!sharedLimit) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Linked Cards" size="lg">
      <div className="space-y-6">
        {/* Current Shared Limit Info */}
        <Card className="border-border bg-surface/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{sharedLimit.name}</h4>
              <p className="text-sm text-muted">
                Limit: {formatCurrency(sharedLimit.totalLimit, currency)} | Available:{' '}
                {formatCurrency(sharedLimit.availableCredit, currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{sharedLimit.linkedAccounts.length}</p>
              <p className="text-xs text-muted">cards linked</p>
            </div>
          </div>
        </Card>

        {/* Linked Cards */}
        <div>
          <h4 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">
            Linked Cards
          </h4>
          {linkedCards.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No cards linked to this group</p>
          ) : (
            <div className="space-y-2">
              {linkedCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <CreditCard size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{card.name}</p>
                      <p className="text-xs text-muted">
                        {card.bankName && `${card.bankName} `}
                        {card.lastFourDigits && `****${card.lastFourDigits}`}
                        {' | Outstanding: '}
                        {formatCurrency(Math.abs(Number(card.balance)), currency)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlink(card.id)}
                    disabled={isUnlinking && pendingAction === card.id}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Link2Off size={16} className="mr-1" />
                    {isUnlinking && pendingAction === card.id ? 'Unlinking...' : 'Unlink'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Cards */}
        <div>
          <h4 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">
            Available Cards
          </h4>
          {availableCards.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">
              {creditCards.length === 0
                ? 'No credit cards found. Create a credit card account first.'
                : 'All credit cards are already in shared limit groups.'}
            </p>
          ) : (
            <div className="space-y-2">
              {availableCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between rounded-lg border border-dashed border-border bg-surface/20 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                      <CreditCard size={20} className="text-muted" />
                    </div>
                    <div>
                      <p className="font-medium">{card.name}</p>
                      <p className="text-xs text-muted">
                        {card.bankName && `${card.bankName} `}
                        {card.lastFourDigits && `****${card.lastFourDigits}`}
                        {' | Outstanding: '}
                        {formatCurrency(Math.abs(Number(card.balance)), currency)}
                        {' | Limit: '}
                        {formatCurrency(Number(card.creditLimit) || 0, currency)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLink(card.id)}
                    disabled={isLinking && pendingAction === card.id}
                    className="text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                  >
                    <Check size={16} className="mr-1" />
                    {isLinking && pendingAction === card.id ? 'Linking...' : 'Link'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cards in Other Groups */}
        {cardsInOtherGroups.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">
              In Other Groups
            </h4>
            <div className="space-y-2">
              {cardsInOtherGroups.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface/10 p-3 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                      <CreditCard size={20} className="text-muted" />
                    </div>
                    <div>
                      <p className="font-medium">{card.name}</p>
                      <p className="text-xs text-muted">Already linked to another shared limit</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
