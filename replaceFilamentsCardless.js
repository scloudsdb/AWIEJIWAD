const fs = require('fs');

const path = 'apps/cardless/src/types.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /export const FILAMENTS: \[string, string\]\[\] = \[[^\]]+\];/g;
content = content.replace(regex, "export { FILAMENTS } from '@AI3DLabs/ui-kit';");

fs.writeFileSync(path, content);
console.log('Replaced FILAMENTS in cardless types.ts');
