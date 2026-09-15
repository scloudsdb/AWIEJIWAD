const fs = require('fs');
const path = 'apps/clicker-generator/src/mount.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /function rememberColour\(rgb: RGB\) \{[\s\S]*?store\.set\(\{ customColors: \[\.\.\.s\.customColors, rgb\] \}\);\s*\}/g;

const replacement = `function rememberColour(rgb: RGB) {
    const s = store.get();
    const same = (a: RGB, b: RGB) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    
    const shelf = s.colorMode === 'limited' && s.limitedColors.length > 0
        ? s.limitedColors
        : FILAMENTS.map(([, hex]) => hexToRgb(hex));
        
    if (shelf.some((o) => same(o, rgb))) return;
    if (s.customColors.some((c) => same(c, rgb))) return;
    
    store.set({ customColors: [...s.customColors, rgb] });
  }`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log('Fixed rememberColour in clicker-generator mount.ts');
