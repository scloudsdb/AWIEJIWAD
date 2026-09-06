import { PLATE_MESHES, type PlateMesh } from './meshes.generated';

/** Plates we ship meshes for. */
export type PlateId = 'a1' | 'a1mini' | 'h2d' | 'kobra1max' | 'kobra1plus' | 'kobra1' | 'kobra2max' | 'kobra2neo' | 'kobra2plus' | 'kobra2pro' | 'kobra2' | 'kobra3max' | 'kobra3v2' | 'kobra3' | 'kobra4' | 's1max' | 's1' | 'kobrax';
/** What the preview is standing the model on. `grid` is the plain reference grid. */
export type PlateChoice = PlateId | 'grid';

export interface PlateDef {
  id: PlateId;
  /** What the picker calls it — also what the closed button shows. */
  name: string;
  /** Size and the printers it belongs to, for the picker's second line. */
  details: string;
  /** Plate body size in mm (measured off the mesh, tab excluded). */
  size: [number, number];
  mesh: PlateMesh;
}

function def(id: PlateId, name: string, printers: string): PlateDef {
  const mesh = PLATE_MESHES[id];
  if (!mesh) throw new Error(`no mesh generated for plate "${id}" . Run pnpm --filter @AI3DLabs/plates build-meshes`);
  const size: [number, number] = [mesh.width, mesh.depth];
  const dims = `${Math.round(size[0])} × ${Math.round(size[1])} mm`;
  return { id, name, details: printers ? `${dims} · ${printers}` : dims, size, mesh };
}

export const PLATES: PlateDef[] = [
  
  // Anycubic Kobra 1 Series
  def('kobra1', 'Plate: Anycubic Kobra 1', 'Kobra 1'),
  def('kobra1plus', 'Plate: Anycubic Kobra 1 Plus', 'Kobra 1 Plus'),
  def('kobra1max', 'Plate: Anycubic Kobra 1 Max', 'Kobra 1 Max'),

  // Anycubic Kobra 2 Series (226 x 226 mm)
  def('kobra2', 'Plate: Anycubic Kobra 2 Series', 'Kobra 2, Neo, Pro'),
  def('kobra2plus', 'Plate: Anycubic Kobra 2 Plus', 'Kobra 2 Plus'),

  // Anycubic Max Series (440 x 440 mm)
  def('kobra2max', 'Plate: Anycubic Kobra 2/3 Max', 'Kobra 2 Max, Kobra 3 Max'),

  // Anycubic Kobra 3 Series (255 x 257 mm)
  def('kobra3', 'Plate: Anycubic Kobra 3 Series', 'Kobra 3, Kobra 3 V2'),

  // Anycubic Kobra 4 / S1 / X (264 x 265 mm)
  def('kobra4', 'Plate: Kobra 4 / S1 / X', 'Kobra 4, S1, Kobra X'),
  
  // Anycubic S1 Max (360 x 360 mm)
  def('s1max', 'Plate: Anycubic S1 Max', 'S1 Max'),
  // Bambu Lab Series
  def('a1', 'Plate: Bambu Lab A1, P/X series', 'A1, P1 Series, X1 Series, X2D, P2S'),
  def('a1mini', 'Plate: Bambu Lab A1 mini', ''),
  def('h2d', 'Plate: Bambu Lab H series', 'H2D, H2C'),

];

/** The Kobra 4 / S1 / X plate as default. */
export const DEFAULT_PLATE: PlateChoice = 'kobra4';

export function getPlate(id: string | null | undefined): PlateDef | null {
  return PLATES.find((p) => p.id === id) ?? null;
}

/** Narrows an arbitrary string (a stored preference, a URL param) to a choice. */
export function toPlateChoice(value: string | null | undefined): PlateChoice | null {
  if (value === 'grid') return 'grid';
  return getPlate(value)?.id ?? null;
}

/** What the closed picker button reads, e.g. `Plate: A1, P/X series`. */
export function plateLabel(choice: PlateChoice): string {
  return getPlate(choice)?.name ?? 'No plate';
}

// ---------------------------------------------------------------------------
// Preference, shared by every generator on the origin.
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'vl.buildPlate';

export function loadPlateChoice(): PlateChoice {
  try {
    return toPlateChoice(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_PLATE;
  } catch {
    return DEFAULT_PLATE;
  }
}

export function savePlateChoice(choice: PlateChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* private mode / storage disabled — the pick just doesn't stick */
  }
}
