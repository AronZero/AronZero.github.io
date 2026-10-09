import { useEffect } from 'react';
import { site } from '../content/site';

const DEFAULT_TITLE = `${site.name} — UI/UX Designer & Front-end Developer`;

/** Sets the tab title and meta description for the current page. */
export function useDocumentMeta(title: string | null, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${site.name}` : DEFAULT_TITLE;
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    }
  }, [title, description]);
}
