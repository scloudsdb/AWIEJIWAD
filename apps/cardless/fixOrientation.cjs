const fs = require('fs');
const path = require('path');

const geoPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'geometry', 'buildCardHolder.ts');
let geoCode = fs.readFileSync(geoPath, 'utf8');

// Replace placedBack scale
geoCode = geoCode.replace(/let placedBack = keep\(placed\.scale\(\[-1, 1, 1\]\)\.translate\(\[0, 0, -trayH\]\)\);/g, "let placedBack = keep(placed.rotate([0, 180, 0]).translate([0, 0, -trayH]));");

// Replace backLogo scale
geoCode = geoCode.replace(/let backLogo = keep\(allLogos\.scale\(\[-1, 1, 1\]\)\);/g, "let backLogo = keep(allLogos.rotate([0, 180, 0]));");

fs.writeFileSync(geoPath, geoCode);

console.log('Fixed back logo flush/emboss orientation!');
