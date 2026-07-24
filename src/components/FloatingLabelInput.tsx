'use client';

import { useId, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FloatingLabelInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  containerClassName?: string;
}

export function FloatingLabelInput({
  label,
  value,
  defaultValue,
  className,
  containerClassName,
  disabled,
  onFocus,
  onBlur,
  id: idProp,
  ...rest
}: FloatingLabelInputProps) {
  const autoId = useId();
  const id = idProp || autoId;
  const [focused, setFocused] = useState(false);

  const stringValue = value !== undefined && value !== null
    ? String(value)
    : defaultValue !== undefined && defaultValue !== null
      ? String(defaultValue)
      : '';
  const floated = focused || stringValue.length > 0;

  return (
    <div className={cn('relative', containerClassName)}>
      <input
        id={id}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        placeholder=" "
        className={cn(
          'peer min-h-[48px] w-full rounded-md border border-slate-300 bg-white px-3 pb-2 pt-4 text-base text-slate-900 outline-none transition-[border-color,box-shadow] duration-200',
          'focus:border-kedar-gold focus:ring-1 focus:ring-kedar-gold/40',
          'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
          'sm:text-sm',
          className,
        )}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      <label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute left-3 bg-white px-1 text-slate-500 transition-all duration-200 ease-out',
          floated
            ? 'top-0 -translate-y-1/2 text-[11px] font-medium text-kedar-gold-dark'
            : 'top-1/2 -translate-y-1/2 text-sm text-slate-400',
          focused && 'text-kedar-gold-dark',
          disabled && 'bg-slate-100 text-slate-400',
        )}
      >
        {label}
      </label>
    </div>
  );
}
