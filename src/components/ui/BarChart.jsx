import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export default function BarChart({ data = [], className }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Delay to trigger CSS transition after mount
    const timer = requestAnimationFrame(() => {
      setAnimated(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  if (data.length === 0) return null;

  const globalMax = Math.max(...data.map((d) => d.maxValue ?? d.value), 1);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {data.map((item, index) => {
        const max = item.maxValue ?? globalMax;
        const percentage = max > 0 ? Math.min((item.value / max) * 100, 100) : 0;

        return (
          <div key={index} className="flex flex-col gap-1">
            {/* Label row */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">
                {item.label}
              </span>
              <span className="text-xs font-semibold text-text tabular-nums">
                {item.value}
              </span>
            </div>

            {/* Bar track */}
            <div className="h-2 w-full rounded-full bg-surface-active overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: animated ? `${percentage}%` : '0%',
                  backgroundColor: item.color || 'var(--color-accent)',
                  transitionDelay: `${index * 80}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
