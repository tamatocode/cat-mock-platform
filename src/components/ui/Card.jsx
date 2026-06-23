import { cn } from '../../lib/utils';

export default function Card({
  children,
  className,
  hover = false,
  padding = true,
  header,
  footer,
  ...rest
}) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-lg shadow-card',
        'transition-all duration-200 ease-out',
        hover && 'hover:border-border-light hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...rest}
    >
      {header && (
        <div className="px-5 py-3.5 border-b border-border">
          {typeof header === 'string' ? (
            <h3 className="text-sm font-semibold text-text-bright">{header}</h3>
          ) : (
            header
          )}
        </div>
      )}

      {padding ? (
        <div className="p-5">{children}</div>
      ) : (
        children
      )}

      {footer && (
        <div className="px-5 py-3.5 border-t border-border">
          {footer}
        </div>
      )}
    </div>
  );
}
