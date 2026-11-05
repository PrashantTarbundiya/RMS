import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Enterprise Code Block with Syntax Bar & Copy Action
 */
export default function CodeBlock({
  language = 'bash',
  code = '',
  filename = '',
  className = '',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl overflow-hidden border border-white/10 bg-[#06090B] font-mono text-xs my-6 ${className}`}>
      <div className="px-4 py-2 bg-[#0B1013] border-b border-white/[0.08] flex items-center justify-between text-[11px] text-[#9AA7A3]">
        <span className="font-medium text-[#F3F6F5] uppercase tracking-wider">{filename || language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#3DDC97]" />
              <span className="text-[#3DDC97]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[#F3F6F5] leading-relaxed text-xs">
        <code>{code}</code>
      </pre>
    </div>
  );
}
