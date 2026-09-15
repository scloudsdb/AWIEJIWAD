const fs = require('fs');
const path = require('path');

const mountPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'mount.ts');
let mountCode = fs.readFileSync(mountPath, 'utf8');

// 1. Add partOverrides to buildParamsFor
if (!mountCode.includes('partOverrides: s.partOverrides,')) {
    // Find the end of buildParamsFor return object
    mountCode = mountCode.replace(/componentHeights: s\.componentHeights,/, 'componentHeights: s.componentHeights,\n        partOverrides: s.partOverrides,');
}

// 2. Update partColorTarget to match base-color
// Old: if (/^top-color-\d+-\d+$/.test(name)) return { kind: 'part', name };
// New: if (/^(top|base)-color-\d+-\d+$/.test(name)) return { kind: 'part', name };
mountCode = mountCode.replace(/if \(\/\^top-color-\\d\+-\\d\+\$\/\.test\(name\)\) return \{ kind: 'part', name \};/g, "if (/^(top|base)-color-\\d+-\\d+$/.test(name)) return { kind: 'part', name };");

// Old: const m = /^top-color-(\d+)(?:-(\d+))?$/.exec(name);
// New: const m = /^(top|base)-color-(\d+)(?:-(\d+))?$/.exec(name);
// Also adjust index from m[1] to m[2]
mountCode = mountCode.replace(/const m = \/\^top-color-\(\\d\+\)\(\?:-\(\\d\+\)\)\?\$\/\.exec\(name\);\s*if \(m\) \{\s*return \{ kind: 'region', index: \+m\[1\], compIndex: m\[2\] \? \+m\[2\] : 0 \};\s*\}/g, "const m = /^(top|base)-color-(\\d+)(?:-(\\d+))?$/.exec(name);\n      if (m) {\n        return { kind: 'region', index: +m[2], compIndex: m[3] ? +m[3] : 0 };\n      }");

// 3. Update isTarget in applyModelRecolor
// Old:
// const prefix = `top-color-${i}-`;
// const isTarget = blocks
//   ? (n: string) => /^top-color-\d+-\d+$/.test(n)
//   : (n: string) => n.startsWith(prefix);
// New:
const isTargetOld = /const prefix = `top-color-\$\{i\}-`;\s*const isTarget = blocks\s*\? \(n: string\) => \/\^top-color-\\d\+-\\d\+\$\/\.test\(n\)\s*: \(n: string\) => n\.startsWith\(prefix\);/g;
const isTargetNew = `const prefix = \`top-color-\${i}-\`;
        const basePrefix = \`base-color-\${i}-\`;
        const isTarget = blocks
          ? (n: string) => /^(top|base)-color-\\d+-\\d+$/.test(n)
          : (n: string) => n.startsWith(prefix) || n.startsWith(basePrefix);`;
mountCode = mountCode.replace(isTargetOld, isTargetNew);

fs.writeFileSync(mountPath, mountCode);

// 4. Update buildCardHolder.ts
const geoPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'geometry', 'buildCardHolder.ts');
let geoCode = fs.readFileSync(geoPath, 'utf8');

// Old: colorRgb: r.filamentRgb || [255, 255, 255], inside the base-color logic
const baseColorOld = /name: `base-color-\$\{i\}-0`,\s*\.\.\.getMeshData\(placedBack\),\s*colorRgb: r\.filamentRgb \|\| \[255, 255, 255\],/g;
const baseColorNew = `name: \`base-color-\${i}-0\`,
          ...getMeshData(placedBack),
          colorRgb: params.partOverrides?.[originName = \`base-color-\${i}-0\`] || params.partOverrides?.[originName] || r.filamentRgb || [255, 255, 255],`;

// Wait, the regex `name: \`base-color-...` has variables. I'll just do a simpler replace.
geoCode = geoCode.replace(/name: `base-color-\$\{i\}-0`,\s*\.\.\.getMeshData\(placedBack\),\s*colorRgb: r.filamentRgb \|\| \[255, 255, 255\],/g, "name: `base-color-${i}-0`,\n          ...getMeshData(placedBack),\n          colorRgb: params.partOverrides?.[`base-color-${i}-0`] || r.filamentRgb || [255, 255, 255],");

fs.writeFileSync(geoPath, geoCode);

console.log('Fixed back logo coloring logic!');
