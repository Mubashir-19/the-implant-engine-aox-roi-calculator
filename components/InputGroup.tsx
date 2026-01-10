
import React from 'react';
import { Info } from 'lucide-react';

interface InputGroupProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  type?: 'currency' | 'percent' | 'number';
  helperText?: string;
  tooltip?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const InputGroup: React.FC<InputGroupProps> = ({
  label,
  value,
  onChange,
  type = 'number',
  helperText,
  tooltip,
  min = 0,
  max,
  step = 1,
}) => {
  const isNegative = value < 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(isNaN(val) ? 0 : val);
  };

  return (
    <div className="group mb-4 last:mb-0">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <label className={`text-[13px] font-bold transition-colors ${isNegative ? 'text-red-600' : 'text-slate-600 group-hover:text-slate-900'}`}>
            {label}
          </label>
          {tooltip && (
            <div className="relative group/tooltip flex items-center">
              <Info className="w-3.5 h-3.5 text-slate-300 cursor-help hover:text-blue-500 transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-56 p-2.5 bg-slate-900 text-white text-[10px] rounded-lg shadow-2xl z-50 leading-relaxed animate-in fade-in zoom-in-95 duration-150">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          )}
        </div>
        <div className="relative flex items-center">
          <div className={`relative flex items-center w-full bg-[#F1F5F9] rounded-xl border transition-all duration-200 ${
            isNegative 
              ? 'border-red-500 bg-red-50 ring-2 ring-red-100' 
              : 'border-slate-100 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50'
          }`}>
            
            {type === 'currency' && (
              <span className={`pl-4 text-sm font-bold ${isNegative ? 'text-red-400' : 'text-slate-400'}`}>$</span>
            )}
            
            <input
              type="number"
              value={value || ''}
              onChange={handleChange}
              min={min}
              max={max}
              step={step}
              className={`w-full bg-transparent py-3.5 px-3 text-right text-sm font-black outline-none appearance-none ${
                isNegative ? 'text-red-600' : 'text-slate-800'
              }`}
            />

            {type === 'percent' && (
              <span className={`pr-4 text-sm font-bold ${isNegative ? 'text-red-400' : 'text-slate-400'}`}>%</span>
            )}
          </div>
        </div>
      </div>
      
      {isNegative ? (
        <p className="text-[10px] text-red-500 font-bold mt-1.5 uppercase tracking-wide">
          Value must be 0 or greater
        </p>
      ) : helperText && (
        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed italic">
          {helperText}
        </p>
      )}
    </div>
  );
};
