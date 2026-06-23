import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(function Input(
  { label, error, helperText, icon: Icon, className, id, ...rest },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none">
            <Icon size={16} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-9 bg-surface text-text text-sm rounded-md',
            'border outline-none',
            'placeholder:text-text-dim',
            'transition-colors duration-150',
            error
              ? 'border-error focus:border-error focus:ring-1 focus:ring-error/30'
              : 'border-border focus:border-accent focus:ring-1 focus:ring-accent/30',
            Icon ? 'pl-9 pr-3' : 'px-3',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...rest}
        />
      </div>

      {(error || helperText) && (
        <p
          className={cn(
            'text-xs',
            error ? 'text-error' : 'text-text-dim'
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
