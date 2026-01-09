
import React from 'react';

interface InputGroupProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  type?: 'currency' | 'percent' | 'number';
  helperText?: string;
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
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
        <label className={`text-sm font-semibold transition-colors ${isNegative ? 'text-red-600' : 'text-slate-700'}`}>
          {label}
        </label>
        <div className="relative flex items-center">
          {type === 'currency' && (
            <span className={`absolute left-3 font-medium transition-colors ${isNegative ? 'text-red-400' : 'text-slate-400'}`}>$</span>
          )}
          <input
            type="number"
            value={value}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
            className={`w-full md:w-40 bg-white border rounded-lg py-2 px-3 text-right outline-none transition-all ${
              isNegative 
                ? 'border-red-500 focus:ring-2 focus:ring-red-200 text-red-600' 
                : 'border-slate-200 focus:ring-2 focus:ring-[#0D7BEA] focus:border-[#0D7BEA]'
            } ${type === 'currency' ? 'pl-7' : ''} ${type === 'percent' ? 'pr-7' : ''}`}
          />
          {type === 'percent' && (
            <span className={`absolute right-3 font-medium transition-colors ${isNegative ? 'text-red-400' : 'text-slate-400'}`}>%</span>
          )}
        </div>
      </div>
      
      {isNegative ? (
        <p className="text-xs text-red-600 font-medium mt-1 animate-pulse">
          Value must be 0 or greater.
        </p>
      ) : helperText && (
        <p className="text-xs text-slate-500 italic mt-1 leading-relaxed">
          {helperText}
        </p>
      )}
    </div>
  );
};
