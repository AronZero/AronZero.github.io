import {
  AnimationMixer,
  Color,
  HemisphereLight,
  LoopOnce,
  LoopRepeat,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  Vector3,
  type AnimationAction,
  type Camera,
  type Object3D,
  type Scene,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ROOM_CONFIG, ROOM_PHRASES } from '../components/hero/HeroRoom';
import characterUrl from './assets/character.glb?url';

/*
 * The seated designer (art/blender/character.py): rigid faceted parts on a small rig, hand-keyed clips.
 * Unlike the baked room it is lit live (a warm light at the desk lamp, a faint cool one at the monitor), so it
 * can move. Behaviour is the hero room's: notice a lingering cursor, shoo it when it comes too close, then
 * pointedly go back to work. Seen from the room camera it faces away, so "_r" clips turn toward screen-right.
 */

type Side = 'l' | 'r';
type State = 'idle' | 'notice' | 'shoo' | 'ignore';
export const CLIPS = ['type', 'notice_l', 'notice_r', 'shoo_l', 'shoo_r', 'still'] as const;
type Clip = (typeof CLIPS)[number];

export interface SayEvent {
  text: string;
  /** Head position in canvas pixels. */
  x: number;
  y: number;
  side: Side;
}

const FADE = 0.35; // seconds between clips
const HEAD_FOLLOW = 0.35; // radians of extra head turn toward the cursor while noticing
/** Reaction distances in head sizes on screen (so they hold at every zoom): he only reacts when the cursor
 *  almost touches him (Aron, 2026-11-02). Timings come from the hero room's ROOM_CONFIG. */
const NOTICE_HEADS = 2.2;
const PERSONAL_HEADS = 1.1;
const HEAD_SIZE = 0.24; // metres
/** Turning to the other shoulder: the cursor must cross this far past where his head was when he first
 *  noticed it, and a turn holds at least this long. Without both, a cursor straight above him flipped him
 *  left and right forever: each turn moves his head, which put the cursor on the other side again. */
const SIDE_DEADZONE_HEADS = 0.6;
const SIDE_HOLD_MS = 450;

export class StudioCharacter {
  private mixer: AnimationMixer | null = null;
  private actions = new Map<Clip, AnimationAction>();
  private current: AnimationAction | null = null;
  private head: Object3D | null = null;
  private state: State = 'idle';
  private side: Side = 'r';
  /** Head's screen x when he noticed the cursor, at rest: the fixed reference for which side the cursor is on. */
  private anchorX = 0;
  private sideAt = 0;
  private enterAt = 0;
  private personalAt = 0;
  private leaveAt = 0;
  private stateAt = 0;
  private cooldownUntil = 0;
  private shoos = 0;
  private lastPhrase = -1;
  private headYaw = 0;
  private headScreen = new Vector3();
  private headTop = new Vector3();
  private appliedYaw = 0;
  private frozen: { clip: Clip; time: number } | null = null;

  constructor(
    private reducedMotion: boolean,
    private onSay: (event: SayEvent) => void,
  ) {}

  async load(scene: Scene) {
    const gltf = await new GLTFLoader().loadAsync(characterUrl);
    const root = gltf.scene;
    const markers: Record<string, Vector3> = {};
    root.traverse((node) => {
      if (node.name.startsWith('light_')) markers[node.name] = node.getWorldPosition(new Vector3());
      if (node.name === 'head' && !(node instanceof Mesh)) this.head = node; // the bone, not the head mesh
      if (node instanceof Mesh && node.material instanceof MeshStandardMaterial) {
        node.material.flatShading = true; // faceted, like the props
        node.material.needsUpdate = true;
      }
    });
    scene.add(root);

    // Live light for the character only (the baked room ignores lights). Matches the Cycles character key.
    const warm = new Color(1.0, 0.66, 0.38);
    const key = new PointLight(warm, 0.9, 0, 2);
    key.position.copy(markers.light_char_key ?? new Vector3(0.76, 1.09, -3.15));
    const screen = new PointLight(new Color(0.7, 0.85, 1.0), 0.25, 0, 2);
    screen.position.copy(markers.light_mon_glow ?? new Vector3(0.85, 1.25, -3.55));
    const ambient = new HemisphereLight(new Color(1.0, 0.85, 0.7), new Color(0.25, 0.16, 0.1), 0.55);
    scene.add(key, screen, ambient);

    this.mixer = new AnimationMixer(root);
    for (const clip of gltf.animations) {
      const action = this.mixer.clipAction(clip);
      const name = clip.name as Clip;
      if (name.startsWith('shoo')) {
        action.setLoop(LoopOnce, 1);
        action.clampWhenFinished = true;
      } else {
        action.setLoop(LoopRepeat, Infinity);
      }
      this.actions.set(name, action);
    }
    this.play(this.reducedMotion ? 'still' : 'type', 0);
    if (this.frozen) this.freeze(this.frozen.clip, this.frozen.time);
  }

