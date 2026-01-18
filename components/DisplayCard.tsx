
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
    <div className="bg-[#F8FAFC] border border-slate-50 rounded-[32px] p-8 transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 group">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 group-hover:text-blue-500 transition-colors">
        {label}
      </div>
      <div className="text-[32px] font-black text-[#1A365D] mb-2 leading-none tracking-tight">
        {value}
      </div>
      {subLabel && (
        <div className="text-[11px] font-bold text-slate-400/80">
          {subLabel}
        </div>
      )}
    </div>
  );
};
