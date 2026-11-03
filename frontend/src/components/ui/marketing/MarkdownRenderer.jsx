import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

export default function MarkdownRenderer({ content = '' }) {
  return (
    <div className="docs-markdown-prose text-sm text-slate-300 leading-relaxed space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight pt-2 pb-1 border-b border-white/[0.08] mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <h2 id={id} className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-6 pb-2 border-t border-white/[0.08] mt-8 group flex items-center gap-2">
                <span>{children}</span>
                <a href={`#${id}`} className="text-slate-500 opacity-0 group-hover:opacity-100 hover:text-emerald-400 transition-opacity text-sm font-mono-tag" aria-label="Link to section">#</a>
              </h2>
            );
          },
          h3: ({ children }) => (
            <h3 className="text-lg font-bold text-emerald-300 tracking-tight pt-4 pb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-slate-300 font-normal">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300 my-3">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-300 my-3">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-white/[0.08] bg-[#0A0E17]">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#0F1626] border-b border-white/[0.08] text-slate-300 font-semibold font-mono-tag uppercase tracking-wider">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="p-3.5">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-3.5 border-t border-white/[0.04] text-slate-300">
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <div className="p-4 rounded-xl border-l-4 border-l-emerald-400 bg-emerald-950/20 text-emerald-200 text-xs sm:text-sm my-4 leading-relaxed">
              {children}
            </div>
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            if (!inline && match) {
              return <CodeBlock language={match[1]} code={codeString} />;
            }
            if (!inline && codeString.includes('\n')) {
              return <CodeBlock language="text" code={codeString} />;
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-[#141B2E] border border-white/10 text-emerald-300 font-mono-tag text-[12px]" {...props}>
                {children}
              </code>
            );
          },
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

