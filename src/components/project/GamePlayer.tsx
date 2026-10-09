import { useEffect, useRef, useState } from 'react';
import { Maximize, Play, Square, Volume2, VolumeX } from 'lucide-react';
import type { PlayableProject } from '../../content';
import styles from './GamePlayer.module.css';

/** Globals the PICO-8 HTML shell defines on its window (it is same-origin, under /public). */
interface Pico8Window extends Window {
  p8_run_cart?: () => void;
  p8_request_fullscreen?: () => void;
  p8_touch_detected?: boolean;
  pico8_audio_context?: AudioContext;
  Module?: { pico8ToggleSound?: () => void };
}

/* Fits the stock PICO-8 shell into our frame without editing the export: our background,
   no scrollbars, and its side and close buttons replaced by the toolbar below the frame. */
const shellCss = (background: string) => `
  html, body { overflow: hidden !important; background: ${background} !important; }
  #p8_menu_buttons, #p8b_close { display: none !important; }
`;

/**
 * The exported PICO-8 page in a frame, behind a poster.
 * The shell (~50 KB) loads lazily; the cartridge only loads when the visitor presses Start,
 * which also boots it inside that click so sound is allowed to play.
 * Esc hands the keyboard back to the page; Stop reloads the shell to end the game.
 */
export function GamePlayer({ project }: { project: PlayableProject }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const stopRef = useRef<HTMLButtonElement>(null);
  const loaded = useRef(false);
  const pending = useRef(false);
  const refocusStart = useRef(false);
  const [running, setRunning] = useState(false);
  const [muted, setMuted] = useState(false);
  // A new key remounts the frame, which is the only clean way to stop a PICO-8 cart.
  const [session, setSession] = useState(0);

  const shell = () => frameRef.current?.contentWindow as Pico8Window | null | undefined;

  const boot = () => {
    const frame = frameRef.current;
    const win = shell();
    if (!frame || !win?.p8_run_cart) return;
    // The tap happened on our button, so the shell never saw a touch: tell it, for on-screen controls.
    if (window.matchMedia('(pointer: coarse)').matches) win.p8_touch_detected = true;
    win.p8_run_cart();
    // React lifts `inert` on the next render; lift it now so the frame can take the keyboard.
    frame.inert = false;
    frame.focus();
  };

  const onLoad = () => {
    const win = shell();
    if (!win) return;
    loaded.current = true;
    const style = win.document.createElement('style');
    style.textContent = shellCss(getComputedStyle(document.documentElement).getPropertyValue('--surface-1'));
    win.document.head.append(style);
    win.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        stopRef.current?.focus();
      },
      true,
    );
    if (pending.current) {
      pending.current = false;
      boot();
    }
  };

  const start = () => {
    setRunning(true);
    if (loaded.current) boot();
    else pending.current = true;
  };

  const stop = () => {
    shell()?.pico8_audio_context?.close().catch(() => {});
    loaded.current = false;
    pending.current = false;
    refocusStart.current = true;
    setRunning(false);
    setMuted(false);
    setSession((s) => s + 1);
  };

  const toggleSound = () => {
    shell()?.Module?.pico8ToggleSound?.();
    setMuted((m) => !m);
    frameRef.current?.focus();
  };

  // The shell's own full screen keeps its pixel-perfect scaling (the frame element alone would not).
  const fullScreen = () => shell()?.p8_request_fullscreen?.();

  useEffect(() => {
    if (!running && refocusStart.current) {
      refocusStart.current = false;
      startRef.current?.focus();
    }
  }, [running]);

  return (
    <div className={styles.player}>
      <div className="crop bleed-m">
        <div className="frame">
          <div className="frame__bar">
            <span>{project.number}</span>
            <span>PICO-8 · 128 × 128</span>
          </div>
          <div className={styles.stage} data-running={running || undefined}>
            <iframe
              key={session}
              ref={frameRef}
              className={styles.frame}
              src={project.embedPath}
              title={`${project.title}, playable game`}
              loading="lazy"
              allow="fullscreen; autoplay; gamepad"
              onLoad={onLoad}
              inert={!running}
              tabIndex={running ? 0 : -1}
            />
            {!running && (
              <button ref={startRef} type="button" className={styles.poster} onClick={start}>
                {project.hero && (
                  <img className={styles.posterShot} src={project.hero.src} data-pixel alt="" decoding="async" />
                )}
                <span className={`btn btn--primary ${styles.posterBtn}`}>
                  <Play className="icon" size={16} aria-hidden="true" /> Start game
                </span>
                <span className="sr-only">: {project.title}. The game has sound.</span>
              </button>
            )}
          </div>
        </div>
        <span className="crop__marks" aria-hidden="true" />
      </div>

      <div className={styles.toolbar}>
        <p className="t-small" aria-live="polite">
          {running ? 'Playing. Esc returns the keyboard to the page.' : 'The game has sound.'}
        </p>
        <div className={styles.actions}>
          <button className="btn btn--secondary btn--sm" type="button" onClick={toggleSound} disabled={!running} aria-pressed={muted}>
            {muted ? <VolumeX className="icon" size={16} aria-hidden="true" /> : <Volume2 className="icon" size={16} aria-hidden="true" />}
            Mute
          </button>
          <button className={`btn btn--secondary btn--sm ${styles.full}`} type="button" onClick={fullScreen} disabled={!running}>
            <Maximize className="icon" size={16} aria-hidden="true" /> Full screen
          </button>
          <button ref={stopRef} className="btn btn--secondary btn--sm" type="button" onClick={stop} disabled={!running}>
            <Square className="icon" size={14} aria-hidden="true" /> Stop
          </button>
        </div>
      </div>
    </div>
  );
}
