const fs = require('fs');
const path = require('path');

const geoPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'geometry', 'buildCardHolder.ts');

let geoCode = fs.readFileSync(geoPath, 'utf8');

// 1. Revert the manual lidSol and backShellSol rotation
geoCode = geoCode.replace(/if \(params\.standUpPreview\) \{[\s\S]*?\}\s*const bodyRgb/, 'const bodyRgb');

// 2. Add the back-color logic inside the loop
const loopReplace = `
      finalParts.push({
        name: \`top-color-\${i}-0\`,
        ...getMeshData(placed),
        colorRgb: r.filamentRgb || [255, 255, 255],
        kind: 'cap',
        group: 'top',
        numProp: 3,
      });

      if (params.backLogo) {
        let placedBack = keep(placed.scale([-1, 1, 1]).translate([0, 0, -trayH]));
        finalParts.push({
          name: \`base-color-\${i}-0\`,
          ...getMeshData(placedBack),
          colorRgb: r.filamentRgb || [255, 255, 255],
          kind: 'body',
          group: 'base',
          numProp: 3,
        });
      }
`;
geoCode = geoCode.replace(/finalParts\.push\(\{\s*name: `top-color-\$\{i\}-0`.*?\}\);/s, loopReplace);

// 3. Add the global rotation at the very end of the function before return
const finalRotateCode = `
    if (params.standUpPreview) {
      // Rotate all parts 90 degrees around X to stand it upright, 
      // and translate up so it rests on Z=0
      for (let i = 0; i < finalParts.length; i++) {
        const p = finalParts[i];
        // finalParts contains mesh data (vertProperties, triVerts)
        // We can't easily rotate raw mesh data without Manifold. 
        // It's much easier to reconstruct the solid, rotate it, and get mesh data again.
        // Wait, finalParts just has ...getMeshData(solid). 
      }
    }
`;
// Actually, it's way easier to just store all Solids in an array, then convert to mesh at the end!
// But wait, it's easier to just do it in place:
// Let's create a final pass that loops through and manually mutates the vertices if standUpPreview is true.
// vertProperties is a Float32Array where [x, y, z, ...]
`;

fs.writeFileSync(path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'fixGeo.cjs'), geoCode);
