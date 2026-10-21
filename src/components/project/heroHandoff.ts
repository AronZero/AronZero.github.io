/*
 * Hero handoff: the screenshot clicked in the project index (or a selected-work
 * card) grows into the
 * case-study hero. Both images share a view-transition-name for one route
 * change, and the router's View Transition morphs one into the other.
 */

import type { MouseEvent, RefObject } from 'react';

export const HERO_TRANSITION_NAME = 'project-hero';

let pending: string | null = null;

/** Same conditions under which the router plays a View Transition. */
function canMorph(): boolean {
  return document.documentElement.dataset.motion !== 'reduced' && typeof document.startViewTransition === 'function';
}

/** Name the visible index image for `slug` so it morphs into that project's hero. */
function beginHeroHandoff(container: HTMLElement | null, slug: string) {
  if (!container || !canMorph()) return;
  const img = [...container.querySelectorAll<HTMLImageElement>('img[data-hero]')]
    .find((el) => el.dataset.hero === slug && el.getClientRects().length > 0);
  if (!img) return; // e.g. keyboard activation with no preview showing
  img.style.setProperty('view-transition-name', HERO_TRANSITION_NAME);
  pending = slug;
}

/** onClick for links to a case study. Only plain clicks navigate in place; new-tab clicks leave the page as it is. */
export function heroHandoffClick(container: RefObject<HTMLElement | null>, slug: string) {
  return (e: MouseEvent) => {
    if (e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) beginHeroHandoff(container.current, slug);
  };
}

/** True while the case study for `slug` is the target of a handoff. */
export function isHeroHandoff(slug: string): boolean {
  return pending === slug;
}

export function endHeroHandoff() {
  pending = null;
}
