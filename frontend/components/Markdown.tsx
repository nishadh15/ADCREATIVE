"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Models sometimes emit <br>; turn it into a line break (or a separator inside table rows). */
function normalize(src: string) {
  return src
    .split("\n")
    .map((l) => (l.trimStart().startsWith("|") ? l.replace(/<br\s*\/?>/gi, " · ") : l.replace(/<br\s*\/?>/gi, "\n")))
    .join("\n");
}

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="md-body text-[15px] leading-7 text-neutral-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h3 className="mb-2 mt-5 text-lg font-semibold tracking-tight text-white first:mt-0" {...p} />,
          h2: (p) => <h3 className="mb-2 mt-5 text-lg font-semibold tracking-tight text-white first:mt-0" {...p} />,
          h3: (p) => <h4 className="mb-1.5 mt-4 text-base font-semibold text-white first:mt-0" {...p} />,
          h4: (p) => <h4 className="mb-1 mt-3 font-semibold text-white first:mt-0" {...p} />,
          p: (p) => <p className="my-3 first:mt-0 last:mb-0" {...p} />,
          ul: (p) => <ul className="my-3 list-disc space-y-1.5 pl-6 marker:text-accent" {...p} />,
          ol: (p) => <ol className="my-3 list-decimal space-y-1.5 pl-6 marker:text-neutral-500" {...p} />,
          li: (p) => <li className="pl-1" {...p} />,
          strong: (p) => <strong className="font-semibold text-white" {...p} />,
          em: (p) => <em className="italic text-neutral-300" {...p} />,
          a: (p) => <a className="text-accent underline underline-offset-4 hover:opacity-80" target="_blank" rel="noopener noreferrer" {...p} />,
          hr: () => <hr className="my-5 border-white/10" />,
          blockquote: (p) => <blockquote className="my-3 border-l-2 border-accent/60 pl-4 text-neutral-400" {...p} />,
          pre: (p) => <pre className="my-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/50 p-4 text-[13px] leading-6" {...p} />,
          code: ({ className, children, ...rest }) =>
            className ? <code className={className} {...rest}>{children}</code>
              : <code className="rounded-md bg-white/10 px-1.5 py-0.5 text-[13px] text-orange-200" {...rest}>{children}</code>,
          table: (p) => <div className="my-4 overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[28rem] text-left text-sm" {...p} /></div>,
          thead: (p) => <thead className="bg-white/[0.05]" {...p} />,
          th: (p) => <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-300" {...p} />,
          td: (p) => <td className="border-t border-white/[0.06] px-4 py-2.5 align-top" {...p} />,
        }}
      >
        {normalize(children)}
      </ReactMarkdown>
    </div>
  );
}
