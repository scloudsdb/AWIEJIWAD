const fs = require('fs');
const path = require('path');

const targetPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'geometry', 'buildCardHolder.ts');
let code = fs.readFileSync(targetPath, 'utf8');

const regex = /const snapRZ = 0\.3; \/\/ Vertical radius \(total height 0\.6mm\)[\s\S]*?const snapX = keep\(snapCylShort\.rotate\(\[0, 90, 0\]\)\.scale\(\[1, 1, snapScaleZ\]\)\);/;

const replacement = `    const lipT = Math.min(0.6, lidT / 2); // top 0.6mm is the tight flush lip
    const railTop = -lipT - 0.2; 
    const railBottom = -lidT + 0.2; 
    const railH = railTop - railBottom;
    const rY = railH / 2;
    const rX = snapRX; // uses the same snapRX calculated earlier for perfect interference
    
    // House-shaped profile: flat top for locking, angled bottom for easy sliding
    const railPoly = [
      [rX, rY],
      [-rX, rY],
      [-rX, -rY + 0.4],
      [0, -rY],
      [rX, -rY + 0.4]
    ];
    const railCS = keep(new CrossSection([railPoly]));
    
    const snapZ = (railTop + railBottom) / 2;
    const snapL = 25.0; // length of the long snaps
    const snapLShort = 15.0; // length of the short snaps on top/bottom
    
    // Extrude and rotate so X=protrusion, Z=height, Y=length
    const snapY = keep(railCS.extrude(snapL).translate([0, 0, -snapL/2]).rotate([90, 0, 0]));
    
    // For top/bottom walls: rotate 90 around Z so protrusion is along Y, length along X
    const snapX = keep(railCS.extrude(snapLShort).translate([0, 0, -snapLShort/2]).rotate([90, 0, 0]).rotate([0, 0, 90]));`;

code = code.replace(regex, replacement);
fs.writeFileSync(targetPath, code);
console.log('Replaced snap cylinders with rails successfully.');
