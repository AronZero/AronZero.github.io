import {
  AgXToneMapping,
  Box3,
  CanvasTexture,
  Color,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
  type BufferGeometry,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import glbUrl from './assets/studio.glb?url';
import bakeUrl from './assets/studio-bake.jpg?url';
import bakePhoneUrl from './assets/studio-bake-2048.jpg?url';
import groundUrl from './assets/ground-bake.jpg?url';
import { CLIPS, StudioCharacter, type SayEvent } from './StudioCharacter';
import { OVERVIEW, STATIONS, type StationId, type StationView } from './stations';

/*
 * After Hours Studio, runtime side.
 * The room's lighting is baked in Blender (art/blender/studio.py) into one atlas that already went through the
 * AgX view transform, so everything static is drawn unlit and untone-mapped: the browser shows the Cycles look.
 * Only the screens are live. Stations are a pan + zoom of the same orthographic view; the mouse adds a small
 * yaw so the room turns toward the side the cursor is on.
 */

/** Blender (x, y, z) with Z up -> three.js (x, z, -y), the glTF convention. */
const fromBlender = (x: number, y: number, z: number) => new Vector3(x, z, -y);

const WORLD_UP = new Vector3(0, 1, 0);
/** Direction from the target toward the camera: Blender (1, -1, 0.95). */
const VIEW_DIR = fromBlender(1, -1, 0.95).normalize();
/** Screen-right in world space for the unrotated camera (Blender (1, 1, 0)). */
const RIGHT = fromBlender(1, 1, 0).normalize();
/** The look-dev frame is 1600 x 1216; a station's "scale" is the width of that frame in metres. */
const FRAME_ASPECT = 1216 / 1600;
/** Largest turn of the room toward the cursor, in radians (about 6 degrees). Smaller at close-ups. */
const MAX_YAW = (6 * Math.PI) / 180;

/** The diorama's bounds (slab, walls, contents): the cursor spotlight only shows outside it. */
const ROOM_BOX = new Box3().setFromPoints([fromBlender(-0.16, 0, -0.24), fromBlender(4.4, 4.56, 3.0)]);
/** Top of the ground under the diorama (Blender z = -0.24). */
const GROUND_Y = -0.24;
const GROUND_PLANE = new Plane(new Vector3(0, 1, 0), -GROUND_Y);
/** The baked ground covers Blender x, y in [2.2 - 9, 2.2 + 9]; beyond it the floor is plain background. */
const GROUND_BAKE = { min: -6.8, size: 18 };

/** Phones (portrait): the overview frames the room tighter so it isn't lost in the tall viewport, while station
 *  close-ups open wider so the subject isn't cropped above the bottom sheet. Continuous in `scale`, so a camera
 *  glide never jumps. */
function portraitZoom(scale: number): number {
  const t = Math.min(1, Math.max(0, (scale - 1.8) / (OVERVIEW.scale - 1.8)));
  return 1.4 + (0.78 - 1.4) * t;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StudioCallbacks {
  /** Each station's screen rectangle (canvas pixels), for the keyboard buttons and label chips over them. */
  onAnchors?: (rects: Partial<Record<StationId, Rect>>) => void;
  /** The mouse moved onto or off a station. */
  onHover?: (id: StationId | null) => void;
  /** A station was clicked or tapped. */
  onSelect?: (id: StationId) => void;
  onFps?: (fps: number) => void;
  /** The character shoos the cursor: show a speech bubble at its head. */
  onSay?: (event: SayEvent) => void;
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** Draws an image into a canvas with object-fit: cover, anchored to the top (pages read from the top). */
function coverDraw(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, alpha = 1) {
  const { width: cw, height: ch } = ctx.canvas;
  const scale = Math.max(cw / img.width, ch / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (cw - w) / 2, 0, w, h);
  ctx.globalAlpha = 1;
}

/* Ground: an effectively endless floor. The baked shadow is mapped by world position and fades into the page
   background; the cursor spotlight (a cool glow) reveals a faint grid lying on the floor. */
const groundVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const groundFragment = /* glsl */ `
  uniform sampler2D map;
  uniform vec2 bakeMin;   // world x and Blender y of the bake's corner
  uniform float bakeSize;
  uniform vec3 bg;
  uniform vec3 spot;      // world xz of the cursor on the ground, z = strength 0..1
  uniform float radius;
  uniform vec3 glowColor;
  uniform vec3 lineColor;
  varying vec3 vWorld;

  float gridLine(vec2 p, float cell, float width) {
    vec2 g = abs(fract(p / cell - 0.5) - 0.5) * cell;
    vec2 w = fwidth(p) * width;
    vec2 l = 1.0 - smoothstep(vec2(0.0), w, g);
    return max(l.x, l.y);
  }

  void main() {
    // Blender plane UVs: u along +x, v along +y (= -z here), flipped for glTF.
    vec2 uv = vec2((vWorld.x - bakeMin.x) / bakeSize, 1.0 - (-vWorld.z - bakeMin.y) / bakeSize);
    vec3 base = texture2D(map, clamp(uv, 0.0, 1.0)).rgb;
    float edge = smoothstep(0.5, 0.18, length(uv - 0.5));
    vec3 color = mix(bg, base, edge);

    float d = distance(vWorld.xz, spot.xy);
    float glow = exp(-pow(d / radius, 2.0) * 2.2) * spot.z;
    color += glowColor * glow;
    float grid = gridLine(vWorld.xz, 0.5, 1.1);
    color = mix(color, lineColor, grid * glow * 0.55);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/* Station highlight: the object is drawn white into a mask, and a full-screen pass paints an accent line
   just outside the mask's edge. A clean silhouette for any shape (an inflated back-face hull broke apart). */
const outlineFragment = /* glsl */ `
  uniform sampler2D mask;
  uniform vec2 texel;
  uniform vec3 color;
  uniform float width;
  uniform float strength;
  varying vec2 vUv;
  void main() {
    float inside = texture2D(mask, vUv).r;
    float near = 0.0;
    for (int i = 0; i < 16; i++) {
      float a = float(i) * 0.39270;
      vec2 dir = vec2(cos(a), sin(a)) * texel;
      near = max(near, texture2D(mask, vUv + dir * width).r);
      near = max(near, texture2D(mask, vUv + dir * width * 0.5).r);
    }
    gl_FragColor = vec4(color, clamp(near - inside, 0.0, 1.0) * strength);
    #include <colorspace_fragment>
  }
`;

export class StudioScene {
  readonly ready: Promise<void>;
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  private raycaster = new Raycaster();
  private pointer = new Vector2(0, 0);
  private pointerInside = false;
  private stationMeshes = new Map<StationId, Mesh[]>();
  private stationBoxes = new Map<StationId, Box3>();
  private hitTargets: Mesh[] = [];
  private hovered: StationId | null = null;
  private highlighted: StationId | null = null;
  private hinted: StationId[] = [];
  private mask = new WebGLRenderTarget(1, 1);
  private maskMaterial = new MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  private overlayScene = new Scene();
  private overlayCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private overlay: ShaderMaterial;
  private spot = new Vector3(0, 0, 0); // x, z, strength
  private spotTarget = new Vector3(0, 0, 0);
  private yaw = 0;
  private screenCanvas = document.createElement('canvas');
  private screenTexture: CanvasTexture;
  private screenImages: HTMLImageElement[] = [];
  private screenIndex = 0;
  private screenFade = 1;
  private view: { target: Vector3; scale: number };
  private tween: { from: { target: Vector3; scale: number }; to: { target: Vector3; scale: number }; t0: number; ms: number } | null = null;
  private panelShift = 0; // fraction of the frame the subject moves to leave room for the content panel
  private frames = 0;
  private fpsT0 = performance.now();
  private disposed = false;
  private pinned: Vector3 | null = null;
  private pinnedTilt: number | null = null;
  private lastAnchors = '';
  private resizeObserver: ResizeObserver;
  private character: StudioCharacter;
  private lastFrame = 0;
  private pinnedCursor: { x: number; y: number } | null = null;

  constructor(
    private host: HTMLElement,
    private options: { reducedMotion: boolean; screens: string[]; arcade?: string | undefined; callbacks: StudioCallbacks },
  ) {
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    // Only the live-lit character is tone-mapped (AgX, like Blender); baked materials opt out.
    this.renderer.toneMapping = AgXToneMapping;
    this.character = new StudioCharacter(options.reducedMotion, (event) => options.callbacks.onSay?.(event));
    const bg = new Color(cssColor('--bg', '#0f0e0d'));
    this.renderer.setClearColor(bg);
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');

    this.view = { target: fromBlender(...OVERVIEW.target), scale: OVERVIEW.scale };

    this.screenCanvas.width = 1024;
    this.screenCanvas.height = 585; // the panel is 0.70 x 0.40 m
    this.screenTexture = new CanvasTexture(this.screenCanvas);
    this.screenTexture.colorSpace = SRGBColorSpace;
    this.screenTexture.flipY = false;

    this.overlay = new ShaderMaterial({
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: outlineFragment,
      uniforms: {
        mask: { value: this.mask.texture },
        texel: { value: new Vector2(1, 1) },
        color: { value: new Color(cssColor('--accent', '#f99e35')) },
        width: { value: 3 * Math.min(window.devicePixelRatio, 2) },
        strength: { value: 1 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.overlayScene.add(new Mesh(new PlaneGeometry(2, 2), this.overlay));

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();

    // The whole page counts (the DOM buttons and panel sit over the canvas).
    window.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerleave', this.onPointerLeave);
    this.renderer.domElement.addEventListener('click', this.onClick);

    this.ready = this.load(bg);
    this.renderer.setAnimationLoop(this.frame);
  }

  private async load(bg: Color) {
    const textures = new TextureLoader();
    const characterReady = this.character.load(this.scene);
    const [gltf, bake, groundTex, arcade, ...images] = await Promise.all([
      new GLTFLoader().loadAsync(glbUrl),
      // Phones get the half-resolution atlas (0.4 MB instead of 1.3 MB; docs/STUDIO-DIRECTION.md §10).
      textures.loadAsync(window.matchMedia('(max-width: 719px)').matches ? bakePhoneUrl : bakeUrl),
      textures.loadAsync(groundUrl),
      this.options.arcade ? loadImage(this.options.arcade) : Promise.resolve(null),
      ...this.options.screens.map((src) => loadImage(src)),
    ]);
    await characterReady;
    if (this.disposed) return;
    for (const t of [bake, groundTex]) {
      t.colorSpace = SRGBColorSpace;
      t.flipY = false; // glTF UV convention
      t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      t.minFilter = LinearMipmapLinearFilter;
    }
    const baked = new MeshBasicMaterial({ map: bake, toneMapped: false });

    gltf.scene.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      switch (node.name) {
        case 'static':
        case 'monitor':
          node.material = baked;
          break;
        case 'mon_screen':
          flattenToFront(node);
          node.material = new MeshBasicMaterial({ map: this.screenTexture, toneMapped: false, color: new Color(0.86, 0.86, 0.86) });
          break;
        case 'arc_screen':
          flattenToFront(node);
          node.material = arcade
            ? new MeshBasicMaterial({ map: coverTexture(arcade, 512, 400), toneMapped: false, color: new Color(0.8, 0.8, 0.8) })
            : new MeshBasicMaterial({ color: new Color(0.02, 0.02, 0.05), toneMapped: false });
          break;
        case 'ground':
          node.visible = false; // replaced by the endless floor below
          break;
        default:
          if (node.name.startsWith('st_')) node.material = baked;
      }
    });
    this.scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
    for (const station of STATIONS) {
      const meshes = station.meshes.map((name) => gltf.scene.getObjectByName(name)).filter((o): o is Mesh => o instanceof Mesh);
      this.stationMeshes.set(station.id, meshes);
      this.hitTargets.push(...meshes);
      const box = new Box3();
      for (const m of meshes) box.expandByObject(m);
      this.stationBoxes.set(station.id, box);
    }

    const floor = new Mesh(
      new PlaneGeometry(400, 400).rotateX(-Math.PI / 2).translate(0, GROUND_Y - 0.001, 0),
      new ShaderMaterial({
        vertexShader: groundVertex,
        fragmentShader: groundFragment,
        uniforms: {
          map: { value: groundTex },
          bakeMin: { value: new Vector2(GROUND_BAKE.min, GROUND_BAKE.min) },
          bakeSize: { value: GROUND_BAKE.size },
          bg: { value: bg },
          spot: { value: this.spot },
          radius: { value: 1.6 },
          glowColor: { value: new Color('#5a6a9a').multiplyScalar(0.07) },
          lineColor: { value: new Color('#7f8aa6').multiplyScalar(0.5) },
        },
      }),
    );
    floor.renderOrder = -1;
    this.scene.add(floor);

    this.screenImages = images;
    this.drawScreen();
  }

  /* ---------- public API ---------- */

  goTo(view: StationView, panelShift: number) {
    const to = { target: fromBlender(...view.target), scale: view.scale };
    this.panelShift = panelShift;
    if (this.options.reducedMotion) {
      this.view = to; // a cut, not a glide
      this.tween = null;
      return;
    }
    this.tween = { from: { target: this.view.target.clone(), scale: this.view.scale }, to, t0: performance.now(), ms: 1100 };
  }

  /** Accent outline on one station (mouse hover or keyboard focus), or none. */
  setHighlighted(id: StationId | null) {
    this.highlighted = id;
  }

  /** Touch screens have no hover: a softer outline on these stations shows what can be tapped. */
  setHinted(ids: readonly StationId[]) {
    this.hinted = [...ids];
  }

  /** Bench screenshots only (headless browsers cannot hover): hold the ground spotlight at a Blender (x, y). */
  pinSpot(x: number, y: number) {
    const p = fromBlender(x, y, GROUND_Y);
    this.pinned = new Vector3(p.x, p.z, 1);
  }

  /** Bench screenshots only: hold the room turned as if the mouse were at this horizontal position (-1..1). */
  pinTilt(x: number) {
    this.pinnedTilt = x;
  }

  /** Bench screenshots only: a virtual cursor at canvas pixels, so the character's reactions can be captured. */
  pinCursor(x: number, y: number) {
    this.pinnedCursor = { x, y };
  }

  /** Bench screenshots only: freeze the character in one clip at a time (seconds). */
  freezeClip(clip: (typeof CLIPS)[number], time: number) {
    this.character.freeze(clip, time);
  }

  nextScreen() {
    if (this.screenImages.length < 2) return;
    this.screenIndex = (this.screenIndex + 1) % this.screenImages.length;
    this.screenFade = this.options.reducedMotion ? 1 : 0;
    this.drawScreen();
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.character.dispose();
    this.resizeObserver.disconnect();
    window.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerleave', this.onPointerLeave);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.mask.dispose();
    this.overlay.dispose();
    this.maskMaterial.dispose();
    this.scene.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      node.geometry.dispose();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const m of materials) {
        for (const value of Object.values(m)) if (value instanceof Texture) value.dispose();
        if (m instanceof ShaderMaterial) (m.uniforms.map?.value as Texture | undefined)?.dispose();
        m.dispose();
      }
    });
    this.screenTexture.dispose();
    this.renderer.dispose();
    // Free the WebGL context now, not at garbage collection: browsers keep only ~16 alive, and visitors can
    // switch between the editorial site and the studio many times in one session.
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  /* ---------- internals ---------- */

  private drawScreen() {
    const ctx = this.screenCanvas.getContext('2d');
    const img = this.screenImages[this.screenIndex];
    if (!ctx || !img) return;
    if (this.screenFade >= 1) {
      ctx.fillStyle = '#0b0b0c';
      ctx.fillRect(0, 0, this.screenCanvas.width, this.screenCanvas.height);
    }
    coverDraw(ctx, img, this.screenFade >= 1 ? 1 : 0.18); // repeated low-alpha draws = a crossfade
    this.screenTexture.needsUpdate = true;
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.host;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    const buffer = this.renderer.getDrawingBufferSize(new Vector2());
    this.mask.setSize(buffer.x, buffer.y);
    (this.overlay.uniforms.texel!.value as Vector2).set(1 / buffer.x, 1 / buffer.y);
    this.applyCamera();
  }

  private applyCamera() {
    const { clientWidth: w, clientHeight: h } = this.host;
    const aspect = w / h;
    const portrait = aspect < 1;
    const frameW = this.view.scale * (portrait ? portraitZoom(this.view.scale) : 1);
    const frameH = frameW * FRAME_ASPECT;
    // Fit the look-dev frame inside the viewport (contain).
    const halfW = (aspect > frameW / frameH ? frameH * aspect : frameW) / 2;
    const halfH = halfW / aspect;
    Object.assign(this.camera, { left: -halfW, right: halfW, top: halfH, bottom: -halfH });
    this.camera.updateProjectionMatrix();

    // The camera orbits opposite to the yaw, so the room appears to turn toward the cursor.
    const dir = VIEW_DIR.clone().applyAxisAngle(WORLD_UP, -this.yaw);
    const right = RIGHT.clone().applyAxisAngle(WORLD_UP, -this.yaw);
    const up = dir.clone().cross(right).normalize();
    // Move the subject out from under the content panel: left of a side panel, above a phone bottom sheet.
    const target = portrait
      ? this.view.target.clone().addScaledVector(up, -halfH * 2 * this.panelShift)
      : this.view.target.clone().addScaledVector(right, halfW * 2 * this.panelShift);
    this.camera.position.copy(target).addScaledVector(dir, 20);
    this.camera.lookAt(target);
  }

  private onPointerMove = (event: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.pointerInside = event.pointerType === 'mouse';
  };

  private onPointerLeave = () => {
    this.pointerInside = false;
  };

  /** Mouse click or touch tap on the canvas: open the station under it. */
  private onClick = (event: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    const id = this.stationAt(ndc);
    if (id) this.options.callbacks.onSelect?.(id);
  };

  private stationAt(ndc: Vector2): StationId | null {
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObjects(this.hitTargets, false)[0];
    if (!hit) return null;
    for (const [id, meshes] of this.stationMeshes) if (meshes.includes(hit.object as Mesh)) return id;
    return null;
  }

  private frame = (now: number) => {
    if (this.tween) {
      const t = Math.min(1, (now - this.tween.t0) / this.tween.ms);
      const k = easeOutExpo(t);
      this.view = {
        target: this.tween.from.target.clone().lerp(this.tween.to.target, k),
        scale: this.tween.from.scale + (this.tween.to.scale - this.tween.from.scale) * k,
      };
      if (t >= 1) this.tween = null;
    }

    // Turn toward the cursor's side (mouse only; none under reduced motion). Gentler at close-ups.
    const closeness = Math.min(1, this.view.scale / OVERVIEW.scale);
    const tilt = this.pinnedTilt ?? (this.pointerInside ? this.pointer.x : 0);
    const yawTarget = this.options.reducedMotion ? 0 : tilt * MAX_YAW * (0.35 + 0.65 * closeness);
    this.yaw += (yawTarget - this.yaw) * 0.06;
    this.applyCamera();

    // Ground spotlight: only over the floor outside the room (bounding-box test, never the room mesh).
    let groundHit: Vector3 | null = null;
    if (this.pointerInside) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (!this.raycaster.ray.intersectsBox(ROOM_BOX)) groundHit = this.raycaster.ray.intersectPlane(GROUND_PLANE, new Vector3());
    }
    if (this.pinned) this.spotTarget.copy(this.pinned);
    else if (groundHit) this.spotTarget.set(groundHit.x, groundHit.z, 1);
    else this.spotTarget.z = 0;
    if (this.spotTarget.z > 0 && this.spot.z < 0.01) this.spot.set(this.spotTarget.x, this.spotTarget.y, this.spot.z);
    this.spot.lerp(this.spotTarget, this.options.reducedMotion ? 1 : 0.14);

    const hover = this.pointerInside ? this.stationAt(this.pointer) : null;
    if (hover !== this.hovered) {
      this.hovered = hover;
      this.renderer.domElement.style.cursor = hover ? 'pointer' : '';
      this.options.callbacks.onHover?.(hover);
    }

    const dt = this.lastFrame ? Math.min(0.1, (now - this.lastFrame) / 1000) : 0;
    this.lastFrame = now;
    const { clientWidth: w, clientHeight: h } = this.host;
    const cursor = this.pinnedCursor ?? (this.pointerInside ? { x: ((this.pointer.x + 1) / 2) * w, y: ((1 - this.pointer.y) / 2) * h } : null);
    this.character.update(dt, now, cursor, this.camera, { w, h });

    if (this.screenFade < 1) {
      this.screenFade = Math.min(1, this.screenFade + 0.08);
      this.drawScreen();
    }

    this.renderer.render(this.scene, this.camera);
    this.renderOutlines();
    this.reportAnchors();

    this.frames++;
    if (now - this.fpsT0 >= 1000) {
      this.options.callbacks.onFps?.(Math.round((this.frames * 1000) / (now - this.fpsT0)));
      this.frames = 0;
      this.fpsT0 = now;
    }
  };

  private renderOutlines() {
    const hinted = this.hinted.filter((id) => id !== this.highlighted).flatMap((id) => this.stationMeshes.get(id) ?? []);
    this.renderOutline(hinted, 0.6);
    this.renderOutline(this.highlighted ? this.stationMeshes.get(this.highlighted) ?? [] : [], 1);
  }

  private renderOutline(meshes: Mesh[], strength: number) {
    if (meshes.length === 0) return;
    this.overlay.uniforms.strength!.value = strength;
    const r = this.renderer;
    const clear = r.getClearColor(new Color());
    for (const m of meshes) m.layers.enable(1);
    this.camera.layers.set(1);
    this.scene.overrideMaterial = this.maskMaterial;
    r.setClearColor(0x000000, 1);
    r.setRenderTarget(this.mask);
    r.clear();
    r.render(this.scene, this.camera);
    r.setRenderTarget(null);
    r.setClearColor(clear, 1);
    this.scene.overrideMaterial = null;
    this.camera.layers.set(0);
    for (const m of meshes) m.layers.disable(1);
    r.autoClear = false;
    r.render(this.overlayScene, this.overlayCamera);
    r.autoClear = true;
  }

  /** Screen rectangles of the stations, for the keyboard buttons and label chips over them. */
  private reportAnchors() {
    const { clientWidth: w, clientHeight: h } = this.host;
    const rects: Partial<Record<StationId, Rect>> = {};
    const p = new Vector3();
    for (const [id, box] of this.stationBoxes) {
      if (box.isEmpty()) continue;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const x of [box.min.x, box.max.x]) {
        for (const y of [box.min.y, box.max.y]) {
          for (const z of [box.min.z, box.max.z]) {
            p.set(x, y, z).project(this.camera);
            const sx = ((p.x + 1) / 2) * w;
            const sy = ((1 - p.y) / 2) * h;
            minX = Math.min(minX, sx);
            maxX = Math.max(maxX, sx);
            minY = Math.min(minY, sy);
            maxY = Math.max(maxY, sy);
          }
        }
      }
      rects[id] = { x: Math.round(minX), y: Math.round(minY), w: Math.round(maxX - minX), h: Math.round(maxY - minY) };
    }
    const key = JSON.stringify(rects);
    if (key === this.lastAnchors) return;
    this.lastAnchors = key;
    this.options.callbacks.onAnchors?.(rects);
  }
}

function cssColor(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** The thinnest axis of a mesh's local bounding box (a screen's normal) and the other two. */
function screenAxes(geometry: BufferGeometry) {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const [n, a, b] = (['x', 'y', 'z'] as const).slice().sort((p, q) => size[p] - size[q]) as [Axis, Axis, Axis];
  return { size, center, n, a, b };
}
type Axis = 'x' | 'y' | 'z';

/**
 * Screens are exported as thin boxes; seen from above, their 4-6 mm top edge showed a sliver of the image.
 * Squash the box onto its centre plane so only the image face remains (it still sits in front of the bezel).
 */
function flattenToFront(mesh: Mesh) {
  const { center, n } = screenAxes(mesh.geometry);
  const position = mesh.geometry.getAttribute('position');
  const i = { x: 0, y: 1, z: 2 }[n];
  for (let v = 0; v < position.count; v++) position.setComponent(v, i, center[n]);
  position.needsUpdate = true;
  mesh.geometry.computeBoundingBox();
}

/** A cover-fitted copy of an image as a texture for the glTF screens (UVs use the glTF convention: no flip). */
function coverTexture(img: HTMLImageElement, width: number, height: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false; // pixel art stays crisp
    coverDraw(ctx, img);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false;
  return texture;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}
