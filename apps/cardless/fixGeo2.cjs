const fs = require('fs');
const path = require('path');

const targetPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'geometry', 'buildCardHolder.ts');
let code = fs.readFileSync(targetPath, 'utf8');

// Revert manual lid/base rotation
code = code.replace(/if \(params\.standUpPreview\) \{[\s\S]*?\}\s*const bodyRgb/g, 'const bodyRgb');

// Insert back-color logic
const loopRegex = /finalParts\.push\(\{\s*name: `top-color-\$\{i\}-0`,[\s\S]*?\}\);/g;
const loopReplace = `finalParts.push({
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
      }`;
code = code.replace(loopRegex, loopReplace);

// Insert global rotation
const endRegex = /return finalParts;\n\s*\}\);/g;
const endReplace = `
    if (params.standUpPreview) {
      for (const part of finalParts) {
        const verts = part.vertProperties;
        for (let i = 0; i < verts.length; i += part.numProp) {
          const y = verts[i + 1];
          const z = verts[i + 2];
          verts[i + 1] = -z;
          verts[i + 2] = y + outerH / 2;
        }
      }
    }
    return finalParts;
  });`;
code = code.replace(endRegex, endReplace);

fs.writeFileSync(targetPath, code);
console.log('Fixed rotation logic and back logo colors!');
