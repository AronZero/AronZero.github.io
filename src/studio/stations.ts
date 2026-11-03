/*
 * The six stations of the After Hours Studio (docs/STUDIO-DIRECTION.md §3). Each is a baked mesh in studio.glb
 * (art/blender/studio.py splits them out) with a close-up camera: a pan + zoom of the same orthographic view.
 */

export interface StationView {
  /** Point to look at, Blender coordinates (Z up). */
  target: [number, number, number];
  /** Width of the look-dev frame in metres (Blender's ortho_scale). */
  scale: number;
}

export const STATION_IDS = ['01', '02', '03', '04', '05', '06'] as const;
export type StationId = (typeof STATION_IDS)[number];

export interface Station {
  id: StationId;
  label: string;
  /** What the object is, for the keyboard button's accessible name. */
  object: string;
  /** Baked mesh names in studio.glb that belong to this station (hit tests and the outline). */
  meshes: readonly string[];
  view: StationView;
}

export const OVERVIEW: StationView = { target: [2.0, 2.3, 0.95], scale: 8.4 };

export const STATIONS: readonly Station[] = [
  { id: '01', label: 'Featured work', object: 'the monitor', meshes: ['monitor', 'mon_screen'], view: { target: [0.6, 3.6, 1.05], scale: 1.8 } },
  { id: '02', label: 'All projects', object: 'the project wall', meshes: ['st_projects'], view: { target: [3.45, 4.3, 1.6], scale: 2.0 } },
  { id: '03', label: 'Games', object: 'the arcade cabinet', meshes: ['st_arcade', 'arc_screen'], view: { target: [0.42, 0.95, 1.25], scale: 1.6 } },
  { id: '04', label: 'About', object: 'the pinboard', meshes: ['st_pinboard'], view: { target: [0.1, 2.5, 1.55], scale: 1.6 } },
  { id: '05', label: 'Skills & tools', object: 'the bookshelf', meshes: ['st_shelf'], view: { target: [1.25, 4.25, 1.8], scale: 1.9 } },
  { id: '06', label: 'Contact', object: 'the desk phone', meshes: ['st_phone'], view: { target: [3.25, 1.75, 0.5], scale: 1.2 } },
];

export const stationById = (id: StationId): Station => STATIONS.find((s) => s.id === id) ?? STATIONS[0]!;
