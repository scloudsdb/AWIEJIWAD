// @ts-nocheck
import type { BuildParams, BuildRegion, ClickerPart, Ring, SwitchPlacement } from '../types';

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
      try { m.delete(); } catch {}
    }
  }
}

export const MIN_FEATURE_MM = 1.0;

function getMeshData(solid: any): { vertProperties: Float32Array; triVerts: Uint32Array } {
  const m = solid.getMesh();
  return { vertProperties: m.vertProperties, triVerts: m.triVerts };
}

export function buildCardHolder(
  wasm: any,
  socket: any,
  stem: any,
  regions: BuildRegion[],
  outline: Ring[],
  params: BuildParams,
): { parts: ClickerPart[]; switchPlacements: SwitchPlacement[]; warnings: string[] } {
  const { Manifold, CrossSection } = wasm;
  const warnings: string[] = [];

  const parts = withScope((keep) => {
    const finalParts: ClickerPart[] = [];

    // ─── Card dimensions ───────────────────────────────────────────────────────
    // Flazz / e-money card: ISO/IEC 7810 ID-1 = 85.60 × 53.98 × 0.76 mm.
    const cardW  = 54.5;   // X axis
    const cardH  = 86.5;   // Y axis
    const cardT  = 1.0;    // thickness clearance

    // ─── Case shell ────────────────────────────────────────────────────────────
    const wallT  = 2.0;    // side-wall thickness
    const floorT = 1.5;    // back-plate thickness
    const logoScale = params.designScale ?? 1.0;
    const lidT = params.topThickness ?? 2.5; 
    const embossH = params.imageDepth ?? 0.8;
    // Snap fit gap can be tied to tolerance
    // const snapGap = params.tolerance ?? 0.0;    // front-plate thickness (logo side)
    const outerW = cardW + wallT * 2;
    const outerH = cardH + wallT * 2;
    
    // We assemble the case vertically.
    // Z = 0 is the parting line where the lid sits flush with the walls.
    // Use offset to create a case with beautifully rounded outer corners (Radius = 3.5mm)
    let backShellCS = keep(CrossSection.square([outerW, outerH], true)
        .offset(-3.5, 'Round', 0, 32)
        .offset(3.5, 'Round', 0, 32));

    // ─── KEYCHAIN HOLE (Optional) ─────────────────────────────────────────────
    // User wants it optional and positionable like in clicker generator.
    const keychain = params.keychain;
    let keyHoleCX = 0;
    let keyHoleCY = 0;
    let keyHoleD = 0;
    let hasKeychain = false;

    if (keychain && keychain.enabled) {
      hasKeychain = true;
      keyHoleD = keychain.holeDiameterMm || 5.6;
      const angle = (keychain.angleDeg || 90) * Math.PI / 180;
      const loopR = (keyHoleD / 2) + 2.5; // +2.5mm meat around the hole for durability
      const ringOffset = keychain.offsetMm || 0;
      
      const absCos = Math.abs(Math.cos(angle));
      const absSin = Math.abs(Math.sin(angle));
      let rEdge = 0;
      
      if (absCos < 0.0001) rEdge = outerH / 2;
      else if (absSin < 0.0001) rEdge = outerW / 2;
      else {
        if ((outerW / 2) * absSin < (outerH / 2) * absCos) rEdge = (outerW / 2) / absCos;
        else rEdge = (outerH / 2) / absSin;
      }
      
      // Position the loop so it deeply overlaps the wall (by loopR * 0.7) to fuse seamlessly and securely
      const cx = Math.cos(angle) * (rEdge + loopR - (loopR * 0.7));
      const cy = Math.sin(angle) * (rEdge + loopR - (loopR * 0.7));
      const tx = -Math.sin(angle) * ringOffset;
      const ty = Math.cos(angle) * ringOffset;
      
      keyHoleCX = cx + tx;
      keyHoleCY = cy + ty;
      
      // Add the outer circle of the keychain to the 2D base footprint
      const loopOuter = keep(CrossSection.circle(loopR, 40).translate([keyHoleCX, keyHoleCY]));
      backShellCS = keep(backShellCS.add(loopOuter));
      
      // Magic step: Morphological Closing (Expand then Shrink)
      // This creates a smooth, solid fillet (radius 3.0mm) where the keychain loop meets the case wall,
      // making it look perfectly integrated and "agak berisi" just like the Clicker Generator.
      backShellCS = keep(backShellCS
          .offset(3.0, 'Round', 0, 32)
          .offset(-3.0, 'Round', 0, 32));
    }

    // Extrude the full combined 2D footprint into the 3D base shell
    const trayH = floorT + cardT + lidT;
    let backShellSol = keep(backShellCS.extrude(trayH).translate([0, 0, -trayH]));
    
    // The cavity inside the tray (where the card and lid go)
    // We round the cavity corners to R=3.0 to match a standard card and look premium
    const cavityCS = keep(CrossSection.square([cardW, cardH], true)
      .offset(-3.0, 'Round', 0, 32)
      .offset(3.0, 'Round', 0, 32));
    const cavityCut = keep(cavityCS.extrude(cardT + lidT + 0.01).translate([0, 0, -(cardT + lidT)]));
    backShellSol = keep(backShellSol.subtract(cavityCut));

    // Punch the keychain hole through the solid block we just made
    if (hasKeychain) {
      const holeCyl = keep(Manifold.cylinder(trayH + 2, keyHoleD/2, keyHoleD/2, 40).translate([keyHoleCX, keyHoleCY, -trayH - 1]));
      backShellSol = keep(backShellSol.subtract(holeCyl));
    }

    // ─── SNAP-FIT HOOKS & FRONT LID ──────────────────────────────────────────
    // We want a flush fit on top with no visible gap, so we use a stepped lid. 
    // The top lip is tight (0.15mm gap per side), the bottom is looser (0.3mm gap per side).
    const userGap = params.tolerance ?? 0.0;
    const tightGap = 0.3 + userGap; // For the top visible lip
    const looseGap = 0.6 + userGap; // For the bottom body that carries the snaps
    
    // Snap fit math derived for perfect 0.4mm interference (snappability) and 0.4mm overlap (fusion strength)
    const snapInterference = 0.4;
    const snapOverlap = 0.4;
    // Total diameter of the bump covers the gap + interference + overlap
    const snapRX = (looseGap / 2 + snapInterference + snapOverlap) / 2;
    // Center of the bump relative to the wall (negative means shifted inward towards the lid)
    const bumpOffset = -looseGap / 2 - snapOverlap + snapRX; 
    
    // We want the groove in the wall to have a tiny bit of clearance so the bump fully seats
    const grooveClearance = 0.15;
    const grooveOffset = bumpOffset + grooveClearance;
    
    const snapRZ = 0.3; // Vertical radius (total height 0.6mm)
    const snapScaleZ = snapRZ / snapRX;
    
    // Bottom of snap is 0.2mm above lid bottom
    const snapZ = -lidT + 0.2 + snapRZ; 
    const snapL = 25.0; // length of the long snaps
    const snapLShort = 15.0; // length of the short snaps on top/bottom
    
    const snapCyl = keep(Manifold.cylinder(snapL, snapRX, snapRX, 32, true));
    // Rotate to Y axis, then compress the height so it doesn't breach the top surface
    const snapY = keep(snapCyl.rotate([90, 0, 0]).scale([1, 1, snapScaleZ]));
    
    const snapCylShort = keep(Manifold.cylinder(snapLShort, snapRX, snapRX, 32, true));
    // Rotate to X axis, then compress the height
    const snapX = keep(snapCylShort.rotate([0, 90, 0]).scale([1, 1, snapScaleZ]));
    
    const snapsLocations = [
      // Side walls (X)
      { wall: 'x', sign: 1, pos: cardH / 4 },
      { wall: 'x', sign: 1, pos: -cardH / 4 },
      { wall: 'x', sign: -1, pos: cardH / 4 },
      { wall: 'x', sign: -1, pos: -cardH / 4 },
      // Top/bottom walls (Y)
      { wall: 'y', sign: 1, pos: 0 },
      { wall: 'y', sign: -1, pos: 0 },
    ];
    
    let grooves: any = null;
    let bumps: any = null;
    
    for (const s of snapsLocations) {
      if (s.wall === 'x') {
        const wallX = (cardW / 2) * s.sign;
        const grooveX = wallX + s.sign * grooveOffset;
        const bumpX = wallX + s.sign * bumpOffset;
        
        const g = keep(snapY.translate([grooveX, s.pos, snapZ]));
        grooves = grooves ? keep(grooves.add(g)) : g;
        
        const b = keep(snapY.translate([bumpX, s.pos, snapZ]));
        bumps = bumps ? keep(bumps.add(b)) : b;
      } else {
        const wallY = (cardH / 2) * s.sign;
        const grooveY = wallY + s.sign * grooveOffset;
        const bumpY = wallY + s.sign * bumpOffset;
        
        const g = keep(snapX.translate([s.pos, grooveY, snapZ]));
        grooves = grooves ? keep(grooves.add(g)) : g;
        
        const b = keep(snapX.translate([s.pos, bumpY, snapZ]));
        bumps = bumps ? keep(bumps.add(b)) : b;
      }
    }
    if (grooves) backShellSol = keep(backShellSol.subtract(grooves));

    // Stepped Lid Geometry
    const lipT = Math.min(0.6, lidT / 2); // top 0.6mm is the tight flush lip
    const bottomT = lidT - lipT;
    
    // Bottom part (loose fit, carries the snaps)
    const lidBottomCS = keep(CrossSection.square([cardW - looseGap, cardH - looseGap], true)
      .offset(-3.0, 'Round', 0, 32)
      .offset(3.0, 'Round', 0, 32));
    let lidSol = keep(lidBottomCS.extrude(bottomT).translate([0, 0, -lidT]));
    
    // Top part (tight fit, hides the gap)
    const lidTopCS = keep(CrossSection.square([cardW - tightGap, cardH - tightGap], true)
      .offset(-3.0, 'Round', 0, 32)
      .offset(3.0, 'Round', 0, 32));
    const lidTopSol = keep(lidTopCS.extrude(lipT).translate([0, 0, -lipT]));
    
    lidSol = keep(lidSol.add(lidTopSol));
    if (bumps) lidSol = keep(lidSol.add(bumps));

    // ─── LOGO / IMAGE EMBOSS on the front lid ─────────────────────────────────
    let actualLogoScale = logoScale;
    let logoCX = 0, logoCY = 0;

    if (outline && outline.length > 0 && outline[0].length > 0) {
      const logoCS = keep(new CrossSection(outline, 'NonZero'));
      const bb = logoCS.bounds();
      const lw = bb.max[0] - bb.min[0];
      const lh = bb.max[1] - bb.min[1];
      // Target 80% of width/height
      const targetW = cardW * 0.8 * logoScale;
      const targetH = cardH * 0.8 * logoScale;
      actualLogoScale = Math.min(targetW / lw, targetH / lh);
      logoCX = (bb.min[0] + bb.max[0]) / 2;
      logoCY = (bb.min[1] + bb.max[1]) / 2;
    }

    let allLogos: Solid | null = null;
    const isFlush = !!params.flushLogo;
    // For a flush logo, we extrude it by the top lip thickness and push it down into the lid.
    const flushDepth = lipT;

    for (let i = 0; i < regions.length; i++) {
      const r = regions[i];
      if (!r.rings || r.rings.length === 0 || r.rings[0].length === 0) continue;
      let rCS = keep(new CrossSection(r.rings, 'NonZero'));
      rCS = keep(rCS.translate([-logoCX, -logoCY]));
      rCS = keep(rCS.scale([actualLogoScale, actualLogoScale]));
      
      let placed: Solid;
      if (isFlush) {
        const rSol = keep(rCS.extrude(flushDepth));
        placed = keep(rSol.translate([0, 0, -flushDepth]));
        allLogos = allLogos ? keep(allLogos.add(placed)) : placed;
      } else {
        const rSol = keep(rCS.extrude(embossH));
        // Push it slightly into the lid by 0.1mm so it fuses perfectly with the lid surface in slicers
        placed = keep(rSol.translate([0, 0, -0.1])); 
        allLogos = allLogos ? keep(allLogos.add(placed)) : placed;
      }

      finalParts.push({
        name: `top-color-${i}-0`,
        ...getMeshData(placed),
        colorRgb: r.filamentRgb || [255, 255, 255],
        kind: 'cap',
        group: 'top',
        numProp: 3,
      });
    }

    if (allLogos) {
      // Cut the logo out of the lid so they fit perfectly
      lidSol = keep(lidSol.subtract(allLogos));
    }

    // Renamed parts so mount.ts color picker works ('base-body' and 'top-base')
    const bodyRgb: [number, number, number] = params.bodyColorRgb ?? [220, 220, 220];

    finalParts.push({
      name: 'top-base',
      ...getMeshData(lidSol),
      colorRgb: bodyRgb,
      kind: 'cap',
      group: 'top',
      numProp: 3,
    });

    finalParts.push({
      name: 'base-body',
      ...getMeshData(backShellSol),
      colorRgb: bodyRgb,
      kind: 'body',
      group: 'base',
      numProp: 3,
    });

    return finalParts;
  });

  return { parts, switchPlacements: [], warnings };
}
