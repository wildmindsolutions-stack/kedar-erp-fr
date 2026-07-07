import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

type CustomerOption = {
  id: string;
  name: string;
  phone?: string | null;
  city?: string | null;
};

/** Append phone (or city) when multiple customers share the same name. */
export function formatCustomerOptionLabel(
  customer: CustomerOption,
  customers: CustomerOption[],
): string {
  const normalized = customer.name.trim().toLowerCase();
  const duplicates = customers.filter((c) => c.name.trim().toLowerCase() === normalized);
  if (duplicates.length <= 1) return customer.name;

  const suffix = customer.phone?.trim() || customer.city?.trim();
  return suffix ? `${customer.name} (${suffix})` : customer.name;
}
