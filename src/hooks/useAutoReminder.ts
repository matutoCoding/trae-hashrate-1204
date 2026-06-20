import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';

export function useAutoReminder() {
  const checkAndAutoRemind = useAppStore((s) => s.checkAndAutoRemind);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkAndAutoRemind();

    intervalRef.current = setInterval(() => {
      checkAndAutoRemind();
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkAndAutoRemind]);
}
