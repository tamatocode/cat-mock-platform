import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { formatTime, cn } from '../../lib/utils';

const Timer = forwardRef(({ totalSeconds, onTimeUp, isWarning = false }, ref) => {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);
  
  // Use refs for callbacks and values to avoid effect dependencies issues
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;

  useImperativeHandle(ref, () => ({
    pause: () => setIsRunning(false),
    resume: () => setIsRunning(true),
    getRemaining: () => timeLeftRef.current
  }));

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setIsRunning(false);
          // Call onTimeUp asynchronously to avoid render conflicts
          setTimeout(() => {
            if (onTimeUpRef.current) onTimeUpRef.current();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, timeLeft]); // depend on timeLeft being > 0 to start/stop the interval

  const showWarning = isWarning && timeLeft > 0 && timeLeft <= 300; // Under 5 minutes

  return (
    <div className={cn(
      "font-mono font-bold text-xl md:text-2xl tracking-wider tabular-nums transition-colors duration-300",
      showWarning ? "text-error animate-timer-warning" : "text-white"
    )}>
      {formatTime(timeLeft)}
    </div>
  );
});

Timer.displayName = 'Timer';
export default Timer;
