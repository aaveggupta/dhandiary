'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useBanks, useCreateBank, Bank } from '@/hooks/use-banks';
import { ChevronDown, Search, Plus, Building2, Check, Loader2 } from 'lucide-react';

interface BankSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  country?: string; // Filter by country (IN, US, ALL)
}

export function BankSelect({
  value,
  onChange,
  placeholder = 'Select bank...',
  className = '',
  country = 'ALL',
}: BankSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: banks = [], isLoading } = useBanks(country);
  const createBank = useCreateBank();

  // Filter banks based on search
  const filteredBanks = useMemo(() => {
    if (!search.trim()) return banks;
    const searchLower = search.toLowerCase();
    return banks.filter((bank) => bank.name.toLowerCase().includes(searchLower));
  }, [banks, search]);

  // Check if exact match exists (case-insensitive)
  const exactMatchExists = useMemo(() => {
    if (!search.trim()) return true;
    return banks.some((bank) => bank.name.toLowerCase() === search.toLowerCase());
  }, [banks, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setSearch('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (bankName: string) => {
    onChange(bankName);
    setIsOpen(false);
    setSearch('');
    setIsAddingNew(false);
  };

  const handleAddNew = async () => {
    const nameToAdd = newBankName.trim() || search.trim();
    if (!nameToAdd) return;

    try {
      const bank = await createBank.mutateAsync({
        name: nameToAdd,
        country: country === 'ALL' ? 'IN' : country,
      });
      handleSelect(bank.name);
      setNewBankName('');
    } catch (error) {
      console.error('Failed to add bank:', error);
    }
  };

  const selectedBank = banks.find((b) => b.name === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-slate-100 transition-colors hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <span className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          {value ? (
            <span>{value}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
          {/* Search input */}
          <div className="border-b border-slate-700 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search banks..."
                className="w-full rounded-lg border border-slate-600 bg-slate-700 py-2 pl-10 pr-4 text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Banks list */}
          <div className="max-h-60 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : filteredBanks.length > 0 ? (
              <>
                {filteredBanks.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => handleSelect(bank.name)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                      bank.name === value
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{bank.name}</span>
                      {!bank.isSystem && (
                        <span className="rounded bg-slate-600 px-1.5 py-0.5 text-xs text-slate-300">
                          Custom
                        </span>
                      )}
                    </span>
                    {bank.name === value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </>
            ) : (
              <p className="py-3 text-center text-sm text-slate-400">No banks found</p>
            )}

            {/* Add new bank option */}
            {search.trim() && !exactMatchExists && (
              <div className="mt-2 border-t border-slate-700 pt-2">
                {isAddingNew ? (
                  <div className="space-y-2 p-2">
                    <input
                      type="text"
                      value={newBankName || search}
                      onChange={(e) => setNewBankName(e.target.value)}
                      placeholder="Bank name"
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddNew}
                        disabled={createBank.isPending}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {createBank.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Add
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNew(false);
                          setNewBankName('');
                        }}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(true);
                      setNewBankName(search);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-emerald-400 transition-colors hover:bg-slate-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add &quot;{search}&quot;</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
