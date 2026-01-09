
import React from 'react';

interface DisplayCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  variant?: 'primary' | 'secondary' | 'neutral';
}

export const DisplayCard: React.FC<DisplayCardProps> = ({
  label,
  value,
  subLabel,
  variant = 'neutral',
}) => {
  const variants = {
    // Azure tint
    primary: 'bg-[#0D7BEA]/10 border-[#0D7BEA]/20 text-[#0D7BEA]',
    // Cyan tint
    secondary: 'bg-[#19B5F6]/10 border-[#19B5F6]/20 text-[#19B5F6]',
    // Charcoal neutral
    neutral: 'bg-white border-slate-100 text-[#1F2328]',
  };

  return (
    <div className={`p-5 rounded-xl border shadow-sm ${variants[variant]}`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subLabel && (
        <div className="text-xs font-medium text-slate-400 mt-1">{subLabel}</div>
      )}
    </div>
  );
};
