import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import AutomationSuccessToast from './AutomationSuccessToast';
import { AutomationNotification } from '../../services/automation/notificationService';

interface Toast extends AutomationNotification {
  id: string;
  createdAt: number;
}

let toastIdCounter = 0;
const toastListeners: Set<(toast: Toast) => void> = new Set();

// Global toast API
export const automationToast = {
  show: (notification: AutomationNotification) => {
    const toast: Toast = {
      ...notification,
      id: `toast-${++toastIdCounter}`,
      createdAt: Date.now(),
    };
    
    toastListeners.forEach(listener => listener(toast));
    
    return toast.id;
  },
  
  success: (action: string, prospectName: string, results: any, nextActions?: any[]) => {
    return automationToast.show({
      type: 'success',
      title: '✅ Success!',
      message: `${action} completed for ${prospectName}`,
      action,
      prospectName,
      results,
      nextActions,
      duration: 8000,
    });
  },
  
  error: (action: string, prospectName: string, error: string) => {
    return automationToast.show({
      type: 'error',
      title: '❌ Error',
      message: `${action} failed for ${prospectName}: ${error}`,
      duration: 10000,
    });
  },
};

export default function AutomationToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleNewToast = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      
      // Auto-remove after duration
      if (toast.duration) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration);
      }
    };

    toastListeners.add(handleNewToast);
    
    return () => {
      toastListeners.delete(handleNewToast);
    };
  }, []);

  const handleDismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleNextAction = (toastId: string, action: string) => {
    // Dismiss current toast
    handleDismiss(toastId);
    
    // Trigger action (will be handled by parent component via event)
    window.dispatchEvent(new CustomEvent('automation:next-action', {
      detail: { action }
    }));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-md pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          {toast.type === 'success' ? (
            <AutomationSuccessToast
              action={toast.action || ''}
              prospectName={toast.prospectName || ''}
              results={toast.results}
              nextActions={toast.nextActions}
              onNextAction={(action) => handleNextAction(toast.id, action)}
              onDismiss={() => handleDismiss(toast.id)}
            />
          ) : (
            // Simple error toast
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{toast.title}</h3>
                  <p className="text-sm text-gray-600">{toast.message}</p>
                </div>
                <button
                  onClick={() => handleDismiss(toast.id)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

