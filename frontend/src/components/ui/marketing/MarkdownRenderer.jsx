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
    <div className="docs-prose text-foreground text-sm sm:text-base leading-[1.7] space-y-5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          h1: ({ children, id }) => (
            <h1
              id={id}
              className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight pt-4 pb-2 border-b border-border mb-6"
            >
              {children}
            </h1>
          ),
          h2: ({ children, id }) => (
            <h2
              id={id}
              className="text-xl sm:text-2xl font-bold text-foreground tracking-tight pt-8 pb-2 border-t border-border mt-10 group flex items-center justify-between"
            >
              <span>{children}</span>
              {id && (
                <a
                  href={`#${id}`}
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-opacity text-sm font-mono"
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
              className="text-base sm:text-lg font-semibold text-foreground tracking-tight pt-4 pb-1 mt-6"
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-muted-foreground font-normal max-w-[68ch]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground my-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground my-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1 text-muted-foreground">
              {children}
            </li>
          ),
          blockquote: ({ children }) => {
            // Check for GitHub alert style e.g. [!NOTE], [!IMPORTANT], [!WARNING]
            const text = String(children);
            let type = 'note';
            if (text.includes('[!IMPORTANT]') || text.includes('Important:')) type = 'important';
            if (text.includes('[!WARNING]') || text.includes('Warning:')) type = 'warning';
            return <Callout type={type}>{children}</Callout>;
          },
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
                className="font-mono text-xs px-1.5 py-0.5 rounded bg-secondary text-foreground border border-border"
                {...props}
              >
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-secondary/70 border-b border-border text-foreground font-semibold font-mono uppercase tracking-wider text-[11px]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-secondary/40 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="py-3 px-4 font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="py-3 px-4 text-muted-foreground">
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
