import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    className: 'border-success/30 bg-success-muted',
    iconClassName: 'text-success',
  },
  error: {
    icon: XCircle,
    className: 'border-error/30 bg-error-muted',
    iconClassName: 'text-error',
  },
  info: {
    icon: Info,
    className: 'border-accent/30 bg-accent-muted',
    iconClassName: 'text-accent',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-warning/30 bg-warning-muted',
    iconClassName: 'text-warning',
  },
};

let toastIdCounter = 0;

function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const handleDismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    clearTimeout(timerRef.current);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss, exiting]);

  useEffect(() => {
    timerRef.current = setTimeout(handleDismiss, 3000);
    return () => clearTimeout(timerRef.current);
  }, [handleDismiss]);

  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 w-[360px] px-4 py-3 rounded-lg border shadow-elevated backdrop-blur-sm',
        config.className,
        exiting ? 'animate-toast-exit' : 'animate-toast-enter'
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', config.iconClassName)} />
      <p className="flex-1 text-sm text-text-bright leading-snug">{toast.message}</p>
      <button
        onClick={handleDismiss}
        className="shrink-0 mt-0.5 p-0.5 rounded-md text-text-dim hover:text-text transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useRef({
    success: (message) => addToast('success', message),
    error: (message) => addToast('error', message),
    info: (message) => addToast('info', message),
    warning: (message) => addToast('warning', message),
  });

  // Keep the ref callbacks up-to-date without changing identity
  useEffect(() => {
    toast.current.success = (message) => addToast('success', message);
    toast.current.error = (message) => addToast('error', message);
    toast.current.info = (message) => addToast('info', message);
    toast.current.warning = (message) => addToast('warning', message);
  }, [addToast]);

  return (
    <ToastContext.Provider value={toast.current}>
      {children}

      {/* Toast container – fixed top-right */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
