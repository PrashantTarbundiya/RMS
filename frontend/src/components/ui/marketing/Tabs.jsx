import React from 'react';

/**
 * Technical Grouped Tabs Component
 */
export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-[#0B1013] border border-white/[0.08] text-xs font-mono select-none ${className}`}
    >
      {tabs.map((tab) => {
        const id = typeof tab === 'string' ? tab : tab.id;
        const label = typeof tab === 'string' ? tab : tab.label;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? 'bg-[#3DDC97] text-[#06090B] font-semibold shadow-[0_0_12px_rgba(61,220,151,0.25)]'
                : 'text-[#9AA7A3] hover:text-[#F3F6F5] hover:bg-white/[0.03]'
            }`}
          >
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#06090B]" />}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
