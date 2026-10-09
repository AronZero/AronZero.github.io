import { useEffect, useRef, type RefObject } from 'react';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import styles from './HeroRoom.module.css';

/**
 * Tunables for the hero room. Distances are in scene units (the SVG viewBox is
 * 600 × 520), so they scale with the rendered size of the scene.
 */
export const ROOM_CONFIG = {
  noticeRadius: 330,   // he looks up from the screen
  personalRadius: 135, // he shoos the cursor away
  noticeDwell: 160,    // ms the cursor must stay inside a radius before he reacts
  personalDwell: 200,
  lingerMs: 700,       // keeps watching briefly after the cursor leaves
  shooMs: 1500,
  ignoreMs: 1000,      // pointedly back to work after shooing
  cooldownMs: 3200,    // no second shoo before this; doubles if the cursor keeps pestering
  pushPx: 70,          // how far the shoo pushes the scene's sense of the cursor
  parallax: { back: 2, desk: 5, figure: 8, glow: 12 },
} as const;

/** What he says while shooing; one at random, never the same twice in a row. */
export const ROOM_PHRASES = ['Shooo!', 'I’m busy.', 'Get away!', 'Do not disturb me.'];

const HEAD = { x: 320, y: 255 };
const SHOULDER = { l: { x: 256, y: 318 }, r: { x: 384, y: 318 } };
const UPPER = 66;
const FORE = 54;

