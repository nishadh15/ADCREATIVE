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
    <div className="md-body text-[15px] font-medium leading-7 text-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h3 className="mb-2 mt-5 inline-block bg-lime px-2 text-lg font-bold first:mt-0" {...p} />,
          h2: (p) => <h3 className="mb-2 mt-5 inline-block bg-lime px-2 text-lg font-bold first:mt-0" {...p} />,
          h3: (p) => <h4 className="mb-1.5 mt-4 text-base font-bold underline decoration-accent decoration-[3px] underline-offset-4 first:mt-0" {...p} />,
          h4: (p) => <h4 className="mb-1 mt-3 font-bold first:mt-0" {...p} />,
          p: (p) => <p className="my-3 first:mt-0 last:mb-0" {...p} />,
          ul: (p) => <ul className="my-3 list-square space-y-1.5 pl-6 marker:text-accent" style={{ listStyleType: "square" }} {...p} />,
          ol: (p) => <ol className="my-3 list-decimal space-y-1.5 pl-6 marker:font-mono marker:font-bold" {...p} />,
          li: (p) => <li className="pl-1" {...p} />,
          strong: (p) => <strong className="bg-lime/70 px-0.5 font-bold" {...p} />,
          em: (p) => <em className="italic" {...p} />,
          a: (p) => <a className="font-bold underline decoration-accent decoration-[3px] underline-offset-4 hover:bg-lime" target="_blank" rel="noopener noreferrer" {...p} />,
          hr: () => <hr className="my-5 border-t-[3px] border-ink" />,
          blockquote: (p) => <blockquote className="my-3 border-l-[6px] border-accent bg-paper py-1 pl-4" {...p} />,
          pre: (p) => <pre className="my-3 overflow-x-auto border-[3px] border-ink bg-ink p-4 font-mono text-[13px] leading-6 text-lime shadow-brutsm" {...p} />,
          code: ({ className, children, ...rest }) =>
            className ? <code className={className} {...rest}>{children}</code>
              : <code className="bg-ink px-1.5 py-0.5 font-mono text-[13px] text-lime" {...rest}>{children}</code>,
          table: (p) => <div className="my-4 overflow-x-auto border-[3px] border-ink shadow-brutsm"><table className="w-full min-w-[28rem] bg-bone text-left text-sm" {...p} /></div>,
          thead: (p) => <thead {...p} />,
          th: (p) => <th className="px-4 py-2.5" {...p} />,
          td: (p) => <td className="px-4 py-2.5 align-top" {...p} />,
        }}
      >
        {normalize(children)}
      </ReactMarkdown>
    </div>
  );
}
