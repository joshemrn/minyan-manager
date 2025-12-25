'use client';

import clsx from 'clsx';

interface ProgressRingProps {
  value: number;
  max: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export default function ProgressRing({
  value,
  max,
  size = 'md',
  showLabel = true,
  color = 'primary',
  className,
}: ProgressRingProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const isComplete = value >= max;

  const sizes = {
    sm: { width: 48, stroke: 4, fontSize: 'text-xs' },
    md: { width: 64, stroke: 5, fontSize: 'text-sm' },
    lg: { width: 80, stroke: 6, fontSize: 'text-base' },
  };

  const colors = {
    primary: { track: '#e5e7eb', fill: '#3b82f6' },
    success: { track: '#dcfce7', fill: '#22c55e' },
    warning: { track: '#fef3c7', fill: '#f59e0b' },
    danger: { track: '#fee2e2', fill: '#ef4444' },
  };

  const sizeConfig = sizes[size];
  const colorConfig = isComplete ? colors.success : colors[color];
  const radius = (sizeConfig.width - sizeConfig.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={clsx('relative inline-flex items-center justify-center', className)}
      style={{ width: sizeConfig.width, height: sizeConfig.width }}
    >
      <svg
        width={sizeConfig.width}
        height={sizeConfig.width}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={sizeConfig.width / 2}
          cy={sizeConfig.width / 2}
          r={radius}
          fill="none"
          stroke={colorConfig.track}
          strokeWidth={sizeConfig.stroke}
        />
        {/* Progress */}
        <circle
          cx={sizeConfig.width / 2}
          cy={sizeConfig.width / 2}
          r={radius}
          fill="none"
          stroke={colorConfig.fill}
          strokeWidth={sizeConfig.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <span
          className={clsx(
            'absolute font-semibold',
            sizeConfig.fontSize,
            isComplete ? 'text-green-600' : 'text-gray-700'
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}
