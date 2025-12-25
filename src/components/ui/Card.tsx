'use client';

import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function Card({
  children,
  className,
  highlight = false,
  onClick,
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl shadow-sm border transition-all duration-300',
        highlight
          ? 'border-green-300 ring-2 ring-green-500/20 bg-gradient-to-br from-green-50/50 to-emerald-50/50'
          : 'border-gray-100',
        (onClick || hoverable) && 'cursor-pointer hover:shadow-xl hover:scale-[1.01]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('px-5 py-4 border-b border-gray-100', className)}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx('px-5 py-5', className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl', className)}>
      {children}
    </div>
  );
}
