const fs = require('fs');
const path = 'apps/logo-keychain/src/ui/ui.ts';
let content = fs.readFileSync(path, 'utf8');

const startMounts = content.indexOf('const capProudRow = sliderRow({');
const endMounts = content.indexOf('const rightScroll = el');

if (startMounts !== -1 && endMounts !== -1) {
  const newJs = '  const ringStyleRow = segmentedControl({\n' +
'    label: \'Ring style\',\n' +
'    value: initial.ringStyle,\n' +
'    options: [{ value: \'loop\', label: \'Loop\' }, { value: \'corner\', label: \'Corner\' }],\n' +
'    onChange: (v) => cb.onRingStyle(v),\n' +
'  });\n' +
'  .append(ringStyleRow);\n\n' +
'  const holeDiaRow = stepperRow({\n' +
'    label: \'Hole diameter\',\n' +
'    min: 3.2, max: 8, step: 0.4, value: initial.holeDia, unit: \'mm\',\n' +
'    onInput: (v) => cb.onHoleDia(v),\n' +
'  });\n' +
'  .append(holeDiaRow);\n\n' +
'  const ringThickRow = stepperRow({\n' +
'    label: \'Ring thickness\',\n' +
'    min: 1.0, max: 6.0, step: 0.2, value: initial.ringThickness, unit: \'mm\',\n' +
'    onInput: (v) => cb.onRingThickness(v),\n' +
'  });\n' +
'  .append(ringThickRow);\n\n' +
'  const ringPosRowX = stepperRow({\n' +
'    label: \'Ring X\',\n' +
'    min: -20, max: 20, step: 1.0, value: initial.ringPosX, unit: \'mm\',\n' +
'    onInput: (v) => cb.onRingPos(v, \'x\'),\n' +
'  });\n' +
'  const ringPosRowY = stepperRow({\n' +
'    label: \'Ring Y\',\n' +
'    min: -20, max: 20, step: 1.0, value: initial.ringPosY, unit: \'mm\',\n' +
'    onInput: (v) => cb.onRingPos(v, \'y\'),\n' +
'  });\n' +
'  .append(ringPosRowX, ringPosRowY);\n\n' +
'  const ringAngleRow = stepperRow({\n' +
'    label: \'Ring angle\',\n' +
'    min: 0, max: 360, step: 15, value: initial.ringAngle ?? 180, unit: \'deg\',\n' +
'    onInput: (v) => cb.onRingAngle(v),\n' +
'  });\n' +
'  .append(ringAngleRow);\n';

  content = content.substring(0, startMounts) + newJs + '\n  ' + content.substring(endMounts);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Replaced Mounts JS');
} else {
  console.log('Mounts not found');
}
