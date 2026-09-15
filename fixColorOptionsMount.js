const fs = require('fs');
const pathMount = 'apps/clicker-generator/src/mount.ts';
let contentMount = fs.readFileSync(pathMount, 'utf8');

const regexMount = /const offered: RGB\[\] =[\s\S]*?const sameRgb = \(a: RGB, b: RGB\) => a\[0\] === b\[0\] && a\[1\] === b\[1\] && a\[2\] === b\[2\];\s*const options: RGB\[\] = \[\s*\.\.\.s\.customColors\.filter\(\(c\) => !offered\.some\(\(o\) => sameRgb\(o, c\)\)\),\s*\.\.\.offered,\s*\];/g;

const replacementMount = `const sameRgb = (a: RGB, b: RGB) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
        const baseFilaments = FILAMENTS.map(([, hex]) => hexToRgb(hex));
        const imageColors = s.colorMode === 'limited' && s.limitedColors.length > 0 ? s.limitedColors : [];
        const options: RGB[] = [...imageColors];
        s.customColors.forEach(c => {
          if (!options.some(o => sameRgb(o, c))) options.push(c);
        });
        baseFilaments.forEach(c => {
          if (!options.some(o => sameRgb(o, c))) options.push(c);
        });`;

contentMount = contentMount.replace(regexMount, replacementMount);
fs.writeFileSync(pathMount, contentMount);
console.log('Fixed options in mount.ts');
