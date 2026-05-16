import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface Props {
  letter: string;
  title: string;
  markdown: string;
}

export function OutputSection({ letter, title, markdown }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section
      data-output-section
      className="scroll-mt-20"
      aria-labelledby={`sec-${letter}`}
    >
      <div className="flex items-start justify-between gap-4 mb-5 pb-3 border-b border-border">
        <h2
          id={`sec-${letter}`}
          className="font-serif text-2xl text-primary leading-tight"
        >
          <span className="text-muted-foreground mr-2">{letter}.</span>
          {title}
        </h2>
        <button
          type="button"
          onClick={copy}
          data-print-hide
          className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1"
        >
          {copied ? "Copied" : "Copy section"}
        </button>
      </div>
      <div className="prose-doc">
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="my-4 leading-relaxed text-foreground">{children}</p>
            ),
            h2: ({ children }) => (
              <h3 className="font-serif text-lg text-primary mt-8 mb-3">{children}</h3>
            ),
            h3: ({ children }) => (
              <h4 className="font-sans uppercase tracking-wider text-xs text-muted-foreground mt-6 mb-2">
                {children}
              </h4>
            ),
            ul: ({ children }) => (
              <ul className="my-4 space-y-2 list-disc pl-5 marker:text-primary/60">
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed text-foreground">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-primary">{children}</strong>
            ),
            table: ({ children }) => (
              <div className="my-5 overflow-x-auto">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="border-b-2 border-primary">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="text-left py-2 px-3 font-sans text-xs uppercase tracking-wider text-muted-foreground">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="py-2.5 px-3 border-b border-border align-top text-foreground">
                {children}
              </td>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </section>
  );
}
