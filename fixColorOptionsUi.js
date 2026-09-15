const fs = require('fs');
const pathUi = 'apps/clicker-generator/src/ui/ui.ts';
let contentUi = fs.readFileSync(pathUi, 'utf8');

const regexUi = /function colorOptionsFor\([\s\S]*?\): RGB\[\] \{[\s\S]*?return \[\.\.\.customColors\.filter\(\(c\) => !shelf\.some\(\(o\) => sameRgb\(o, c\)\)\), \.\.\.shelf\];\s*\}/g;

const replacementUi = `function colorOptionsFor(
      colorMode: 'normal' | 'limited' | undefined,
      limitedColors: RGB[] | undefined,
      customColors: RGB[],
    ): RGB[] {
      const sameRgb = (a: RGB, b: RGB) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
      const baseFilaments = FILAMENTS.map(([, hex]) => hexRgb(hex));
      
      const imageColors = colorMode === 'limited' && limitedColors && limitedColors.length > 0 ? limitedColors : [];
      
      // Combine them: Image colors first, then custom colors, then standard filaments.
      const combined: RGB[] = [...imageColors];
      
      customColors.forEach(c => {
        if (!combined.some(o => sameRgb(o, c))) combined.push(c);
      });
      
      baseFilaments.forEach(c => {
        if (!combined.some(o => sameRgb(o, c))) combined.push(c);
      });
      
      return combined;
    }`;

contentUi = contentUi.replace(regexUi, replacementUi);
fs.writeFileSync(pathUi, contentUi);
console.log('Fixed colorOptionsFor in ui.ts');
