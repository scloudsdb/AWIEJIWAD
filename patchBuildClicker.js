const fs = require('fs');
const path = 'apps/clicker-generator/src/geometry/buildClicker.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Skip generating switches
content = content.replace(
  /const requested = \(params\.switches\?\.length \? params\.switches : \[\{ x: 0, y: 0, rotation: 0 \}\]\)\.slice\(0, 3\);/,
  `const requested = params.noSwitch ? [] : (params.switches?.length ? params.switches : [{ x: 0, y: 0, rotation: 0 }]).slice(0, 3);`
);

// 2. Adjust bodyTopZ so the plate reaches the top
content = content.replace(
  /const bodyTopZ = slabTopZ - capProud;/,
  `const bodyTopZ = params.noSwitch ? slabTopZ : slabTopZ - capProud;`
);

// 3. Skip well subtraction
content = content.replace(
  /body = track\(body\.subtract\(well\)\);/,
  `if (!params.noSwitch) body = track(body.subtract(well));`
);

// 4. Skip hollow base
content = content.replace(
  /if \(params\.hollowBase\) \{/,
  `if (params.hollowBase && !params.noSwitch) {`
);

// 5. Hide the cap and subtract its holes from the body instead
content = content.replace(
  /if \(\!base\.isEmpty\(\)\) \{/,
  `
    if (params.noSwitch) {
      for (const [level, hole2D] of holesByLevel.entries()) {
        const heightShift = level * params.stepHeight;
        const bottomZ = imageBottomZ + Math.min(0, heightShift);
        const holePrism = extrudeAt(hole2D, slabTopZ - bottomZ + 0.02, bottomZ - 0.01);
        body = track(body.subtract(holePrism));
      }
    }

    if (!base.isEmpty() && !params.noSwitch) {`
);

fs.writeFileSync(path, content);
console.log('Patched buildClicker.ts for noSwitch support');
