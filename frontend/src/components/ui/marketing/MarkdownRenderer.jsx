import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import CodeBlock from './CodeBlock';
import Callout from './Callout';

/**
 * Enterprise Markdown Processor
 * Guarantees zero visible unparsed artifacts, clean table formatting,
 * and high-contrast typography adhering strictly to the design system.
 */
export default function MarkdownRenderer({ content = '' }) {
  // Sanitize content before rendering
  const sanitizedContent = content
    .replace(/&NDASH;/gi, '–')
    .replace(/&MDASH;/gi, '—');

  return (
    <div className="docs-prose text-[#9AA7A3] text-base leading-[1.7] space-y-5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          h1: ({ children, id }) => (
            <h1
              id={id}
              className="text-3xl sm:text-4xl font-semibold text-[#F3F6F5] tracking-tight pt-4 pb-2 border-b border-white/[0.08] mb-6"
            >
              {children}
            </h1>
          ),
          h2: ({ children, id }) => (
            <h2
              id={id}
              className="text-xl sm:text-2xl font-semibold text-[#F3F6F5] tracking-tight pt-8 pb-2 border-t border-white/[0.08] mt-10 group flex items-center justify-between"
            >
              <span>{children}</span>
              {id && (
                <a
                  href={`#${id}`}
                  className="text-[#66726E] opacity-0 group-hover:opacity-100 hover:text-[#3DDC97] transition-opacity text-sm font-mono"
                  aria-label="Direct anchor link"
                >
                  #
                </a>
              )}
            </h2>
          ),
          h3: ({ children, id }) => (
            <h3
              id={id}
              className="text-lg font-semibold text-[#F3F6F5] tracking-tight pt-4 pb-1 mt-6"
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-[#9AA7A3] font-normal text-pretty max-w-[62ch]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-2 text-[#9AA7A3] my-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-2 text-[#9AA7A3] my-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <Callout type="note">{children}</Callout>
          ),
          code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return (
                <CodeBlock
                  language={match[1]}
                  code={codeString}
                />
              );
            }

            return (
              <code
                className="font-mono text-[13px] px-1.5 py-0.5 rounded bg-white/[0.06] text-[#F3F6F5] border border-white/[0.08]"
                {...props}
              >
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-white/[0.08] bg-[#0B1013]">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#10171B] border-b border-white/[0.08] text-[#F3F6F5] font-semibold font-mono uppercase tracking-wider text-[11px]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-white/[0.04]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-white/[0.02] transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="py-3 px-4 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="py-3 px-4 text-[#9AA7A3]">
              {children}
            </td>
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
