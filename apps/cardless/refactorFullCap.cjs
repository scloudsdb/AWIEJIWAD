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
    const userGap = params.tolerance ?? 0.0;
    const looseGap = 0.6 + userGap; // For the inner boss
    const lipT = Math.min(0.6, lidT / 2); // thickness of the top plate
    
    // The lid top plate spans the entire outer footprint (flush with base)
    const baseFootprintCS = keep(CrossSection.square([outerW, outerH], true)
          .offset(-3.0, 'Round', 0, 32)
          .offset(3.0, 'Round', 0, 32));
    let lidSol = keep(baseFootprintCS.extrude(lipT).translate([0, 0, -lipT]));
    
    // Cut the base outer wall down to Z = -lipT so the lid sits flush
    const topShaveCut = keep(baseFootprintCS.extrude(lipT + 0.1).translate([0, 0, -lipT]));
    backShellSol = keep(backShellSol.subtract(topShaveCut));

    // The inner boss of the lid drops into the cavity
    const bottomT = lidT - lipT;
    const lidBottomCS = keep(CrossSection.square([cardW - looseGap, cardH - looseGap], true)
      .offset(-3.0, 'Round', 0, 32)
      .offset(3.0, 'Round', 0, 32));
    const lidBottomSol = keep(lidBottomCS.extrude(bottomT).translate([0, 0, -lidT]));
    lidSol = keep(lidSol.add(lidBottomSol));

    // ── FINGERNAIL PRY SLOTS ("Pengait di Samping") ──
    const pryW = 20.0;
    const pryHBase = 2.0; 
    const pryHLid = 1.2; 
    const pryDepth = wallT * 0.7; // Cut 70% into the outer wall
    
    const pryBaseBlock = keep(Manifold.cube([pryDepth, pryW, pryHBase], true));
    const pryLidBlock = keep(Manifold.cube([pryDepth - 0.2, pryW - 0.4, pryHLid], true));
    
    const rightBasePryX = outerW/2 - pryDepth/2 + 0.01;
    const rightLidPryX = outerW/2 - (pryDepth-0.2)/2;
    const basePryZ = -lipT - pryHBase/2;
    const lidPryZ = -lipT - pryHLid/2;
    
    const rightBasePryCut = keep(pryBaseBlock.translate([rightBasePryX, 0, basePryZ]));
    const rightLidPryAdd = keep(pryLidBlock.translate([rightLidPryX, 0, lidPryZ]));
    const leftBasePryCut = keep(pryBaseBlock.translate([-rightBasePryX, 0, basePryZ]));
    const leftLidPryAdd = keep(pryLidBlock.translate([-rightLidPryX, 0, lidPryZ]));
    
    backShellSol = keep(backShellSol.subtract(rightBasePryCut));
    backShellSol = keep(backShellSol.subtract(leftBasePryCut));
    lidSol = keep(lidSol.add(rightLidPryAdd));
    lidSol = keep(lidSol.add(leftLidPryAdd));

    // ── INTERNAL SNAP-FIT HOOKS (House Profile) ──
    const snapInterference = 0.4;
    const snapOverlap = 0.4;
    const snapRX = (looseGap / 2 + snapInterference + snapOverlap) / 2;
    const bumpOffset = -looseGap / 2 - snapOverlap + snapRX; 
    const grooveClearance = 0.15;
    const grooveOffset = bumpOffset + grooveClearance;

    const railTop = -lipT - 0.2; 
    const railBottom = -lidT + 0.2; 
    const railH = railTop - railBottom;
    const rY = railH / 2;
    
    const railPoly = [
      [snapRX, rY],
      [-snapRX, rY],
      [-snapRX, -rY + 0.4],
      [0, -rY],
      [snapRX, -rY + 0.4]
    ];
    const railCS = keep(new CrossSection([railPoly]));
    
    const snapZ = (railTop + railBottom) / 2;
    const snapL = 25.0; 
    const snapLShort = 15.0; 
    
    const snapY = keep(railCS.extrude(snapL).translate([0, 0, -snapL/2]).rotate([90, 0, 0]));
    const snapX = keep(railCS.extrude(snapLShort).translate([0, 0, -snapLShort/2]).rotate([90, 0, 0]).rotate([0, 0, 90]));
    
    const snapsLocations = [
      { wall: 'x', sign: 1, pos: cardH / 4 },
      { wall: 'x', sign: 1, pos: -cardH / 4 },
      { wall: 'x', sign: -1, pos: cardH / 4 },
      { wall: 'x', sign: -1, pos: -cardH / 4 },
      { wall: 'y', sign: 1, pos: 0 },
      { wall: 'y', sign: -1, pos: 0 },
    ];
    
    let grooves = null;
    let bumps = null;
    
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
    if (bumps) lidSol = keep(lidSol.add(bumps));`;

code = code.replace(regex, replacement);
fs.writeFileSync(targetPath, code);
console.log('Successfully refactored to Full-Cap architecture with internal rails and pry slots!');
