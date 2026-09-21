import { useRef, useCallback, useEffect } from 'react';

export const useAnimationLoop = (callback: (time: number) => void) => {
  const requestRef = useRef<number>();
  const isRunning = useRef(false);

  const animate = useCallback((time: number) => {
    if (isRunning.current) {
      callback(time);
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [callback]);

  const start = useCallback(() => {
    if (!isRunning.current) {
      isRunning.current = true;
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const stop = useCallback(() => {
    if (isRunning.current) {
      isRunning.current = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { start, stop, isRunning: isRunning.current };
};
