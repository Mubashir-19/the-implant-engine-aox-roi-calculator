
import React from 'react';

interface DisplayCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
}

export const DisplayCard: React.FC<DisplayCardProps> = ({
  label,
  value,
  subLabel,
}) => {
  return (
    <div className="bg-[#f0f9ff] border border-blue-50 rounded-[32px] p-8 transition-all hover:shadow-xl hover:shadow-blue-500/5">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
        {label}
      </div>
      <div className="text-4xl font-black text-[#1A365D] mb-3 leading-none tracking-tight">
        {value}
      </div>
      {subLabel && (
        <div className="text-[12px] font-bold text-slate-400/80">
          {subLabel}
        </div>
      )}
    </div>
  );
};
