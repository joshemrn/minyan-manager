'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface CounterProps {
  value: number;
  target?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTarget?: boolean;
  animated?: boolean;
  className?: string;
}

export default function Counter({
  value,
  target = 10,
  size = 'md',
  showTarget = true,
  animated = true,
  className,
}: CounterProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);
  const isComplete = value >= target;
  const percentage = Math.min((value / target) * 100, 100);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }

    const duration = 500;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animated]);

  const sizes = {
    sm: {
      container: 'w-16 h-16',
      number: 'text-xl',
      label: 'text-[10px]',
      ring: 'w-16 h-16',
      strokeWidth: 3,
    },
    md: {
      container: 'w-20 h-20',
      number: 'text-2xl',
      label: 'text-xs',
      ring: 'w-20 h-20',
      strokeWidth: 4,
    },
    lg: {
      container: 'w-24 h-24',
      number: 'text-3xl',
      label: 'text-sm',
      ring: 'w-24 h-24',
      strokeWidth: 5,
    },
    xl: {
      container: 'w-32 h-32',
      number: 'text-4xl',
      label: 'text-base',
      ring: 'w-32 h-32',
      strokeWidth: 6,
    },
  };

  const sizeConfig = sizes[size];
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      {/* Background ring */}
      <svg className={clsx(sizeConfig.ring, 'transform -rotate-90')}>
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke={isComplete ? '#dcfce7' : '#f3f4f6'}
          strokeWidth={sizeConfig.strokeWidth}
          className="transition-colors duration-300"
        />
        {/* Progress ring */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke={isComplete ? '#22c55e' : '#3b82f6'}
          strokeWidth={sizeConfig.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={clsx(
            'font-bold transition-colors duration-300',
            sizeConfig.number,
            isComplete ? 'text-green-600' : 'text-gray-900'
          )}
        >
          {displayValue}
        </span>
        {showTarget && (
          <span className={clsx('text-gray-500', sizeConfig.label)}>
            / {target}
          </span>
        )}
      </div>

      {/* Celebration effect when complete */}
      {isComplete && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-full h-full rounded-full bg-green-500/10 animate-ping" />
        </div>
      )}
    </div>
  );
}
