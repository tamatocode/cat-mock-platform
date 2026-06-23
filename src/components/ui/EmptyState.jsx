import { cn } from '../../lib/utils';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        'animate-fade-in',
        className
      )}
    >
      {Icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-surface-hover border border-border mb-5">
          <Icon size={28} className="text-text-dim" />
        </div>
      )}

      {title && (
        <h3 className="text-lg font-semibold text-text-bright mb-2">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button onClick={onAction} size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
