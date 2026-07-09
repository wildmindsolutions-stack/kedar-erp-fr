'use client';

import { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.98]',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]',
  ghost: 'text-slate-600 hover:bg-slate-100 active:scale-[0.98]',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]',
};

const sizes = {
  sm: 'min-h-[40px] px-3 py-2 text-xs rounded-md sm:min-h-0 sm:px-2 sm:py-1 sm:text-xs sm:rounded',
  md: 'min-h-[44px] px-4 py-2.5 text-sm rounded-md sm:min-h-0 sm:py-2',
};

export function ActionButton({
  loading,
  loadingText = 'Saving...',
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? loadingText : children}
    </button>
  );
}
