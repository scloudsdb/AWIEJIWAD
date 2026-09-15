const fs = require('fs');
const path = require('path');

const geoPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'geometry', 'buildCardHolder.ts');
let geoCode = fs.readFileSync(geoPath, 'utf8');

// Front logo
// name: `top-color-${i}-0`,
geoCode = geoCode.replace(/name: `top-color-\$\{i\}-0`,/g, "name: r.partName || `top-color-${i}-0`,");

// Back logo
// name: `base-color-${i}-0`,
// ...getMeshData(placedBack),
// colorRgb: params.partOverrides?.[`base-color-${i}-0`] || r.filamentRgb || [255, 255, 255],
geoCode = geoCode.replace(/name: `base-color-\$\{i\}-0`,\s*\.\.\.getMeshData\(placedBack\),\s*colorRgb: params\.partOverrides\?\.\[`base-color-\$\{i\}-0`\] \|\| r\.filamentRgb \|\| \[255, 255, 255\],/g, `name: (r.partName || \`top-color-\${i}-0\`).replace('top-', 'base-'),
          ...getMeshData(placedBack),
          colorRgb: params.partOverrides?.[(r.partName || \`top-color-\${i}-0\`).replace('top-', 'base-')] || r.filamentRgb || [255, 255, 255],`);

fs.writeFileSync(geoPath, geoCode);

console.log('Fixed part naming mismatch in generator!');
