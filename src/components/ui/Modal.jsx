import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) {
  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative w-full bg-surface border border-border rounded-xl shadow-elevated',
          'animate-scale-in',
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-text-bright">{title}</h2>
            <button
              onClick={onClose}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-md',
                'text-text-secondary hover:text-text-bright',
                'hover:bg-surface-hover active:bg-surface-active',
                'transition-colors duration-150'
              )}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={cn('px-6 py-5', !title && 'pt-6')}>
          {!title && (
            <button
              onClick={onClose}
              className={cn(
                'absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-md',
                'text-text-secondary hover:text-text-bright',
                'hover:bg-surface-hover active:bg-surface-active',
                'transition-colors duration-150'
              )}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          )}
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
