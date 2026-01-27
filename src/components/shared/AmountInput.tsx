'use client';

import { getCurrencySymbol } from '@/lib/constants';

interface AmountInputProps {
  value: string | number;
  onChange: (value: string) => void;
  currency?: string;
  placeholder?: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-lg py-2',
  md: 'text-2xl py-3',
  lg: 'text-3xl py-5',
};

export function AmountInput({
  value,
  onChange,
  currency = 'INR',
  placeholder = '0',
  label,
  className = '',
  size = 'md',
}: AmountInputProps) {
  const symbol = getCurrencySymbol(currency);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal point
    const val = e.target.value.replace(/[^\d.]/g, '');
    // Prevent multiple decimal points
    const parts = val.split('.');
    if (parts.length > 2) return;
    // Limit decimal places to 2
    if (parts[1]?.length > 2) return;
    onChange(val);
  };

  return (
    <div className={className}>
      {label && <label className="mb-2 block text-sm font-medium text-slate-300">{label}</label>}
      <div className="relative">
        <span
          className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary ${size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg'}`}
        >
          {symbol}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full rounded-2xl border-2 border-slate-700 bg-surface pl-12 pr-4 font-bold transition-colors focus:border-primary focus:outline-none ${sizeClasses[size]}`}
        />
      </div>
    </div>
  );
}
