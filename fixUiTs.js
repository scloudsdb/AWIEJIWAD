const fs = require('fs');
const path = 'apps/clicker-generator/src/ui/ui.ts';
let lines = fs.readFileSync(path, 'utf8').split('\n');
lines = lines.map(line => {
  if (line.includes('hollowMount?.parentElement')) {
    return "    const hm = document.getElementById('hollowMount'); if (hm && hm.parentElement) hm.parentElement.insertBefore(nametagToggle, hm);";
  }
  return line;
});
fs.writeFileSync(path, lines.join('\n'));
