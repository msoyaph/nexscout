import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
  localStorageKey?: string;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 3000,
  enabled = true,
  localStorageKey,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isSavingRef = useRef(false);

  const saveToLocalStorage = useCallback(() => {
    if (!localStorageKey) return;
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [data, localStorageKey]);

  const clearLocalStorage = useCallback(() => {
    if (!localStorageKey) return;
    try {
      localStorage.removeItem(localStorageKey);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }, [localStorageKey]);

  const loadFromLocalStorage = useCallback((): T | null => {
    if (!localStorageKey) return null;
    try {
      const saved = localStorage.getItem(localStorageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }, [localStorageKey]);

  const performSave = useCallback(async () => {
    if (isSavingRef.current) return;

    const currentData = JSON.stringify(data);
    if (currentData === lastSavedDataRef.current) {
      return;
    }

    isSavingRef.current = true;
    setStatus('saving');

    try {
      await onSave(data);
      lastSavedDataRef.current = currentData;
      setStatus('saved');
      clearLocalStorage();

      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setStatus('error');
      saveToLocalStorage();

      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave, clearLocalStorage, saveToLocalStorage]);

  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const currentData = JSON.stringify(data);
    if (currentData !== lastSavedDataRef.current && currentData !== '{}') {
      timerRef.current = setTimeout(() => {
        performSave();
      }, delay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, enabled, delay, performSave]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (enabled && status === 'idle') {
        saveToLocalStorage();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && enabled) {
        saveToLocalStorage();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, status, saveToLocalStorage]);

  const markAsSaved = useCallback(() => {
    lastSavedDataRef.current = JSON.stringify(data);
    clearLocalStorage();
  }, [data, clearLocalStorage]);

  return {
    status,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    markAsSaved,
    performSave,
  };
}
