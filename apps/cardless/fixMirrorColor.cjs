const fs = require('fs');
const path = require('path');

const mountPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'mount.ts');
let mountCode = fs.readFileSync(mountPath, 'utf8');

const regex = /\} else if \(target\.kind === 'part'\) \{\s*\/\/ One part only[\s\S]*?store\.set\(\{ partOverrides: \{ \.\.\.\(s\.partOverrides \?\? \{\}\), \[target\.name\]: rgb \} \}\);\s*\}/g;

const replacement = `} else if (target.kind === 'part') {
      // One part only. Recorded in partOverrides so it survives the next rebuild.
      const overrides = { ...(s.partOverrides ?? {}), [target.name]: rgb };
      
      let mirrorName: string | null = null;
      if (target.name.startsWith('top-color-')) {
         mirrorName = target.name.replace('top-color-', 'base-color-');
      } else if (target.name.startsWith('base-color-')) {
         mirrorName = target.name.replace('base-color-', 'top-color-');
      }
      if (mirrorName) {
         overrides[mirrorName] = rgb;
      }

      latestParts.forEach((p, idx) => {
         if (p.name === target.name || p.name === mirrorName) {
            viewer.setPartColor(idx, rgb);
            latestParts[idx] = { ...latestParts[idx], colorRgb: rgb };
         }
      });
      store.set({ partOverrides: overrides });
    }`;

mountCode = mountCode.replace(regex, replacement);
fs.writeFileSync(mountPath, mountCode);

console.log('Fixed mirrored recoloring for part click targets!');
