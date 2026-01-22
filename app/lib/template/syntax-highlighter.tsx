'use client';

import { ReactNode, useMemo } from 'react';

/**
 * Highlights template-specific syntax within text.
 * Recognizes three types of syntax:
 * - [placeholders] - dynamic content markers (brand color badge)
 * - (instructions) - conditional guidance (muted italic)
 * - "verbatim" - exact text to include (bold)
 *
 * @param text The template text to highlight
 * @returns Array of ReactNodes with highlighted spans
 *
 * @example
 * ```tsx
 * <p>{highlightTemplateSyntax('[patient name] shows (normal findings)')}</p>
 * ```
 */
export function highlightTemplateSyntax(text: string): ReactNode[] {
  // Pattern to match [placeholder], (instruction), or "verbatim"
  const pattern = /(\[[^\]]+\])|(\([^)]+\))|("(?:[^"\\]|\\.)+"|"[^"]+")/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const fullMatch = match[0];
    if (match[1]) {
      // [placeholder] - brand colored badge
      parts.push(
        <span
          key={keyIndex++}
          className="inline-block px-1 py-0.5 mx-0.5 bg-brand/20 text-brand rounded text-sm font-medium"
        >
          {fullMatch}
        </span>
      );
    } else if (match[2]) {
      // (instruction) - muted italic
      parts.push(
        <span key={keyIndex++} className="text-text-secondary italic">
          {fullMatch}
        </span>
      );
    } else if (match[3]) {
      // "verbatim" - bold
      parts.push(
        <span key={keyIndex++} className="font-semibold">
          {fullMatch}
        </span>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Component wrapper for template syntax highlighting.
 * Useful when you want to render highlighted text inline.
 *
 * @example
 * ```tsx
 * <TemplateSyntaxHighlight text="[finding] is (conditionally) shown" />
 * ```
 */
export function TemplateSyntaxHighlight({ text }: { text: string }) {
  return <>{highlightTemplateSyntax(text)}</>;
}

/**
 * Creates memoized React-Markdown components that apply template syntax highlighting.
 * Use this with ReactMarkdown's components prop for consistent highlighting
 * across markdown-rendered content.
 *
 * @example
 * ```tsx
 * const components = useTemplateMarkdownComponents();
 * return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
 * ```
 */
export function useTemplateMarkdownComponents() {
  return useMemo(() => ({
    // Override paragraph to apply syntax highlighting
    p: ({ children }: { children?: ReactNode }) => {
      if (typeof children === 'string') {
        return <p>{highlightTemplateSyntax(children)}</p>;
      }
      // Handle mixed content (string + elements)
      if (Array.isArray(children)) {
        return (
          <p>
            {children.map((child, i) =>
              typeof child === 'string' ? highlightTemplateSyntax(child) : <span key={i}>{child}</span>
            )}
          </p>
        );
      }
      return <p>{children}</p>;
    },
    // Override list items
    li: ({ children }: { children?: ReactNode }) => {
      if (typeof children === 'string') {
        return <li>{highlightTemplateSyntax(children)}</li>;
      }
      if (Array.isArray(children)) {
        return (
          <li>
            {children.map((child, i) =>
              typeof child === 'string' ? highlightTemplateSyntax(child) : <span key={i}>{child}</span>
            )}
          </li>
        );
      }
      return <li>{children}</li>;
    },
    // Override text nodes in headings
    h1: ({ children }: { children?: ReactNode }) => (
      <h1>{typeof children === 'string' ? highlightTemplateSyntax(children) : children}</h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2>{typeof children === 'string' ? highlightTemplateSyntax(children) : children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3>{typeof children === 'string' ? highlightTemplateSyntax(children) : children}</h3>
    ),
    h4: ({ children }: { children?: ReactNode }) => (
      <h4>{typeof children === 'string' ? highlightTemplateSyntax(children) : children}</h4>
    ),
  }), []);
}
