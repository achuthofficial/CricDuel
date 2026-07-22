import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-ink text-ledger active:bg-ink/80 disabled:bg-ink/30',
  secondary: 'bg-transparent text-ink border-2 border-ink active:bg-ink/10 disabled:opacity-40',
  ghost: 'bg-transparent text-ink underline underline-offset-4 active:opacity-60',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`tap-target w-full rounded-xl px-5 py-3.5 text-base font-semibold transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
