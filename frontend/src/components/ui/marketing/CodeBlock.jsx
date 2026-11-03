import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeBlock({ language = 'bash', code = '', filename = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#070A12] font-mono-tag text-xs my-4 shadow-sm">
      <div className="px-4 py-2 bg-[#0B0F19] border-b border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300">{filename || language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-emerald-300 leading-relaxed text-xs">
        <code>{code}</code>
      </pre>
    </div>
  );
}