  /** Bench screenshots only: hold one clip at a time (seconds), behaviour off. */
  freeze(clip: Clip, time: number) {
    this.frozen = { clip, time };
    const action = this.actions.get(clip);
    if (!action) return;
    this.mixer?.stopAllAction();
    action.reset().play();
    action.time = Math.min(time, action.getClip().duration);
    action.paused = true;
    this.current = action;
  }

  /**
   * @param pointer cursor in canvas pixels, or null when there is no mouse over the page
   */
  update(dt: number, now: number, pointer: { x: number; y: number } | null, camera: Camera, size: { w: number; h: number }) {
    if (!this.mixer) return;
    // Undo last frame's look-at turn first: not every clip animates the head bone, and an un-reset turn
    // accumulated into a full spin.
    if (this.head && this.appliedYaw) this.head.rotateY(-this.appliedYaw);
    this.appliedYaw = 0;
    this.mixer.update(dt);
    if (this.reducedMotion || this.frozen || !this.head) return;

    // Where the head is on screen: the hero room's radii are measured from there.
    this.head.getWorldPosition(this.headScreen).project(camera);
    const hx = ((this.headScreen.x + 1) / 2) * size.w;
    const hy = ((1 - this.headScreen.y) / 2) * size.h;
    this.head.getWorldPosition(this.headTop);
    this.headTop.y += HEAD_SIZE;
    this.headTop.project(camera);
    const headPx = Math.max(8, Math.abs(((this.headScreen.y - this.headTop.y) / 2) * size.h));
    const noticeRadius = headPx * NOTICE_HEADS;
    const personalRadius = headPx * PERSONAL_HEADS;
    const dist = pointer ? Math.hypot(pointer.x - hx, pointer.y - hy) : Infinity;
    const C = ROOM_CONFIG;

    switch (this.state) {
      case 'idle':
        if (dist < noticeRadius) {
          this.enterAt ||= now;
          if (now - this.enterAt > C.noticeDwell) {
            this.anchorX = hx;
            this.setState('notice', now, pointer && pointer.x < hx ? 'l' : 'r');
          }
        } else this.enterAt = 0;
        break;
      case 'notice':
        if (pointer && now - this.sideAt > SIDE_HOLD_MS) {
          const dx = pointer.x - this.anchorX;
          const margin = headPx * SIDE_DEADZONE_HEADS;
          const want: Side = dx < -margin ? 'l' : dx > margin ? 'r' : this.side;
          if (want !== this.side) this.turn(want, now);
        }
        if (dist < personalRadius && now > this.cooldownUntil) {
          this.personalAt ||= now;
          if (now - this.personalAt > C.personalDwell) this.shoo(now, this.side, hx, hy);
        } else this.personalAt = 0;
        if (dist > noticeRadius) {
          this.leaveAt ||= now;
          if (now - this.leaveAt > C.lingerMs) this.setState('idle', now);
        } else this.leaveAt = 0;
        break;
      case 'shoo':
        if (now - this.stateAt > C.shooMs) this.setState('ignore', now);
        break;
      case 'ignore':
        if (now - this.stateAt > C.ignoreMs) this.setState('idle', now);
        break;
    }

    // While noticing, the head follows the cursor a little further than the clip turns it.
    const follow = this.state === 'notice' && pointer ? Math.max(-1, Math.min(1, (pointer.x - this.anchorX) / 300)) : 0;
    this.headYaw += (follow * HEAD_FOLLOW - this.headYaw) * Math.min(1, dt * 6);
    this.appliedYaw = -this.headYaw;
    this.head.rotateY(this.appliedYaw); // bone space: Y runs up the neck, so this turns the head left/right
  }

  dispose() {
    this.mixer?.stopAllAction();
  }

  private setState(next: State, now: number, side: Side = this.side) {
    this.state = next;
    this.side = side;
    this.stateAt = this.sideAt = now;
    this.enterAt = this.personalAt = this.leaveAt = 0;
    if (next === 'idle') this.shoos = 0;
    if (next === 'notice') this.play(`notice_${side}`);
    if (next === 'idle' || next === 'ignore') this.play('type');
  }

  /** Look over the other shoulder without restarting the notice timers (shoo and linger keep counting). */
  private turn(side: Side, now: number) {
    this.side = side;
    this.sideAt = now;
    this.play(`notice_${side}`);
  }

  private shoo(now: number, side: Side, hx: number, hy: number) {
    this.setState('shoo', now, side);
    this.play(`shoo_${side}`);
    this.shoos++;
    this.cooldownUntil = now + ROOM_CONFIG.cooldownMs * 2 ** (this.shoos - 1);
    let i = Math.floor(Math.random() * ROOM_PHRASES.length);
    if (i === this.lastPhrase) i = (i + 1) % ROOM_PHRASES.length;
    this.lastPhrase = i;
    this.onSay({ text: ROOM_PHRASES[i] ?? '', x: hx, y: hy, side });
  }

  private play(name: Clip, fade = FADE) {
    const next = this.actions.get(name);
    if (!next || next === this.current) return;
    next.reset().play();
    if (this.current) next.crossFadeFrom(this.current, fade, false);
    this.current = next;
  }
}
