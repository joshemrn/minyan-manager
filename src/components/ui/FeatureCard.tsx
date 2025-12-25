'use client';

import clsx from 'clsx';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  colorScheme?: 'blue' | 'green' | 'amber' | 'purple' | 'rose' | 'cyan';
}

export default function FeatureCard({
  title,
  description,
  icon,
  colorScheme = 'blue',
}: FeatureCardProps) {
  const gradients = {
    blue: 'from-blue-500 to-cyan-500 shadow-blue-500/30',
    green: 'from-green-500 to-emerald-500 shadow-green-500/30',
    amber: 'from-amber-500 to-orange-500 shadow-amber-500/30',
    purple: 'from-purple-500 to-indigo-500 shadow-purple-500/30',
    rose: 'from-rose-500 to-pink-500 shadow-rose-500/30',
    cyan: 'from-cyan-500 to-teal-500 shadow-cyan-500/30',
  };

  return (
    <div className="group bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
      <div
        className={clsx(
          'h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110',
          gradients[colorScheme]
        )}
      >
        <div className="text-white">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mt-3 text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
