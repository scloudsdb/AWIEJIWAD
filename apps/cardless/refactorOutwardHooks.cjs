const fs = require('fs');
const path = require('path');

const targetPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'geometry', 'buildCardHolder.ts');
let code = fs.readFileSync(targetPath, 'utf8');

const regex = /\/\/ Extrude the full combined 2D footprint[\s\S]*?if \(bumps\) lidSol = keep\(lidSol\.add\(bumps\)\);/;

const replacement = `// ── BASE SHELL & CAVITY ──
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
    
    // The lid top plate spans the entire outer footprint (flush with base outer wall)
    const baseFootprintCS = keep(CrossSection.square([outerW, outerH], true)
          .offset(-3.0, 'Round', 0, 32)
          .offset(3.0, 'Round', 0, 32));
    let lidSol = keep(baseFootprintCS.extrude(lipT).translate([0, 0, -lipT]));
    
    // Cut the base outer wall down to Z = -lipT so the lid sits flush
    const topShaveCut = keep(baseFootprintCS.extrude(lipT + 0.1).translate([0, 0, -lipT]));
    backShellSol = keep(backShellSol.subtract(topShaveCut));

    // The inner boss of the lid drops into the cavity
    const bottomT = lidT - lipT;
    const userGap = params.tolerance ?? 0.0;
    const looseGap = 0.6 + userGap; // For the inner boss
    const lidBottomCS = keep(CrossSection.square([cardW - looseGap, cardH - looseGap], true)
      .offset(-3.0, 'Round', 0, 32)
      .offset(3.0, 'Round', 0, 32));
    const lidBottomSol = keep(lidBottomCS.extrude(bottomT).translate([0, 0, -lidT]));
    lidSol = keep(lidSol.add(lidBottomSol));

    // ── INTERNAL SNAP-FIT HOOKS (OUTWARD FACING) ──
    // The hooks are on the sides of the inner boss and point OUTWARD towards the base wall.
    // The base wall has corresponding blind holes (grooves) on its inner face.
    
    const tabW = 10.0;
    const hookH = 1.2;
    const hookP = 0.6; // Protrusion amount outward
    
    const grooveW = tabW + 1.0;
    const grooveH = hookH + 0.6;
    const grooveDepth = 0.8; // Cuts 0.7mm into the 1.6mm base wall (leaves 0.9mm solid outside)
    
    const hookZ = -lipT - bottomT/2; // Vertically centered on the inner boss
    
    // Hook Profile (X = protrusion OUTWARD, Z = height)
    // Center of hook is Z = 0, X = 0 (attached to lid boss edge)
    const hookPoly = [
      [0, hookH/2],
      [hookP, hookH/2 - 0.2], // Flat-ish top for locking
      [hookP, hookH/2 - 0.4],
      [0, -hookH/2] // Angled bottom for easy sliding
    ];
    const hookCS = keep(new CrossSection([hookPoly]));
    // Extrude along Y, so length is Y, protrusion is X, height is Z
    const hookSolidY = keep(hookCS.extrude(tabW).translate([0, 0, -tabW/2]).rotate([90, 0, 0]));
    const hookSolidX = keep(hookSolidY.rotate([0, 0, 90])); // For Y walls
    
    // Groove block (Cube)
    const grooveBlock = keep(Manifold.cube([grooveDepth, grooveW, grooveH], true));
    
    // We place 2 hooks on each of the 4 walls (total 8 hooks!)
    const hookLocations = [
      // Left and Right walls (X axis)
      { wall: 'x', sign: 1, pos: cardH / 4 },
      { wall: 'x', sign: 1, pos: -cardH / 4 },
      { wall: 'x', sign: -1, pos: cardH / 4 },
      { wall: 'x', sign: -1, pos: -cardH / 4 },
      // Top and Bottom walls (Y axis)
      { wall: 'y', sign: 1, pos: cardW / 4 },
      { wall: 'y', sign: 1, pos: -cardW / 4 },
      { wall: 'y', sign: -1, pos: cardW / 4 },
      { wall: 'y', sign: -1, pos: -cardW / 4 },
    ];
    
    let grooves: any = null;
    let bumps: any = null;
    
    for (const loc of hookLocations) {
      if (loc.wall === 'x') {
        const wallX = (cardW / 2) * loc.sign;
        // Lid boss edge is at wallX - (looseGap/2)*sign
        const bossEdgeX = wallX - (looseGap/2) * loc.sign;
        
        // Orient the hook so X points outward (same direction as sign)
        let h = loc.sign > 0 ? hookSolidY : keep(hookSolidY.rotate([0, 0, 180]));
        h = keep(h.translate([bossEdgeX, loc.pos, hookZ]));
        bumps = bumps ? keep(bumps.add(h)) : h;
        
        // Orient and place groove
        // Groove is cut into the base wall (from wallX outward).
        const gCenterX = wallX + (grooveDepth/2 - 0.1) * loc.sign;
        let g = keep(grooveBlock.translate([gCenterX, loc.pos, hookZ]));
        grooves = grooves ? keep(grooves.add(g)) : g;
        
      } else {
        const wallY = (cardH / 2) * loc.sign;
        const bossEdgeY = wallY - (looseGap/2) * loc.sign;
        
        // Orient the hook so Y points outward
        let h = loc.sign > 0 ? hookSolidX : keep(hookSolidX.rotate([0, 0, 180]));
        h = keep(h.translate([loc.pos, bossEdgeY, hookZ]));
        bumps = bumps ? keep(bumps.add(h)) : h;
        
        // Groove for Y walls (rotate grooveBlock)
        const grooveBlockY = keep(grooveBlock.rotate([0, 0, 90]));
        const gCenterY = wallY + (grooveDepth/2 - 0.1) * loc.sign;
        let g = keep(grooveBlockY.translate([loc.pos, gCenterY, hookZ]));
        grooves = grooves ? keep(grooves.add(g)) : g;
      }
    }
    
    if (grooves) backShellSol = keep(backShellSol.subtract(grooves));
    if (bumps) lidSol = keep(lidSol.add(bumps));`;

code = code.replace(regex, replacement);
fs.writeFileSync(targetPath, code);
console.log('Successfully refactored to Outward-Facing Internal Hooks!');
