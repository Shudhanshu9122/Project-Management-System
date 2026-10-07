import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);
const DEFAULT_DURATION = 4500;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ variant = 'info', title, message, duration = DEFAULT_DURATION }) => {
      const id = nextId.current;
      nextId.current += 1;

      setToasts((current) => [...current, { id, variant, title, message }]);
      window.setTimeout(() => dismiss(id), duration);

      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toasts,
      dismiss,
      success: (title, message) => notify({ variant: 'success', title, message }),
      error: (title, message) => notify({ variant: 'error', title, message, duration: 6500 }),
      info: (title, message) => notify({ variant: 'info', title, message }),
    }),
    [toasts, dismiss, notify]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
