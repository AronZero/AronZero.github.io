import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { featuredProjects, getProject } from '../content';
import { site } from '../content/site';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useMotionPreference } from '../hooks/useMotionPreference';
import { Link } from '../router/Router';
import { paths, saveExperience } from '../router/routes';
import still1600 from '../studio/assets/studio-still-1600.webp';
import still800 from '../studio/assets/studio-still-800.webp';
import { StationPanel } from '../studio/StationPanel';
import { OVERVIEW, STATION_IDS, STATIONS, stationById, type StationId } from '../studio/stations';
import { CLIPS, type SayEvent } from '../studio/StudioCharacter';
import { StudioScene, type Rect } from '../studio/StudioScene';
import styles from './StudioPage.module.css';

/*
 * The 3D "After Hours Studio" at /interactive (docs/STUDIO-DIRECTION.md): the baked room live in the browser,
 * with six stations that open the portfolio's content in a panel.
 *
 * Mouse and touch go to the canvas (a hit test on the station objects). Each station also has a real button
 * over it, in Tab order 01 -> 06, for keyboards and screen readers; those buttons ignore the pointer. The dock
 * lists the same stations as a second menu, and is the whole menu when the room is shown as a picture
 * (no WebGL, Save-Data, low memory, or a failed load).
 */

const isStationId = (value: string | null): value is StationId => (STATION_IDS as readonly string[]).includes(value ?? '');

/** Screenshot switches for headless checks: ?station=01..06 opens a panel, ?spot=x,y pins the ground spotlight,
 *  ?tilt=-1..1 holds the room turned as if the mouse were left or right, ?cursor=x,y puts a virtual cursor at
 *  canvas pixels (to capture the character noticing and shooing), ?clip=name@seconds freezes one animation clip,
 *  ?outline=01..06 shows a station's hover outline, ?touch=1 shows the touch-screen UI under a mouse,
 *  ?still=1 starts with the picture (as under Save-Data), ?fps=1 shows the frame-rate counter. */
function benchParams() {
  const params = new URLSearchParams(window.location.search);
  const spot = (params.get('spot') ?? '').split(',').map(Number);
  const validSpot = spot.length === 2 && spot.every((n) => Number.isFinite(n) && Math.abs(n) < 20);
  const [clipName = '', clipTime = '0'] = (params.get('clip') ?? '').split('@');
  const clip = (CLIPS as readonly string[]).includes(clipName)
    ? { name: clipName as (typeof CLIPS)[number], time: Math.max(0, Math.min(10, Number(clipTime) || 0)) }
    : null;
  const tilt = Number(params.get('tilt'));
  const cursor = (params.get('cursor') ?? '').split(',').map(Number);
  const validCursor = cursor.length === 2 && cursor.every((n) => Number.isFinite(n) && n >= 0 && n < 10000);
  const station = params.get('station');
  const outline = params.get('outline');
  return {
    station: isStationId(station) ? station : null,
    outline: isStationId(outline) ? outline : null,
    touch: params.get('touch') === '1',
    still: params.get('still') === '1',
    fps: params.get('fps') === '1',
    spot: validSpot ? (spot as [number, number]) : null,
    clip,
    cursor: validCursor ? (cursor as [number, number]) : null,
    tilt: params.has('tilt') && Number.isFinite(tilt) ? Math.max(-1, Math.min(1, tilt)) : null,
  };
}

