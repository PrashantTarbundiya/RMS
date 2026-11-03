import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

export default function TableOfContents({ items = [], activeId, onItemClick }) {
  if (!items.length) return null;

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono-tag">
        On This Page
      </p>
      <nav className="space-y-1 text-xs">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemClick(item.id)}
              className={`w-full text-left py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                isActive
                  ? 'text-emerald-400 font-semibold bg-emerald-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className="truncate">{item.title}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

