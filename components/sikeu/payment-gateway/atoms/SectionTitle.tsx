'use client';

import React from 'react';

interface SectionTitleProps {
  number?: string;
  title: string;
  description?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ number, title, description }) => {
  return (
    <div className="space-y-0.5 pb-2 border-b border-slate-100">
      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
        {number && (
          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-2xs font-extrabold flex items-center justify-center shrink-0">
            {number}
          </span>
        )}
        <span>{title}</span>
      </h3>
      {description && <p className="text-2xs text-slate-500 font-medium pl-7">{description}</p>}
    </div>
  );
};