/** Phones and tablets have no hover, so every station shows its outline and label, and the panel gets prev / next. */
const HOVER_QUERY = '(hover: hover) and (pointer: fine)';
function useTouchUI(forced: boolean): boolean {
  const [touch, setTouch] = useState(() => forced || !window.matchMedia(HOVER_QUERY).matches);
  useEffect(() => {
    if (forced) return;
    const query = window.matchMedia(HOVER_QUERY);
    const onChange = () => setTouch(!query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [forced]);
  return touch;
}

function stepStation(current: StationId, step: 1 | -1): StationId {
  const i = STATION_IDS.indexOf(current);
  return STATION_IDS[(i + step + STATION_IDS.length) % STATION_IDS.length]!;
}

function hasWebGL(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

/** Save-Data or a low-memory device: start with the picture and offer the 3D room on request. */
function prefersLite(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return !!nav.connection?.saveData || (nav.deviceMemory ?? 8) <= 2;
}

/** Why the room is shown as a picture instead of live 3D. */
type StillReason = 'no-webgl' | 'lite' | 'error';

const STILL_NOTE: Record<StillReason, string> = {
  'no-webgl': 'This browser can’t show the 3D studio, so here’s a picture of it. The stations still open below.',
  lite: 'Showing a picture of the studio to save data.',
  error: 'The 3D studio couldn’t load, so here’s a picture of it. The stations still open below.',
};

export default function StudioPage() {
  useDocumentMeta('Interactive studio', `${site.name}’s portfolio as a 3D studio: each object in the room opens part of the work.`);
  const { reduced } = useMotionPreference();
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<StudioScene | null>(null);
  const [params] = useState(benchParams);
  const [still, setStill] = useState<StillReason | null>(() =>
    !hasWebGL() ? 'no-webgl' : params.still || prefersLite() ? 'lite' : null,
  );
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [anchors, setAnchors] = useState<Partial<Record<StationId, Rect>>>({});
  const [hover, setHover] = useState<StationId | null>(params.outline);
  const [focus, setFocus] = useState<StationId | null>(null);
  const [open, setOpen] = useState<StationId | null>(params.station);
  const [fps, setFps] = useState(0);
  const [say, setSay] = useState<SayEvent | null>(null);
  const [projectIndex, setProjectIndex] = useState(0);
  const touch = useTouchUI(params.touch);
  const ready = !still && status === 'ready';
  const openRef = useRef(open);
  openRef.current = open;

  // Keyboard flow: opening moves focus into the panel; closing returns it to whatever opened it: the
  // station's button over the room, or its entry in the dock.
  const returnFocus = useRef<StationId | null>(null);
  const openedFromDock = useRef(false);
  const dockRefs = useRef(new Map<StationId, HTMLButtonElement | null>());
  const close = useCallback(() => {
    const current = openRef.current;
    setOpen(null);
    if (!current) return;
    const dockButton = dockRefs.current.get(current);
    if (openedFromDock.current && dockButton) dockButton.focus();
    else returnFocus.current = current;
  }, []);
  const openFromDock = (id: StationId) => {
    openedFromDock.current = true;
    if (openRef.current === id) close();
    else setOpen(id);
  };
  const openFromRoom = useCallback((id: StationId | null) => {
    openedFromDock.current = false;
    setOpen(id);
  }, []);
  const buttonRef = useCallback((el: HTMLButtonElement | null) => {
    if (el && returnFocus.current && el.dataset.station === returnFocus.current) {
      returnFocus.current = null;
      el.focus();
    }
  }, []);
  const closeRef = useCallback((el: HTMLButtonElement | null) => el?.focus(), []);

  const projects = featuredProjects.filter((p) => p.card);
  const featured = projects[projectIndex % Math.max(projects.length, 1)];

  useEffect(() => {
    const host = hostRef.current;
    if (!host || still) return;
    setStatus('loading');
    const scene = new StudioScene(host, {
      reducedMotion: reduced,
      screens: projects.map((p) => p.card!),
      arcade: getProject('astrox')?.card ?? undefined,
      callbacks: { onAnchors: setAnchors, onHover: setHover, onSelect: openFromRoom, onFps: setFps, onSay: setSay },
    });
    sceneRef.current = scene;
    if (params.spot) scene.pinSpot(...params.spot);
    if (params.tilt !== null) scene.pinTilt(params.tilt);
    if (params.cursor) scene.pinCursor(...params.cursor);
    if (params.clip) scene.freezeClip(params.clip.name, params.clip.time);
    scene.ready.then(
      () => setStatus('ready'),
      () => setStill('error'),
    );
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
    // The scene is built once (or when the visitor asks for 3D over the picture); motion changes take effect
    // on the next visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still === null]);

  // The camera follows the open station.
  useEffect(() => {
    sceneRef.current?.goTo(open ? stationById(open).view : OVERVIEW, open ? 0.2 : 0);
  }, [open]);

  // Accent outline: mouse hover or keyboard focus, never while a station is open.
  const highlighted = open ? null : (hover ?? focus);
  useEffect(() => {
    sceneRef.current?.setHighlighted(highlighted);
  }, [highlighted]);

  // Touch: a softer outline on every station while the room is in overview.
  useEffect(() => {
    sceneRef.current?.setHinted(touch && !open && ready ? STATION_IDS : []);
  }, [touch, open, ready]);

  // The monitor cycles projects (static under reduced motion, paused while station 01 is open).
  useEffect(() => {
    if (reduced || open === '01' || !ready || projects.length < 2) return;
    const id = window.setInterval(() => {
      sceneRef.current?.nextScreen();
      setProjectIndex((i) => (i + 1) % projects.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [reduced, open, ready, projects.length]);

  // Esc closes; 1-6 jump to a station; left/right step between stations while one is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const current = openRef.current;
      if (event.key === 'Escape' && current) {
        close();
      } else if (isStationId(`0${event.key}`)) {
        openFromRoom(`0${event.key}` as StationId);
      } else if (current && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        setOpen(stepStation(current, event.key === 'ArrowRight' ? 1 : -1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, openFromRoom]);

  // Touch labels sit above their station, kept on screen; one that would cover another moves up past it.
  // A thin leader line runs from each label to the middle of its object, so a pushed-up label still points home.
  const tagRefs = useRef(new Map<StationId, HTMLSpanElement | null>());
  const leaderRefs = useRef(new Map<StationId, SVGGElement | null>());
  useLayoutEffect(() => {
    if (!touch || open || !ready) return;
    const margin = 8;
    const gap = 6;
    const placed: { id: StationId; left: number; top: number; w: number; h: number }[] = [];
    const items = STATIONS.flatMap((station) => {
      const el = tagRefs.current.get(station.id);
      const rect = anchors[station.id];
      return el && rect ? [{ id: station.id, el, rect, w: el.offsetWidth, h: el.offsetHeight }] : [];
    });
    // Lowest first, so the ones pushed are always pushed up, away from their own object.
    items.sort((a, b) => b.rect.y - a.rect.y);
    for (const { id, el, rect, w, h } of items) {
      const left = Math.min(Math.max(rect.x + rect.w / 2 - w / 2, margin), window.innerWidth - margin - w);
      let top = rect.y - gap - h;
      for (let clash = true; clash; ) {
        clash = false;
        for (const p of placed) {
          if (left < p.left + p.w + gap && p.left < left + w + gap && top < p.top + p.h + gap && p.top < top + h + gap) {
            top = p.top - gap - h;
            clash = true;
          }
        }
      }
      placed.push({ id, left, top, w, h });
      el.style.translate = `${left - rect.x}px ${top - rect.y}px`;
    }
    for (const station of STATIONS) {
      const leader = leaderRefs.current.get(station.id);
      const rect = anchors[station.id];
      const tag = placed.find((p) => p.id === station.id);
      if (!leader) continue;
      leader.style.display = rect && tag ? '' : 'none';
      if (!rect || !tag) continue;
      const [line, dot] = leader.children as unknown as [SVGLineElement, SVGCircleElement];
      const x = rect.x + rect.w / 2;
      const y = rect.y + rect.h / 2;
      // The line leaves the label's bottom edge straight above the object where the label allows.
      line.setAttribute('x1', String(Math.min(Math.max(x, tag.left + 12), tag.left + tag.w - 12)));
      line.setAttribute('y1', String(tag.top + tag.h));
      line.setAttribute('x2', String(x));
      line.setAttribute('y2', String(y));
      dot.setAttribute('cx', String(x));
      dot.setAttribute('cy', String(y));
    }
  }, [anchors, touch, open, ready]);

  const chip = !touch && highlighted && anchors[highlighted] ? { station: stationById(highlighted), rect: anchors[highlighted]! } : null;
  const openStation = open ? stationById(open) : null;

  return (
    <div className={styles.studio}>
      <div ref={hostRef} className={styles.canvas} />
      {still && (
        <img
          className={styles.still}
          src={still1600}
          srcSet={`${still800} 800w, ${still1600} 1600w`}
          sizes="100vw"
          width={1600}
          height={1216}
          alt="The studio at night: a desk with a monitor and a retro computer, an arcade cabinet, a pinboard, a bookshelf, framed projects and a desk phone."
        />
      )}

      {ready && touch && !open && (
        <svg className={styles.leaders} aria-hidden="true">
          {STATIONS.map((station) => (
            <g key={station.id} ref={(el) => void leaderRefs.current.set(station.id, el)} style={{ display: 'none' }}>
              <line />
              <circle r={2.5} />
            </g>
          ))}
        </svg>
      )}

      {ready &&
        !open &&
        STATIONS.map((station) => {
          const rect = anchors[station.id];
          if (!rect) return null;
          return (
            <button
              key={station.id}
              ref={buttonRef}
              data-station={station.id}
              type="button"
              className={styles.hit}
              style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
              aria-label={`${station.id}, ${station.label}: open ${station.object}`}
              onFocus={(event) => setFocus(event.currentTarget.matches(':focus-visible') ? station.id : null)}
              onBlur={() => setFocus(null)}
              onClick={() => openFromRoom(station.id)}
            >
              {/* Touch: the always-on label is also a tap target, bigger than most objects at overview. */}
              {touch && (
                <span ref={(el) => void tagRefs.current.set(station.id, el)} className={styles.tag} aria-hidden="true">
                  <span className={styles.tagNum}>{station.id}</span>
                  {station.label}
                </span>
              )}
            </button>
          );
        })}
      {chip && (
        <span className={styles.chip} style={{ left: chip.rect.x + chip.rect.w / 2, top: chip.rect.y }} aria-hidden="true">
          {chip.station.id} · {chip.station.label}
        </span>
      )}

      <div className={styles.top}>
        <Link className="arrow-link" to={paths.home()} onClick={() => saveExperience('editorial')}>
          <ArrowLeft className="icon icon--left" size={16} aria-hidden="true" />
          <span>Editorial site</span>
        </Link>
        <h1 className="t-label">{site.name} · After hours studio</h1>
      </div>

      {!still && status === 'loading' && (
        <p className={`t-label ${styles.note}`} role="status">Loading the studio…</p>
      )}
      {still && !open && (
        <p className={styles.stillNote} role="status">
          {STILL_NOTE[still]}
          {still === 'lite' && (
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => setStill(null)}>
              Load the 3D studio (about 2.5 MB)
            </button>
          )}
        </p>
      )}

      <StationDock open={open} hover={hover} onOpen={openFromDock} onHover={setHover} buttonRefs={dockRefs.current} />

      {openStation && (
        <aside key={openStation.id} className={styles.panel} aria-labelledby="studio-panel-title">
          <button ref={closeRef} type="button" className={styles.close} onClick={close} aria-label="Back to the room (Esc)">
            <X size={18} aria-hidden="true" />
          </button>
          <div className={styles.panelBody}>
            <p className="t-label">
              {openStation.id} · {openStation.label}
            </p>
            <StationPanel id={openStation.id} featured={featured} titleId="studio-panel-title" />
            {!touch && <p className={`t-label ${styles.hint}`} aria-hidden="true">← → next station · Esc back</p>}
          </div>
          {touch && <StationSteps current={openStation.id} onStep={setOpen} />}
        </aside>
      )}

      {say && (
        <span
          key={`${say.text}-${say.x}-${say.y}`}
          className={styles.say}
          data-side={say.side}
          style={{ left: say.x, top: say.y }}
          role="status"
          onAnimationEnd={() => setSay(null)}
        >
          {say.text}
        </span>
      )}

      {params.fps && <p className={styles.fps} aria-hidden="true">{fps} fps</p>}
    </div>
  );
}

/** Touch screens: step to the neighbouring stations without going back to the room first. */
function StationSteps({ current, onStep }: { current: StationId; onStep: (id: StationId) => void }) {
  const prev = stationById(stepStation(current, -1));
  const next = stationById(stepStation(current, 1));
  return (
    <nav className={styles.steps} aria-label="Stations">
      <button type="button" className={styles.step} onClick={() => onStep(prev.id)} aria-label={`Previous: ${prev.id}, ${prev.label}`}>
        <ArrowLeft size={16} aria-hidden="true" />
        <span className={styles.stepText}>
          <span className={styles.tagNum}>{prev.id}</span>
          {prev.label}
        </span>
      </button>
      <button type="button" className={styles.step} data-dir="next" onClick={() => onStep(next.id)} aria-label={`Next: ${next.id}, ${next.label}`}>
        <span className={styles.stepText}>
          <span className={styles.tagNum}>{next.id}</span>
          {next.label}
        </span>
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}

/** The station dock: always on screen, a second menu beside the objects themselves (and the only one over the
 *  picture fallback). Hovering an entry outlines its object in the room; choosing the open one closes it. */
function StationDock({
  open,
  hover,
  onOpen,
  onHover,
  buttonRefs,
}: {
  open: StationId | null;
  hover: StationId | null;
  onOpen: (id: StationId) => void;
  onHover: (id: StationId | null) => void;
  buttonRefs: Map<StationId, HTMLButtonElement | null>;
}) {
  return (
    <nav className={styles.dock} aria-label="Stations">
      <ol role="list">
        {STATIONS.map((station) => (
          <li key={station.id}>
            <button
              ref={(el) => void buttonRefs.set(station.id, el)}
              type="button"
              className={styles.dockItem}
              aria-current={open === station.id ? 'true' : undefined}
              data-hover={hover === station.id || undefined}
              onClick={() => onOpen(station.id)}
              onPointerEnter={(event) => event.pointerType === 'mouse' && onHover(station.id)}
              onPointerLeave={(event) => event.pointerType === 'mouse' && onHover(null)}
            >
              <span className={styles.dockNum}>{station.id}</span>
              <span className={styles.dockLabel}>{station.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
