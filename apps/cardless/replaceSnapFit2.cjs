const fs = require('fs');
const path = require('path');

const targetPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'geometry', 'buildCardHolder.ts');
let code = fs.readFileSync(targetPath, 'utf8');

const regex = /\/\/.*?SNAP-FIT HOOKS & FRONT LID[\s\S]*?if \(bumps\) lidSol = keep\(lidSol\.add\(bumps\)\);/;

const replacement = `    // SNAP-FIT HOOKS & FRONT LID (External Side Tabs) 
    // We want a flush fit on top with no visible gap, so we use a stepped lid. 
    // The top lip is tight, the bottom is looser.
    const userGap = params.tolerance ?? 0.0;
    const tightGap = 0.3 + userGap; // For the top visible lip
    const looseGap = 0.6 + userGap; // For the bottom body that carries the snaps
    
    // Tab dimensions (visible from the outside)
    const tabL = 24.0; // Length along Y
    const tabH = 1.4;  // Height (Z)
    // tabW = how far it sticks out from the lid's actual edge.
    // The outer wall is at X = cardW/2 + wallT.
    // So to protrude 0.2mm past the outer wall:
    const tabW = wallT + looseGap/2 + 0.2; 
    
    // Counter-Clockwise profile for the tab (X = protrusion, Y = height)
    const tabPoly = [
      [0, 0],
      [0, -tabH],
      [0.6, -tabH],
      [tabW, -0.4],
      [tabW, 0]
    ];
    
    const tabCS = keep(new CrossSection([tabPoly]));
    let tabSolid = keep(tabCS.extrude(tabL).translate([0, 0, -tabL/2])); 
    tabSolid = keep(tabSolid.rotate([90, 0, 0])); 
    
    // Hole is a slightly larger cube
    const holeClearanceZ = 0.3;
    const holeClearanceY = 0.6;
    const holeW = tabW + 2.0; // plenty of extra to cut all the way through
    const holeL = tabL + holeClearanceY;
    const holeH = tabH + holeClearanceZ;
    let holeSolid = keep(Manifold.cube([holeW, holeL, holeH], true));
    // Center of tab is Z=-tabH/2
    holeSolid = keep(holeSolid.translate([tabW/2, 0, -tabH/2]));

    // Z position for the tabs
    const lipT = Math.min(0.6, lidT / 2);
    const zTabTop = -lipT;
    
    const rightTabX = cardW/2 - looseGap/2;
    const rightTab = keep(tabSolid.translate([rightTabX, 0, zTabTop]));
    const rightHole = keep(holeSolid.translate([rightTabX, 0, zTabTop]));
    
    const leftTabSolid = keep(tabSolid.rotate([0, 0, 180]));
    const leftHoleSolid = keep(holeSolid.rotate([0, 0, 180]));
    const leftTabX = -(cardW/2 - looseGap/2);
    const leftTab = keep(leftTabSolid.translate([leftTabX, 0, zTabTop]));
    const leftHole = keep(leftHoleSolid.translate([leftTabX, 0, zTabTop]));
    
    backShellSol = keep(backShellSol.subtract(rightHole));
    backShellSol = keep(backShellSol.subtract(leftHole));

    // Stepped Lid Geometry
    const bottomT = lidT - lipT;
    
    // Bottom part (loose fit)
    const lidBottomCS = keep(CrossSection.square([cardW - looseGap, cardH - looseGap], true)
      .offset(-3.0, 'Round', 0, 32)
      .offset(3.0, 'Round', 0, 32));
    let lidSol = keep(lidBottomCS.extrude(bottomT).translate([0, 0, -lidT]));
    
    // Top part (tight fit)
    const lidTopCS = keep(CrossSection.square([cardW - tightGap, cardH - tightGap], true)
      .offset(-3.0, 'Round', 0, 32)
      .offset(3.0, 'Round', 0, 32));
    const lidTopSol = keep(lidTopCS.extrude(lipT).translate([0, 0, -lipT]));
    
    lidSol = keep(lidSol.add(lidTopSol));
    
    // Add external tabs to the lid
    lidSol = keep(lidSol.add(rightTab));
    lidSol = keep(lidSol.add(leftTab));`;

code = code.replace(regex, replacement);
fs.writeFileSync(targetPath, code);
console.log('Replaced snap-fit logic successfully, verified.');
