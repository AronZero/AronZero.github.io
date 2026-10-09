import { createElement, type CSSProperties, type ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';

type TextTag = 'h1' | 'h2' | 'h3' | 'p';

interface RevealLinesProps {
  as?: TextTag;
  lines: readonly ReactNode[];
  className?: string | undefined;
  id?: string;
}

/** Display text revealed line by line (line-mask, 90ms stagger, fade in reduced motion). */
export function RevealLines({ as = 'h2', lines, className, id }: RevealLinesProps) {
  const ref = useReveal<HTMLElement>();
  return createElement(
    as,
    { ref, id, className: ['reveal', className].filter(Boolean).join(' ') },
    lines.map((line, i) => (
      <span className="line" key={i}>
        <span>{line}</span>
      </span>
    )),
  );
}

type BlockTag = 'div' | 'p' | 'section' | 'dl' | 'ul' | 'li' | 'figure';

interface FadeUpProps {
  as?: BlockTag;
  delay?: number;
  className?: string | undefined;
  style?: CSSProperties;
  children: ReactNode;
}

/** A block that fades and rises into place once it enters the viewport. */
export function FadeUp({ as = 'div', delay = 0, className, style, children }: FadeUpProps) {
  const ref = useReveal<HTMLElement>();
  return createElement(
    as,
    {
      ref,
      className: ['fade-up', className].filter(Boolean).join(' '),
      style: delay ? ({ ...style, '--delay': `${delay}ms` } as CSSProperties) : style,
    },
    children,
  );
}

/** Grid placement helper: `col('1 / 8', '1 / -1')` → style for desktop + mobile columns. */
export function col(desktop: string, mobile?: string): CSSProperties {
  return { '--c': desktop, ...(mobile ? { '--cm': mobile } : {}) } as CSSProperties;
}
