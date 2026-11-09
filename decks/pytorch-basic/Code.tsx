import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';

const highlighter = hljs.newInstance();
highlighter.registerLanguage('python', python);

/** Snippets in this deck have no multi-line tokens, so per-line splitting is safe. */
function highlightLines(source: string): string[] {
  return highlighter.highlight(source, { language: 'python' }).value.split('\n');
}

type CodeProps = {
  source: string;
  /** 1-based line numbers to emphasise; other lines are dimmed when set. */
  focus?: readonly number[];
  /** Number of leading lines to show; the rest stay in place but invisible. */
  visible?: number;
  title?: string;
  size?: 'md' | 'sm';
};

export function Code({ source, focus, visible, title, size = 'md' }: CodeProps) {
  const lines = highlightLines(source.replace(/^\n|\n$/g, ''));
  return <figure className={`pb-code pb-code-${size}`}>
    {title && <figcaption><i/><i/><i/><span>{title}</span></figcaption>}
    <pre>{lines.map((html, index) => {
      const n = index + 1;
      const hidden = visible !== undefined && n > visible;
      const dim = !!focus && focus.length > 0 && !focus.includes(n);
      return <div key={n} className="pb-code-line" data-hidden={hidden} data-dim={dim} data-focus={!!focus?.includes(n)}>
        <span className="pb-ln">{n}</span>
        <code dangerouslySetInnerHTML={{ __html: html || ' ' }}/>
      </div>;
    })}</pre>
  </figure>;
}
