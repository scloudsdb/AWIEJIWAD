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

    // ── BASE SHELL & CAVITY ──
    const trayH = floorT + cardT + lidT;
    let backShellSol = keep(backShellCS.extrude(trayH).translate([0, 0, -trayH]));
    
    const cavityCS = keep(CrossSection.square([cardW, cardH], true)
      .offset(-3.0, 'Round', 0, 32)
      .offset(3.0, 'Round', 0, 32));
    const cavityCut = keep(cavityCS.extrude(cardT + lidT + 0.01).translate([0, 0, -(cardT + lidT)]));
    backShellSol = keep(backShellSol.subtract(cavityCut));

    if (hasKeychain) {
      const holeCyl = keep(Manifold.cylinder(trayH + 2, keyHoleD/2, keyHoleD/2, 40).translate([keyHoleCX, keyHoleCY, -trayH - 1]));
      backShellSol = keep(backShellSol.subtract(holeCyl));
    }

    // ── FULL-CAP LAP JOINT ARCHITECTURE ──
    const lipT = Math.min(0.6, lidT / 2); // thickness of the top plate
    
    const baseFootprintCS = keep(CrossSection.square([outerW, outerH], true)
          .offset(-3.0, 'Round', 0, 32)
          .offset(3.0, 'Round', 0, 32));
    let lidSol = keep(baseFootprintCS.extrude(lipT).translate([0, 0, -lipT]));
    
    const topShaveCut = keep(baseFootprintCS.extrude(lipT + 0.1).translate([0, 0, -lipT]));
    backShellSol = keep(backShellSol.subtract(topShaveCut));

    const bottomT = lidT - lipT;
    const userGap = params.tolerance ?? 0.0;
    const looseGap = 0.6 + userGap; 
    const lidBottomCS = keep(CrossSection.square([cardW - looseGap, cardH - looseGap], true)
      .offset(-3.0, 'Round', 0, 32)
      .offset(3.0, 'Round', 0, 32));
    const lidBottomSol = keep(lidBottomCS.extrude(bottomT).translate([0, 0, -lidT]));
    lidSol = keep(lidSol.add(lidBottomSol));

    // ── CANTILEVER SNAP-FIT & PRY SLOTS ("Pengait di Samping") ──
    // 4 Sisi: Kanan, Kiri, Atas, Bawah
    
    const pryW = 20.0;
    const pryDepth = 1.0; 
    const basePryH = 2.0; 
    
    const tabW = 19.6;
    const tabDepth = 0.9;
    const lidPryH = 1.4; // Leaves 0.6mm gap at bottom for fingernail
    
    const hookW = 10.0;
    const hookDepth = 0.5; // protrudes 0.5mm inward
    const hookH = 0.8;
    const holeH = 1.0;
    const holeDepth = wallT - pryDepth + 0.2; // cut through the remaining inner wall
    
    // Z positions relative to lipT
    const basePryZ = -lipT - basePryH/2;
    const lidPryZ = -lipT - lidPryH/2;
    const holeZ = -lipT - 0.9; 
    const hookZ = -lipT - 0.9; 

    // Blocks (centered at X=0, Y=0, Z=0)
    const basePryBlock = keep(Manifold.cube([pryDepth, pryW, basePryH], true));
    const holeBlock = keep(Manifold.cube([holeDepth, hookW, holeH], true));
    const tabBlock = keep(Manifold.cube([tabDepth, tabW, lidPryH], true));
    
    const hookPoly = [
      [0, hookH/2],
      [-hookDepth, hookH/2],
      [-hookDepth, -hookH/2 + 0.3], 
      [0, -hookH/2]
    ];
    const hookCS = keep(new CrossSection([hookPoly]));
    const hookSolid = keep(hookCS.extrude(hookW - 0.4).translate([0, 0, -(hookW-0.4)/2]).rotate([90, 0, 0]));

    // --- APPLY TO RIGHT WALL (X+) ---
    const wallX = cardW/2;
    const rightBasePryX = wallX + wallT - pryDepth/2 + 0.01;
    const rightHoleX = wallX + (wallT - pryDepth)/2;
    const rightTabX = wallX + wallT - tabDepth/2;
    const rightHookX = rightTabX - tabDepth/2; 
    
    const rightBasePryCut = keep(basePryBlock.translate([rightBasePryX, 0, basePryZ]));
    const rightHoleCut = keep(holeBlock.translate([rightHoleX, 0, holeZ]));
    const rightTabAdd = keep(tabBlock.translate([rightTabX, 0, lidPryZ]));
    const rightHookAdd = keep(hookSolid.translate([rightHookX, 0, hookZ]));

    backShellSol = keep(backShellSol.subtract(rightBasePryCut));
    backShellSol = keep(backShellSol.subtract(rightHoleCut));
    lidSol = keep(lidSol.add(rightTabAdd));
    lidSol = keep(lidSol.add(rightHookAdd));

    // --- APPLY TO LEFT WALL (X-) ---
    const leftBasePryCut = keep(rightBasePryCut.rotate([0, 0, 180]));
    const leftHoleCut = keep(rightHoleCut.rotate([0, 0, 180]));
    const leftTabAdd = keep(rightTabAdd.rotate([0, 0, 180]));
    const leftHookAdd = keep(rightHookAdd.rotate([0, 0, 180]));

    backShellSol = keep(backShellSol.subtract(leftBasePryCut));
    backShellSol = keep(backShellSol.subtract(leftHoleCut));
    lidSol = keep(lidSol.add(leftTabAdd));
    lidSol = keep(lidSol.add(leftHookAdd));

    // --- APPLY TO TOP WALL (Y+) ---
    // Rotate the blocks so they face the Y direction
    const basePryBlockY = keep(basePryBlock.rotate([0, 0, 90]));
    const holeBlockY = keep(holeBlock.rotate([0, 0, 90]));
    const tabBlockY = keep(tabBlock.rotate([0, 0, 90]));
    const hookSolidY = keep(hookSolid.rotate([0, 0, 90]));
    
    const wallY = cardH/2;
    const topBasePryY = wallY + wallT - pryDepth/2 + 0.01;
    const topHoleY = wallY + (wallT - pryDepth)/2;
    const topTabY = wallY + wallT - tabDepth/2;
    const topHookY = topTabY - tabDepth/2; 
    
    const topBasePryCut = keep(basePryBlockY.translate([0, topBasePryY, basePryZ]));
    const topHoleCut = keep(holeBlockY.translate([0, topHoleY, holeZ]));
    const topTabAdd = keep(tabBlockY.translate([0, topTabY, lidPryZ]));
    const topHookAdd = keep(hookSolidY.translate([0, topHookY, hookZ]));

    // backShellSol = keep(backShellSol.subtract(topBasePryCut));
    // backShellSol = keep(backShellSol.subtract(topHoleCut));
    // lidSol = keep(lidSol.add(topTabAdd));
    // lidSol = keep(lidSol.add(topHookAdd));

    // --- APPLY TO BOTTOM WALL (Y-) ---
    const bottomBasePryCut = keep(topBasePryCut.rotate([0, 0, 180]));
    const bottomHoleCut = keep(topHoleCut.rotate([0, 0, 180]));
    const bottomTabAdd = keep(topTabAdd.rotate([0, 0, 180]));
    const bottomHookAdd = keep(topHookAdd.rotate([0, 0, 180]));

    backShellSol = keep(backShellSol.subtract(bottomBasePryCut));
    backShellSol = keep(backShellSol.subtract(bottomHoleCut));
    lidSol = keep(lidSol.add(bottomTabAdd));
    lidSol = keep(lidSol.add(bottomHookAdd));

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
        name: r.partName || `top-color-${i}-0`,
        ...getMeshData(placed),
        colorRgb: r.filamentRgb || [255, 255, 255],
        kind: 'cap',
        group: 'top',
        numProp: 3,
      });

      if (params.backLogo) {
        let placedBack = keep(placed.rotate([0, 180, 0]).translate([0, 0, -trayH]));
        finalParts.push({
          name: (r.partName || `top-color-${i}-0`).replace('top-', 'base-'),
          ...getMeshData(placedBack),
          colorRgb: params.partOverrides?.[(r.partName || `top-color-${i}-0`).replace('top-', 'base-')] || r.filamentRgb || [255, 255, 255],
          kind: 'body',
          group: 'base',
          numProp: 3,
        });
      }
    }

    
    if (allLogos) {
      lidSol = keep(lidSol.subtract(allLogos));
      if (params.backLogo) {
        // Mirror along Y so it appears correct when flipped over horizontally
        let backLogo = keep(allLogos.rotate([0, 180, 0]));
        // Translate to the bottom of the base
        backLogo = keep(backLogo.translate([0, 0, -trayH]));
        backShellSol = keep(backShellSol.subtract(backLogo));
      }
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
