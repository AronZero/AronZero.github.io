import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { matchRoute, type Route } from './routes';

/*
 * A deliberately small router on the History API (no dependency).
 * - pushState navigation with link interception
 * - scroll restoration on back/forward
 * - hash scrolling, including across pages
 * - View Transitions between pages when motion is on
 */

interface Loc {
  pathname: string;
  search: string;
  hash: string;
}

interface NavigateOptions {
  replace?: boolean;
  /** Keep the scroll position (e.g. when only a filter changes). */
  keepScroll?: boolean;
}

interface RouterValue {
  route: Route;
  location: Loc;
  navigate: (to: string, options?: NavigateOptions) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

const readLocation = (): Loc => ({
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
});

function decodeHash(hash: string): string {
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1); // malformed escape sequence in a hand-typed URL
  }
}

function scrollToHash(hash: string): boolean {
  const target = hash ? document.getElementById(decodeHash(hash)) : null;
  if (!target) return false;
  target.scrollIntoView({ block: 'start' });
  return true;
}

function motionIsFull(): boolean {
  return document.documentElement.dataset.motion !== 'reduced';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Loc>(readLocation);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    if (window.location.hash) requestAnimationFrame(() => scrollToHash(window.location.hash));

    const onPopState = (event: PopStateEvent) => {
      setLocation(readLocation());
      const y = (event.state as { scrollY?: number } | null)?.scrollY ?? 0;
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string, options: NavigateOptions = {}) => {
    const url = new URL(to, window.location.href);
    // Only web and mail links ever leave the app; never run javascript:/data: URLs.
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return;
    if (url.origin !== window.location.origin) {
      window.location.assign(url.href);
      return;
    }

    const samePage = url.pathname === window.location.pathname;
    const sameDocument = samePage && url.search === window.location.search;

    // Remember where we were, for the back button.
    window.history.replaceState({ ...(window.history.state ?? {}), scrollY: window.scrollY }, '');
    const method = options.replace ? 'replaceState' : 'pushState';
    window.history[method]({ scrollY: 0 }, '', url.pathname + url.search + url.hash);

    if (sameDocument && url.hash) {
      setLocation(readLocation());
      scrollToHash(url.hash);
      return;
    }

    const commit = () => {
      flushSync(() => setLocation(readLocation()));
      if (url.hash && scrollToHash(url.hash)) return;
      if (!options.keepScroll) window.scrollTo({ top: 0, behavior: 'instant' });
    };

    if (!samePage && motionIsFull() && typeof document.startViewTransition === 'function') {
      document.startViewTransition(commit);
    } else {
      commit();
    }
  }, []);

  const value = useMemo<RouterValue>(
    () => ({ route: matchRoute(location.pathname, location.search), location, navigate }),
    [location, navigate],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const value = useContext(RouterContext);
  if (!value) throw new Error('useRouter must be used inside <RouterProvider>');
  return value;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  replace?: boolean;
  keepScroll?: boolean;
};

/** An <a> that navigates client-side, but still works with new-tab, middle-click and no JS. */
export function Link({ to, replace, keepScroll, onClick, target, ...rest }: LinkProps) {
  const { navigate } = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      (target && target !== '_self')
    ) {
      return;
    }
    event.preventDefault();
    navigate(to, { ...(replace ? { replace } : {}), ...(keepScroll ? { keepScroll } : {}) });
  };

  return <a href={to} target={target} onClick={handleClick} {...rest} />;
}
