import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ImageZoom({ src, isOpen, onClose }) {
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

  if (!isOpen || !src) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" aria-hidden="true" />

      {/* Close button */}
      <button
        onClick={onClose}
        className={cn(
          'absolute top-4 right-4 z-10',
          'flex items-center justify-center w-10 h-10 rounded-full',
          'bg-surface/80 border border-border text-text-secondary',
          'hover:text-text-bright hover:bg-surface',
          'transition-colors duration-150'
        )}
        aria-label="Close image viewer"
      >
        <X size={20} />
      </button>

      {/* Image */}
      <img
        src={src}
        alt="Zoomed view"
        className={cn(
          'relative max-w-full max-h-full object-contain rounded-lg',
          'animate-scale-in shadow-elevated'
        )}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}