interface Pose { s: number; e: number; h: number }
const TYPING: Pose = { s: -12, e: 108, h: 10 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Code on the screen: [x, y-row, width, bright]
const CODE: [number, number, number, number][] = [
  [214, 0, 34, 1], [252, 0, 58, 0],
  [226, 1, 92, 0],
  [226, 2, 46, 1], [276, 2, 74, 0],
  [238, 3, 70, 0],
  [238, 4, 38, 1], [280, 4, 96, 0],
  [226, 5, 40, 0],
  [214, 6, 12, 0],
  [214, 8, 52, 1], [270, 8, 40, 0],
  [226, 9, 118, 0],
  [226, 10, 64, 0], [294, 10, 30, 1],
];
const TYPED = { x: 238, row: 11, w: 112 };
const rowY = (row: number) => 184 + row * 10;

function Arm({ side, refs }: { side: 'l' | 'r'; refs: RefObject<SVGGElement | null>[] }) {
  const at = SHOULDER[side];
  const [upper, fore, hand] = refs;
  return (
    <g transform={`translate(${at.x} ${at.y})${side === 'l' ? ' scale(-1 1)' : ''}`}>
      <g className={side === 'l' ? styles.typeL : styles.typeR}>
        <g ref={upper} className={styles.arm} transform={`rotate(${TYPING.s})`}>
          <path className={styles.limb} d="M-13 -4C-14 20-12 46-10 66H10C12 46 14 20 13-4Z" />
          <circle className={styles.ink} cx="0" cy={UPPER} r="10" />
          <g ref={fore} transform={`translate(0 ${UPPER}) rotate(${TYPING.e})`}>
            <path className={styles.limb} d="M-10 0C-9 20-8 38-7 54H7C8 38 9 20 10 0Z" />
            <g ref={hand} transform={`translate(0 ${FORE}) rotate(${TYPING.h})`}>
              <path className={styles.limb} d="M-8 -2C-10 6-9 12-8 16H8C9 12 10 6 8-2Z" />
              <rect className={styles.limb} x="-7.6" y="13" width="3.4" height="13" rx="1.7" transform="rotate(8 -6 13)" />
              <rect className={styles.limb} x="-3.6" y="13" width="3.4" height="15" rx="1.7" />
              <rect className={styles.limb} x="0.4" y="13" width="3.4" height="14.5" rx="1.7" />
              <rect className={styles.limb} x="4.4" y="13" width="3.2" height="12" rx="1.6" transform="rotate(-8 6 13)" />
              <rect className={styles.limb} x="7" y="2" width="3.6" height="11" rx="1.8" transform="rotate(-38 8 3)" />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

/**
 * The hero's secondary layer: someone working late in a dark room, lit only by
 * a monitor. Idle motion is CSS; cursor reactions run in a requestAnimationFrame
 * loop that writes SVG attributes directly and sleeps when nothing changes, so
 * React never re-renders on pointer movement. Decorative: hidden from assistive
 * tech and transparent to the pointer.
 */
export function HeroRoom() {
  const { reduced } = useMotionPreference();
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const sayRef = useRef<HTMLSpanElement>(null);
  const backRef = useRef<SVGGElement>(null);
  const deskRef = useRef<SVGGElement>(null);
  const figureRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const noseRef = useRef<SVGGElement>(null);
  const cupLRef = useRef<SVGGElement>(null);
  const cupRRef = useRef<SVGGElement>(null);
  const armL = [useRef<SVGGElement>(null), useRef<SVGGElement>(null), useRef<SVGGElement>(null)];
  const armR = [useRef<SVGGElement>(null), useRef<SVGGElement>(null), useRef<SVGGElement>(null)];

  useEffect(() => {
    const root = rootRef.current, svg = svgRef.current, glow = glowRef.current, ring = ringRef.current, say = sayRef.current;
    const back = backRef.current, desk = deskRef.current, figure = figureRef.current, body = bodyRef.current;
    const head = headRef.current, nose = noseRef.current, cupL = cupLRef.current, cupR = cupRRef.current;
    const arms = { l: armL.map((r) => r.current), r: armR.map((r) => r.current) };
    if (!root || !svg || !glow || !ring || !say || !back || !desk || !figure || !body || !head || !nose || !cupL || !cupR) return;
    if (reduced) return;

    const C = ROOM_CONFIG;
    type State = 'idle' | 'notice' | 'shoo' | 'ignore';
    let state: State = 'idle';
    let pointer: { x: number; y: number } | null = null;
    let enterAt = 0, personalAt = 0, leaveAt = 0, shooAt = 0, ignoreAt = 0, cooldownUntil = 0;
    let shooSide: 'l' | 'r' = 'r', ringDone = false, saidDone = false, shoos = 0, lastPhrase = -1;
    // Smoothed values and their targets.
    const cur = { px: 0, py: 0, turn: 0, lift: 0, lean: 0, glow: 0.55, dirL: -100, dirR: -100 };

    const setState = (next: State) => {
      state = next;
      root.dataset.state = next;
      enterAt = personalAt = leaveAt = 0;
      if (next === 'idle') shoos = 0;
    };

    const poseArm = (side: 'l' | 'r', p: Pose) => {
      const [upper, fore, hand] = arms[side];
      upper?.setAttribute('transform', `rotate(${p.s.toFixed(2)})`);
      fore?.setAttribute('transform', `translate(0 ${UPPER}) rotate(${p.e.toFixed(2)})`);
      hand?.setAttribute('transform', `translate(0 ${FORE}) rotate(${p.h.toFixed(2)})`);
    };

    const spawnRing = (cx: number, cy: number, dx: number, dy: number) => {
      const box = root.getBoundingClientRect();
      const x = cx - box.left, y = cy - box.top;
      ring.animate(
        [
          { transform: `translate(${x}px, ${y}px) scale(.5)`, opacity: 0 },
          { transform: `translate(${x + dx * 10}px, ${y + dy * 10}px) scale(.8)`, opacity: 0.7, offset: 0.2 },
          { transform: `translate(${x + dx * 46}px, ${y + dy * 46}px) scale(1.25)`, opacity: 0 },
        ],
        { duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' },
      );
    };

    // A short line above his head, on the side of the waving hand.
    const speak = (headX: number, headY: number, scale: number) => {
      let i = Math.floor(Math.random() * ROOM_PHRASES.length);
      if (i === lastPhrase) i = (i + 1) % ROOM_PHRASES.length;
      lastPhrase = i;
      const box = root.getBoundingClientRect();
      say.textContent = ROOM_PHRASES[i] ?? '';
      say.dataset.side = shooSide;
      say.style.left = `${headX - box.left + (shooSide === 'r' ? 1 : -1) * 60 * scale}px`;
      say.style.top = `${headY - box.top - 105 * scale}px`;
      say.animate(
        [
          { opacity: 0, translate: '0 6px' },
          { opacity: 1, translate: '0 0', offset: 0.12 },
          { opacity: 1, translate: '0 0', offset: 0.78 },
          { opacity: 0, translate: '0 -4px' },
        ],
        { duration: 1700, easing: 'cubic-bezier(.16, 1, .3, 1)' },
      );
    };

    let raf = 0, last = 0, active = false;

    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const k = (rate: number) => 1 - Math.exp(-rate * dt);

      // Pointer in scene units, and the head's position on screen.
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const inv = ctm.inverse();
      const headScreen = new DOMPoint(HEAD.x, HEAD.y).matrixTransform(ctm);
      let p: { x: number; y: number } | null = null;
      let vClient = pointer;
      if (pointer) {
        const q = new DOMPoint(pointer.x, pointer.y).matrixTransform(inv);
        p = { x: q.x, y: q.y };
      }
      const dist = p ? Math.hypot(p.x - HEAD.x, p.y - HEAD.y) : Infinity;

      // ---- State machine ----
      if (state === 'idle') {
        if (dist < C.noticeRadius) {
          enterAt ||= now;
          if (now - enterAt > C.noticeDwell) setState('notice');
        } else enterAt = 0;
      } else if (state === 'notice') {
        if (dist < C.personalRadius && now >= cooldownUntil) {
          personalAt ||= now;
          if (now - personalAt > C.personalDwell && p) {
            setState('shoo');
            shooAt = now;
            ringDone = saidDone = false;
            shooSide = p.x >= HEAD.x ? 'r' : 'l';
          }
        } else personalAt = 0;
        if (state === 'notice') {
          if (dist > C.noticeRadius * 1.08) {
            leaveAt ||= now;
            if (now - leaveAt > C.lingerMs) setState('idle');
          } else leaveAt = 0;
        }
      } else if (state === 'shoo') {
        if (now - shooAt > C.shooMs) {
          setState('ignore');
          ignoreAt = now;
          // Pestering him makes him slower to react again.
          cooldownUntil = now + C.cooldownMs * 2 ** Math.min(shoos++, 2);
        }
      } else if (state === 'ignore' && now - ignoreAt > C.ignoreMs) {
        setState(dist < C.noticeRadius ? 'notice' : 'idle');
      }

      // ---- Shoo timeline ----
      const t = state === 'shoo' ? now - shooAt : 0;
      const raise = state !== 'shoo' ? 0 : t < 380 ? easeOut(t / 380) : t < 1000 ? 1 : 1 - easeInOut(Math.min(1, (t - 1000) / 500));
      const phase = t > 380 && t < 1000 ? (t - 380) / 620 : 0;
      const wave = Math.sin(phase * Math.PI * 3);

      // The shoo pushes the scene's sense of the cursor away from his desk.
      if (pointer && state === 'shoo' && t > 380) {
        const dx = pointer.x - headScreen.x, dy = pointer.y - headScreen.y;
        const len = Math.hypot(dx, dy) || 1;
        const push = C.pushPx * easeOut(Math.min(1, (t - 380) / 500)) * (1 - easeInOut(clamp((t - 1000) / 500, 0, 1)));
        vClient = { x: pointer.x + (dx / len) * push, y: pointer.y + (dy / len) * push };
        if (!ringDone && t > 430) {
          ringDone = true;
          spawnRing(pointer.x, pointer.y, dx / len, dy / len);
        }
      }
      if (state === 'shoo' && !saidDone && t > 340) {
        saidDone = true;
        speak(headScreen.x, headScreen.y, ctm.a);
      }
      const vp = vClient ?new DOMPoint(vClient.x, vClient.y).matrixTransform(inv) : null;

      // ---- Targets ----
      const watching = (state === 'notice' || state === 'shoo') && vp;
      const target = {
        px: vClient ? clamp((vClient.x / innerWidth - 0.5) * 2, -1, 1) : 0,
        py: vClient ? clamp((vClient.y / innerHeight - 0.5) * 2, -1, 1) : 0,
        turn: watching ? clamp((vp.x - HEAD.x) / 200, -1, 1) : 0,
        lift: watching ? clamp((HEAD.y - vp.y) / 240, -1, 1) : 0,
        lean: 0,
        glow: state === 'shoo' ? 1 : state === 'notice' ? 0.8 : 0.55,
      };
      target.lean = state === 'shoo' ? target.turn * 0.9 : state === 'notice' ? target.turn * 0.5 : 0;

      cur.px += (target.px - cur.px) * k(4);
      cur.py += (target.py - cur.py) * k(4);
      cur.turn += (target.turn - cur.turn) * k(state === 'ignore' ? 5 : 7);
      cur.lift += (target.lift - cur.lift) * k(6);
      cur.lean += (target.lean - cur.lean) * k(4);
      cur.glow += (target.glow - cur.glow) * k(3);
      for (const side of ['l', 'r'] as const) {
        const sh = SHOULDER[side];
        const dx = (p ? p.x - sh.x : 1) * (side === 'l' ? -1 : 1), dy = p ? p.y - sh.y : 0;
        const dir = clamp((Math.atan2(-dx, dy) * 180) / Math.PI, -150, -55);
        const key = side === 'l' ? 'dirL' : 'dirR';
        cur[key] += (dir - cur[key]) * k(10);
      }

      // ---- Apply ----
      const P = C.parallax;
      const shift = (g: SVGGElement, d: number) => g.setAttribute('transform', `translate(${(-cur.px * d).toFixed(2)} ${(-cur.py * d * 0.6).toFixed(2)})`);
      shift(back, P.back);
      shift(desk, P.desk);
      shift(figure, P.figure);
      const scale = ctm.a;
      glow.style.transform = `translate3d(${(-cur.px * P.glow * scale).toFixed(2)}px, ${(-cur.py * P.glow * 0.6 * scale).toFixed(2)}px, 0)`;
      glow.style.opacity = cur.glow.toFixed(3);

      body.setAttribute('transform', `rotate(${(cur.lean * 1.6).toFixed(2)} 320 470)`);
      head.setAttribute('transform', `translate(${(HEAD.x + cur.turn * 6).toFixed(2)} ${(HEAD.y - cur.lift * 3).toFixed(2)}) rotate(${(cur.turn * 4).toFixed(2)})`);
      const a = Math.abs(cur.turn);
      nose.setAttribute('transform', `scale(${cur.turn < 0 ? -1 : 1} 1) translate(${(-12 + 12 * a).toFixed(2)} 0)`);
      cupL.setAttribute('transform', `translate(${(a * 9).toFixed(2)} 0)`);
      cupR.setAttribute('transform', `translate(${(-a * 9).toFixed(2)} 0)`);

      for (const side of ['l', 'r'] as const) {
        const r = side === shooSide ? raise : 0;
        const dir = side === 'l' ? cur.dirL : cur.dirR;
        const raised: Pose = { s: dir, e: -55 + wave * 26, h: -wave * 16 };
        poseArm(side, { s: lerp(TYPING.s, raised.s, r), e: lerp(TYPING.e, raised.e, r), h: lerp(TYPING.h, raised.h, r) });
      }

      // Keep running while anything is moving or a timed transition is pending.
      const settled =
        Math.abs(target.px - cur.px) < 0.002 && Math.abs(target.py - cur.py) < 0.002 &&
        Math.abs(target.turn - cur.turn) < 0.002 && Math.abs(target.lift - cur.lift) < 0.002 &&
        Math.abs(target.lean - cur.lean) < 0.002 && Math.abs(target.glow - cur.glow) < 0.002;
      const pending = state === 'shoo' || state === 'ignore' || enterAt || personalAt || leaveAt;
      if (active && (!settled || pending)) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (raf || !active) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    let inView = false;
    const sync = () => {
      active = inView && document.visibilityState === 'visible';
      root.dataset.active = String(active);
      if (active) wake();
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    const io = new IntersectionObserver(([entry]) => { inView = !!entry?.isIntersecting; sync(); });
    io.observe(root);
    document.addEventListener('visibilitychange', sync);

    // Cursor reactions only where there is a real cursor.
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer = { x: e.clientX, y: e.clientY };
      wake();
    };
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      pointer = null;
      wake();
    };
    if (fine) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('scroll', wake, { passive: true });
      document.addEventListener('mouseout', onOut);
    }

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', wake);
      document.removeEventListener('mouseout', onOut);
      if (raf) cancelAnimationFrame(raf);
      // Back to the resting pose (also the reduced-motion pose).
      root.dataset.state = 'idle';
      for (const g of [back, desk, figure, body, nose, cupL, cupR]) g.removeAttribute('transform');
      head.setAttribute('transform', `translate(${HEAD.x} ${HEAD.y})`);
      nose.setAttribute('transform', 'translate(-12 0)');
      glow.style.transform = glow.style.opacity = '';
      poseArm('l', TYPING);
      poseArm('r', TYPING);
    };
    // Refs are stable; only the motion preference restarts the effect.
  }, [reduced]);

  return (
    <div ref={rootRef} className={styles.room} data-state="idle" aria-hidden="true">
      <div ref={glowRef} className={styles.glow}><div className={styles.flicker} /></div>

      <svg ref={svgRef} className={styles.scene} viewBox="0 0 600 520" focusable="false">
        <defs>
          <linearGradient id="room-screen" x1="0" y1="0" x2="0" y2="1">
            <stop className={styles.stop} offset="0" stopOpacity=".17" />
            <stop className={styles.stop} offset="1" stopOpacity=".1" />
          </linearGradient>
          <radialGradient id="room-pool" cx=".5" cy=".5" r=".5">
            <stop className={styles.stop} offset="0" stopOpacity=".16" />
            <stop className={styles.stop} offset="1" stopOpacity="0" />
          </radialGradient>
          <clipPath id="room-screen-clip"><rect x="206" y="174" width="228" height="138" /></clipPath>
        </defs>

        {/* Back wall: a shelf, barely touched by the light */}
        <g ref={backRef}>
          <g className={styles.shelf}>
            <rect x="468" y="96" width="122" height="4" />
            <rect x="478" y="66" width="8" height="30" />
            <rect x="488" y="71" width="7" height="25" />
            <rect x="497" y="61" width="9" height="35" />
            <rect x="510" y="74" width="6" height="24" transform="rotate(-14 513 96)" />
            <path d="M552 82h20l-2 14h-16Z" />
            <path d="M562 82c-8-6-12-14-10-20 6 3 9 10 10 20Zm0 0c3-9 8-15 14-16 0 7-6 13-14 16Zm0 0c-1-10 1-18 5-22 2 7 0 15-5 22Z" />
          </g>
        </g>

        {/* Desk, monitor, the light it throws */}
        <g ref={deskRef}>
          <path className={styles.form} d="M52 376H586L600 388H36Z" />
          <ellipse cx="320" cy="382" rx="210" ry="11" fill="url(#room-pool)" />
          <rect className={styles.ink} x="36" y="388" width="564" height="8" />
          <rect className={styles.ink} x="50" y="396" width="8" height="124" />
          <rect className={styles.ink} x="576" y="396" width="8" height="124" />
          <path className={styles.rim} d="M60 376.5H580" />

          <rect className={styles.ink} x="314" y="322" width="12" height="52" />
          <path className={styles.ink} d="M284 379C284 375 296 373 320 373S356 375 356 379Z" />
          <rect className={styles.ink} x="194" y="162" width="252" height="162" rx="4" />
          <rect x="206" y="174" width="228" height="138" fill="url(#room-screen)" />
          <g className={styles.screen} clipPath="url(#room-screen-clip)">
            {CODE.map(([x, row, w, bright], i) => (
              <rect key={i} className={bright ? styles.codeBright : styles.code} x={x} y={rowY(row)} width={w} height="3" rx="1" />
            ))}
            <rect className={`${styles.code} ${styles.typed}`} x={TYPED.x} y={rowY(TYPED.row)} width={TYPED.w} height="3" rx="1" />
            <g className={styles.caretMove}>
              <rect className={styles.caret} x={TYPED.x + 1} y={rowY(TYPED.row) - 2} width="2" height="7" />
            </g>
          </g>

          <rect className={styles.form} x="262" y="376" width="118" height="5" rx="1.5" />
          <ellipse className={styles.form} cx="404" cy="378" rx="7" ry="3" />
          <g>
            <rect className={styles.ink} x="470" y="356" width="18" height="24" rx="2" />
            <path className={styles.inkStroke} d="M488 362c7 0 7 12 0 12" />
            <path className={styles.rim} d="M470.5 358V378" />
          </g>
        </g>

        {/* The person and the chair */}
        <g ref={figureRef}>
          <g ref={bodyRef}>
            <g className={styles.breath}>
              <path className={styles.ink} d="M308 282H332L333 298C352 300 374 305 386 313C397 321 400 338 400 356L402 470H238L240 356C240 338 243 321 254 313C266 305 288 300 307 298Z" />
              <path className={styles.rim} d="M240 356C240 338 243 321 254 313C266 305 288 300 307 298" />
              <path className={styles.rim} d="M333 298C352 300 374 305 386 313C397 321 400 338 400 356" />

              <g ref={headRef} transform={`translate(${HEAD.x} ${HEAD.y})`}>
                <g className={styles.headIdle}>
                  <g ref={noseRef} transform="translate(-12 0)">
                    {/* <path className={styles.ink} d="M20 2C27 6 31 12 33 18 31 20 28 20 25 21L26 25C27 28 25 32 20 33Z" /> */}
                  </g>
                  <path className={styles.ink} d="M-27 6C-29-20-16-36 0-36S29-20 27 6C26 22 16 34 0 35S-26 22-27 6Z" />
                  <path className={styles.ink} d="M-28-2C-31-22-20-40-2-40 6-44 16-40 20-36 30-30 31-14 28-2 24-14 14-22 2-24-10-22-22-14-28-2Z" />
                  <path className={styles.inkBand} d="M-31 2C-34-30-18-47 0-47S34-30 31 2" />
                  <path className={styles.rim} d="M-33.5 0C-36-31-19.5-49.5 0-49.5S36-31 33.5 0" />
                  <g ref={cupLRef}><rect className={styles.ink} x="-38" y="-11" width="11" height="22" rx="4.5" /></g>
                  <g ref={cupRRef}><rect className={styles.ink} x="27" y="-11" width="11" height="22" rx="4.5" /></g>
                </g>
              </g>

              <Arm side="l" refs={armL} />
              <Arm side="r" refs={armR} />
            </g>
          </g>

          <path className={styles.ink} d="M266 392C266 380 274 374 286 374H354C366 374 374 380 374 392L370 470C370 476 366 480 360 480H280C274 480 270 476 270 470Z" />
          <path className={styles.rim} d="M268 384C270 377 278 374 286 374H354C362 374 370 377 372 384" />
          <rect className={styles.ink} x="315" y="480" width="10" height="22" />
          <path className={styles.inkStroke} d="M320 502L274 514M320 502L366 514M320 502V518" />
        </g>
      </svg>

      <span ref={ringRef} className={styles.ring} />
      <span ref={sayRef} className={styles.say} />
    </div>
  );
}
