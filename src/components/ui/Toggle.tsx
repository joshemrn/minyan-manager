'use client';

import clsx from 'clsx';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function Toggle({
  enabled,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}: ToggleProps) {
  const sizes = {
    sm: {
      toggle: 'h-5 w-9',
      dot: 'h-4 w-4',
      translate: 'translate-x-4',
    },
    md: {
      toggle: 'h-6 w-11',
      dot: 'h-5 w-5',
      translate: 'translate-x-5',
    },
  };

  const sizeConfig = sizes[size];

  return (
    <div className="flex items-center justify-between">
      {(label || description) && (
        <div className="flex-1 mr-4">
          {label && (
            <span className="text-sm font-medium text-gray-900">{label}</span>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={clsx(
          'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          sizeConfig.toggle,
          enabled ? 'bg-primary-600' : 'bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            sizeConfig.dot,
            enabled ? sizeConfig.translate : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
