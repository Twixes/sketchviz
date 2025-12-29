import Markdown from "react-markdown";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div
      className="prose prose-neutral max-w-none
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-h1:text-4xl prose-h1:mb-8
        prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-base prose-p:leading-7 prose-p:mb-4
        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
        prose-li:mb-2
        prose-strong:font-semibold prose-strong:text-black
        prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-700
        prose-code:text-sm prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-hr:my-8 prose-hr:border-neutral-200"
    >
      <Markdown>{content}</Markdown>
    </div>
  );
}
