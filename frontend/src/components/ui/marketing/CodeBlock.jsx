import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Enterprise Code Block with Syntax Bar & Copy Action
 * Full dual-theme light/dark contrast compliance.
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
    <div className={`rounded-xl overflow-hidden border border-border bg-card font-mono text-xs my-6 shadow-sm ${className}`}>
      <div className="px-4 py-2 bg-secondary/80 border-b border-border flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground uppercase tracking-wider">{filename || language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-foreground leading-relaxed text-xs font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
