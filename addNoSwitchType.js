const fs = require('fs');
const path = 'apps/clicker-generator/src/types.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /export interface BuildParams \{/;
const replacement = `export interface BuildParams {
  noSwitch?: boolean;`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log('Added noSwitch to BuildParams');
