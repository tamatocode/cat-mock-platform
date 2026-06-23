import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const Select = forwardRef(function Select(
  { label, options = [], error, placeholder, className, id, ...rest },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full h-9 bg-surface text-text text-sm rounded-md',
            'border outline-none appearance-none',
            'px-3 pr-9',
            'transition-colors duration-150',
            error
              ? 'border-error focus:border-error focus:ring-1 focus:ring-error/30'
              : 'border-border focus:border-accent focus:ring-1 focus:ring-accent/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
});

export default Select;
