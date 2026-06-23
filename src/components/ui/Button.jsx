import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:bg-accent shadow-card hover:shadow-glow disabled:bg-accent/40 disabled:shadow-none',
  secondary:
    'bg-surface text-text border border-border hover:bg-surface-hover hover:border-border-light active:bg-surface-active disabled:bg-surface/50 disabled:border-border/50',
  danger:
    'bg-error text-white hover:bg-error/90 active:bg-error/80 shadow-card disabled:bg-error/40 disabled:shadow-none',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text active:bg-surface-active disabled:bg-transparent disabled:text-text-dim',
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-sm',
  md: 'h-9 px-4 text-sm gap-2 rounded-md',
  lg: 'h-11 px-6 text-base gap-2.5 rounded-lg',
};

const iconSizes = {
  sm: 14,
  md: 16,
  lg: 18,
};

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-70',
        'select-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <Loader2
          size={iconSizes[size]}
          className="animate-spin shrink-0"
        />
      ) : Icon ? (
        React.isValidElement(Icon) ? (
          <span className="shrink-0 flex items-center justify-center">{Icon}</span>
        ) : (
          <Icon size={iconSizes[size]} className="shrink-0" />
        )
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}
