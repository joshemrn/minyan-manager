'use client';

import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorScheme?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorScheme = 'primary',
}: StatCardProps) {
  const colorStyles = {
    primary: {
      bg: 'bg-gradient-to-br from-primary-500 to-primary-600',
      light: 'bg-primary-50',
      text: 'text-primary-600',
      shadow: 'shadow-primary-500/30',
    },
    success: {
      bg: 'bg-gradient-to-br from-green-500 to-emerald-500',
      light: 'bg-green-50',
      text: 'text-green-600',
      shadow: 'shadow-green-500/30',
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-500 to-orange-500',
      light: 'bg-amber-50',
      text: 'text-amber-600',
      shadow: 'shadow-amber-500/30',
    },
    danger: {
      bg: 'bg-gradient-to-br from-red-500 to-rose-500',
      light: 'bg-red-50',
      text: 'text-red-600',
      shadow: 'shadow-red-500/30',
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      shadow: 'shadow-blue-500/30',
    },
  };

  const colors = colorStyles[colorScheme];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center">
              <span
                className={clsx(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="ml-2 text-xs text-gray-500">vs last week</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={clsx(
              'h-12 w-12 rounded-xl flex items-center justify-center shadow-lg',
              colors.bg,
              colors.shadow
            )}
          >
            <div className="text-white">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}
