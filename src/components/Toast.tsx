import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

let addToastFn: ((type: ToastType, message: string) => void) | null = null;

export function showToast(type: ToastType, message: string) {
  addToastFn?.(type, message);
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
};

const colors = {
  success: 'bg-green-500/10 border-green-500/30 text-green-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
};

const Toast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-[440px] px-4">
      <AnimatePresence>
        {toasts.map(toast => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md text-sm font-mono ${colors[toast.type]}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{toast.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
                <X className="w-3.5 h-3.5 opacity-50 hover:opacity-100 transition-opacity" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
