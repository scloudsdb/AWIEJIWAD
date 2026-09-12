import type { BuildParams, BuildRegion, ClickerPart, Ring } from '../types';

type Wasm = any;
type Solid = any;
type Section = any;

function withScope<T>(fn: (keep: <M extends { delete(): void }>(m: M) => M) => T): T {
  const created: { delete(): void }[] = [];
  const keep = <M extends { delete(): void }>(m: M) => {
    created.push(m);
    return m;
  };
  try {
    return fn(keep);
  } finally {
    for (const m of created) {
      try {
        m.delete();
      } catch (e) {
        console.warn('Error deleting manifold object:', e);
      }
    }
  }
}

export const MIN_FEATURE_MM = 1.0;

function getMeshData(solid: any): { vertProperties: Float32Array; triVerts: Uint32Array } {
  const m = solid.getMesh();
  return { vertProperties: m.vertProperties, triVerts: m.triVerts };
}

function getRingArea(ring: Ring): number {
  if (ring.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(area / 2);
}

function placeRings(rings: Ring[]): Ring[] {
  return rings.map(r => r.map(([x, y]) => [x, -y] as [number, number]));
}

export function buildLogoKeychain(
  wasm: Wasm,
  regions: BuildRegion[],
  outline: Ring[],
  params: BuildParams,
): { parts: ClickerPart[]; warnings: string[] } {
  const { Manifold, CrossSection } = wasm;
  const warnings: string[] = [];

  const parts = withScope((keep) => {
    const finalParts: ClickerPart[] = [];
    const simp = (cs: Section, tol: number) => keep(cs.simplify(tol));
    const grow = (cs: Section, r: number) => keep(cs.offset(r, 'Round', 2.0, 32));

    const placedOutline = placeRings(outline);
    const outlineCS = keep(new CrossSection(placedOutline, 'NonZero'));
    const bounds = outlineCS.bounds();
    const w = bounds.max[0] - bounds.min[0];
    const h = bounds.max[1] - bounds.min[1];
    if (w <= 0 || h <= 0) {
      warnings.push('Image contains no valid geometry.');
      return [];
    }
    
    const targetW = params.capWidthMm;
    const scale = targetW / w;
    const cx = (bounds.max[0] + bounds.min[0]) / 2;
    const cy = (bounds.max[1] + bounds.min[1]) / 2;
    
    const transformCS = (cs: Section) => {
      let moved = keep(cs.translate([-cx, -cy]));
      return keep(moved.scale([scale, scale]));
    };

    let artworkCS = transformCS(outlineCS);
    
    let baseCS: Section;
    if (params.baseShape === 'circle') {
      baseCS = keep(CrossSection.circle(targetW / 2 + params.imageMargin, 64));
    } else if (params.baseShape === 'square' || params.baseShape === 'rect') {
      const margin = params.imageMargin;
      baseCS = keep(CrossSection.square([targetW + margin * 2, (h * scale) + margin * 2], true));
      baseCS = keep(baseCS.offset(-3.0, 'Round', 0, 32).offset(3.0, 'Round', 0, 32));
    } else {
      baseCS = grow(artworkCS, params.imageMargin);
    }

    const lugOuter = params.holeDia / 2 + params.ringThickness;
    const lugPre = Math.max(lugOuter - params.imageMargin, 0.6);
    const corner = params.ringStyle === 'corner';
    
    const bds = baseCS.bounds();
    let lugCx, lugCy, defaultAngle;
    
    if (corner) {
      lugCx = bds.max[0] + lugOuter * 0.15;
      lugCy = bds.max[1] + lugOuter * 0.15;
      defaultAngle = 45;
    } else {
      lugCx = lugOuter;
      lugCy = (bds.min[1] + bds.max[1]) / 2;
      defaultAngle = params.ringPosY > 4 ? 90 : 180;
    }
    
    const holeX = lugCx + params.ringPosX;
    const holeY = lugCy + params.ringPosY;
    const angle = params.ringAngle ?? defaultAngle;
    const rad = (angle * Math.PI) / 180;
    const neckLen = Math.max(lugOuter * 2.2, 10.0);
    const anchorX = holeX - neckLen * Math.cos(rad);
    const anchorY = holeY - neckLen * Math.sin(rad);

    const lugDisc = keep(CrossSection.circle(lugPre, 32).translate([holeX, holeY]));
    const anchorR = Math.min(lugPre * 0.85, 2.0);
    const anchorDisc = keep(CrossSection.circle(anchorR, 16).translate([anchorX, anchorY]));
    let tabCS = keep(CrossSection.hull([lugDisc, anchorDisc]));
    
    baseCS = keep(baseCS.add(tabCS));
    baseCS = keep(baseCS.offset(2.0, 'Round', 0, 32).offset(-2.0, 'Round', 0, 32));
    
    const trueOuter = keep(CrossSection.circle(lugOuter, 40).translate([holeX, holeY]));
    baseCS = keep(baseCS.add(trueOuter));

    let baseSol = keep(baseCS.extrude(params.topThickness));
    
    const holeCyl = keep(Manifold.cylinder(params.topThickness + 2, params.holeDia / 2, params.holeDia / 2, 32).translate([holeX, holeY, -1]));
    baseSol = keep(baseSol.subtract(holeCyl));

    const ordered = regions
      .map((r) => ({ r }))
      .sort((a, b) => (a.r.coverage ?? 1) - (b.r.coverage ?? 1));
      
    let allLogos: Solid = null;
    let index = 0;
    
    const zBase = params.topThickness;

    for (const { r } of ordered) {
      const validRings = placeRings(r.rings).filter(ring => ring.length >= 3 && getRingArea(ring) > 0.001);
      if (validRings.length === 0) continue;
      
      let cs: Section = simp(keep(new CrossSection(validRings, 'NonZero')), 0.03);
      if (params.colorBleed && params.colorBleed > 0.001) {
          cs = grow(cs, params.colorBleed);
      }
      cs = transformCS(cs);
      
      if (params.flushLogo) {
        let placed = keep(cs.extrude(params.imageDepth).translate([0, 0, zBase - params.imageDepth]));
        allLogos = allLogos ? keep(allLogos.add(placed)) : placed;
        finalParts.push({
          name: `logo-color-${index}`,
          ...getMeshData(placed),
          colorRgb: r.filamentRgb || [255, 255, 255],
          kind: 'cap',
          group: 'top',
          numProp: 3,
        });
      } else {
        let placed = keep(cs.extrude(params.imageDepth).translate([0, 0, zBase - 0.1]));
        allLogos = allLogos ? keep(allLogos.add(placed)) : placed;
        finalParts.push({
          name: `logo-color-${index}`,
          ...getMeshData(placed),
          colorRgb: r.filamentRgb || [255, 255, 255],
          kind: 'cap',
          group: 'top',
          numProp: 3,
        });
      }
      index++;
    }

    if (allLogos && params.flushLogo) {
      baseSol = keep(baseSol.subtract(allLogos));
    } else if (allLogos && !params.flushLogo) {
      let cutter = keep(allLogos.translate([0, 0, -params.imageDepth + 0.1]));
      baseSol = keep(baseSol.subtract(cutter));
    }

    finalParts.push({
      name: 'base-plate',
      ...getMeshData(baseSol),
      colorRgb: params.baseColorRgb ?? [220, 220, 220],
      kind: 'body',
      group: 'base',
      numProp: 3,
    });

    return finalParts;
  });

  return { parts, warnings };
}
