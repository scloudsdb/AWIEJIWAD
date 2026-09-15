const fs = require('fs');
const pathKit = 'packages/ui-kit/src/components/filament.ts';
let contentKit = fs.readFileSync(pathKit, 'utf8');

const regexKit = /export const FILAMENTS: ReadonlyArray<readonly \[string, string\]> = \[[^\]]+\];/g;

const newFilaments = `export const FILAMENTS: ReadonlyArray<readonly [string, string]> = [
  ['Black', '#161616'],
  ['White', '#f7f7f5'],
  ['Gray', '#8c8c90'],
  ['Silver', '#cfd0d2'],
  ['Red', '#c8102e'],
  ['Orange', '#ff6a13'],
  ['Yellow', '#f5c518'],
  ['Green', '#00ae42'],
  ['Cyan', '#0086d6'],
  ['Blue', '#0a5cd5'],
  ['Purple', '#8e44ad'],
  ['Pink', '#e6398b'],
  ['Brown', '#7a5230'],
  ['Beige', '#d9c8a9'],
  ['eSUN PLA+ Magenta', '#DA3B6C'],
  ['SUNLU PLA+ Grey 2.0', '#75787B'],
  ['eSUN PLA+ Haze Blue', '#3B6FA0'],
  ['eSUN PLA+ Aqua', '#00B5AC'],
  ['eSUN PLA+ Jade Green', '#02C5A7'],
  ['SUNLU PLA+ Lavender Purple', '#685BC7'],
  ['SUNLU PLA+ Olive Green', '#50533C'],
  ['SUNLU PLA+ Roasted Chestnut', '#3C3027'],
];`;

contentKit = contentKit.replace(regexKit, newFilaments);
fs.writeFileSync(pathKit, contentKit);
console.log('Added 8 filaments to ui-kit filament.ts');
