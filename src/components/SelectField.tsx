'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  searchable?: boolean;
  required?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  label,
  disabled = false,
  searchable,
  required = false,
  className,
  emptyMessage = 'No options available',
}: SelectFieldProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const showSearch = searchable ?? options.length > 5;
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    if (showSearch) {
      const t = setTimeout(() => searchRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open, showSearch]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">
          {label}
        </label>
      )}

      {/* Hidden input for native form validation */}
      {required && (
        <input
          tabIndex={-1}
          className="pointer-events-none absolute opacity-0"
          value={value}
          onChange={() => {}}
          required
          aria-hidden
        />
      )}

      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          'flex w-full min-h-[44px] items-center justify-between gap-2 rounded-md border bg-white px-3 py-2.5 text-left text-sm transition-colors sm:min-h-0 sm:py-2',
          'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          disabled ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'border-slate-200 hover:border-slate-300',
          open && !disabled && 'border-blue-500 ring-1 ring-blue-500',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn('truncate', !selected && 'text-slate-400')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && !disabled && (
        <div
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          role="listbox"
        >
          {showSearch && (
            <div className="border-b border-slate-100 p-2">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <ul className="max-h-[min(50vh,14rem)] overflow-y-auto overscroll-contain py-1 sm:max-h-56">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</li>
            ) : (
              filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onClick={() => !option.disabled && pick(option.value)}
                      className={cn(
                        'flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors',
                        option.disabled
                          ? 'cursor-not-allowed text-slate-300'
                          : isSelected
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-800 hover:bg-slate-50',
                      )}
                    >
                      <Check
                        size={16}
                        className={cn('mt-0.5 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{option.label}</span>
                        {option.description && (
                          <span className="block truncate text-xs text-slate-500">{option.description}</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
