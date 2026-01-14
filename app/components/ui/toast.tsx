'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Toast types
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast icon based on type
function ToastIcon({ type }: { type: ToastType }) {
  switch (type) {
    case 'success':
      return <span className="text-lg">&#10003;</span>;
    case 'error':
      return <span className="text-lg">&#10007;</span>;
    case 'warning':
      return <span className="text-lg">&#9888;</span>;
    case 'info':
    default:
      return <span className="text-lg">&#8505;</span>;
  }
}

// Single toast component
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const bgColors: Record<ToastType, string> = {
    success: 'bg-success/10 border-success text-success',
    error: 'bg-error/10 border-error text-error',
    warning: 'bg-warning/10 border-warning text-warning',
    info: 'bg-info/10 border-info text-info',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${bgColors[toast.type]}`}
      role="alert"
      data-testid={`toast-${toast.type}`}
    >
      <ToastIcon type={toast.type} />
      <span className="flex-1 text-sm font-medium text-text-primary">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Close toast"
      >
        &#10005;
      </button>
    </motion.div>
  );
}

// Toast container
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, type, message, duration };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast container - fixed at top right */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence mode="sync">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => hideToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
