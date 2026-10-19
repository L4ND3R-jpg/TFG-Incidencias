import React from 'react';

export function CardDataStats({
  title,
  total,
  subtitle,
  children,
  isActive = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border bg-white p-5 shadow-xs transition duration-150 cursor-pointer ${
        isActive
          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
          {children}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{total}</h4>
        {subtitle && (
          <span className="text-[11px] font-medium text-slate-400">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
