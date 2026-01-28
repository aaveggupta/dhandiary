'use client';

import React, {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

// --- Card Component ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'outlined' | 'solid';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'glass',
  onClick,
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-300';

  const variantStyles = {
    default: 'bg-surface border border-border hover:border-slate-700',
    solid: 'bg-surfaceHighlight border border-transparent',
    glass: 'glass-card hover:bg-surfaceHighlight/50 hover:border-white/10',
    outlined:
      'bg-transparent border border-dashed border-border hover:border-muted hover:bg-surface/30',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        baseStyles,
        variantStyles[variant],
        onClick && 'cursor-pointer active:scale-[0.99]',
        className
      )}
    >
      {children}
    </div>
  );
};

// --- Button Component ---
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  const variantStyles = {
    primary:
      'gradient-primary text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 border border-white/10',
    secondary: 'bg-surfaceHighlight text-text hover:bg-slate-700 border border-white/5',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
    ghost: 'bg-transparent text-muted hover:text-text hover:bg-white/5',
    outline: 'bg-transparent border border-border text-text hover:border-muted hover:bg-surface',
  };

  return (
    <button
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// --- Input Component ---
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon, error, className = '', ...props }) => (
  <div className="flex w-full flex-col gap-1.5">
    {label && (
      <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
    )}
    <div className="group relative">
      {icon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary">
          {icon}
        </div>
      )}
      <input
        className={cn(
          'w-full rounded-xl border border-border bg-surface/30',
          icon ? 'pl-14' : 'pl-4',
          'py-3 pr-4',
          'text-text placeholder-slate-600',
          'focus:border-primary focus:bg-surface/50 focus:outline-none focus:ring-1 focus:ring-primary',
          'transition-all duration-200',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
    </div>
    {error && <span className="ml-1 text-xs text-red-400">{error}</span>}
  </div>
);

// --- Textarea Component ---
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }) => (
  <div className="flex w-full flex-col gap-1.5">
    {label && (
      <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
    )}
    <textarea
      className={cn(
        'w-full rounded-xl border border-border bg-surface/30',
        'px-4 py-3',
        'text-text placeholder-slate-600',
        'focus:border-primary focus:bg-surface/50 focus:outline-none focus:ring-1 focus:ring-primary',
        'resize-none transition-all duration-200',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
    {error && <span className="ml-1 text-xs text-red-400">{error}</span>}
  </div>
);

// --- Select Component ---
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => (
  <div className="flex w-full flex-col gap-1.5">
    {label && (
      <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
    )}
    <select
      className={cn(
        'w-full rounded-xl border border-border bg-surface/30',
        'px-4 py-3',
        'text-text',
        'focus:border-primary focus:bg-surface/50 focus:outline-none focus:ring-1 focus:ring-primary',
        'cursor-pointer appearance-none transition-all duration-200',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-surface text-text">
          {option.label}
        </option>
      ))}
    </select>
    {error && <span className="ml-1 text-xs text-red-400">{error}</span>}
  </div>
);

// --- Icon Button ---
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  className = '',
  active,
  ...props
}) => (
  <button
    className={cn(
      'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
      active
        ? 'border border-primary/20 bg-primary/10 text-primary shadow-[0_0_15px_rgba(16,185,129,0.1)]'
        : 'bg-transparent text-muted hover:bg-white/5 hover:text-text',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

// --- Badge ---
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className }) => {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    neutral: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <span
      className={cn(
        'rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

// --- Loader/Spinner ---
export const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary',
      className
    )}
  />
);

// --- Skeleton ---
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-surfaceHighlight/50', className)} />
);
