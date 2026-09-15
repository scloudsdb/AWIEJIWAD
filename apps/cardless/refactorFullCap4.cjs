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

    backShellSol = keep(backShellSol.subtract(topBasePryCut));
    backShellSol = keep(backShellSol.subtract(topHoleCut));
    lidSol = keep(lidSol.add(topTabAdd));
    lidSol = keep(lidSol.add(topHookAdd));

    // --- APPLY TO BOTTOM WALL (Y-) ---
    const bottomBasePryCut = keep(topBasePryCut.rotate([0, 0, 180]));
    const bottomHoleCut = keep(topHoleCut.rotate([0, 0, 180]));
    const bottomTabAdd = keep(topTabAdd.rotate([0, 0, 180]));
    const bottomHookAdd = keep(topHookAdd.rotate([0, 0, 180]));

    backShellSol = keep(backShellSol.subtract(bottomBasePryCut));
    backShellSol = keep(backShellSol.subtract(bottomHoleCut));
    lidSol = keep(lidSol.add(bottomTabAdd));
    lidSol = keep(lidSol.add(bottomHookAdd));`;

code = code.replace(regex, replacement);
fs.writeFileSync(targetPath, code);
console.log('Successfully applied cantilever snap-fits to all 4 walls!');
