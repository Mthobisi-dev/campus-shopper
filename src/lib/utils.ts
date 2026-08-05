import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatZAR(amount: number): string {
  return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getBudgetPercentage(spent: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, (spent / total) * 100);
}

export function getBudgetStatus(spent: number, total: number): 'safe' | 'warning' | 'danger' {
  const pct = getBudgetPercentage(spent, total);
  if (pct >= 90) return 'danger';
  if (pct >= 70) return 'warning';
  return 'safe';
}

export function formatOrdinalDay(day: number): string {
  const d = Math.max(1, Math.min(31, Math.floor(day || 1)));
  if (d > 3 && d < 21) return `${d}th`;
  switch (d % 10) {
    case 1:  return `${d}st`;
    case 2:  return `${d}nd`;
    case 3:  return `${d}rd`;
    default: return `${d}th`;
  }
}

