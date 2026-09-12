const fs = require('fs');
const path = 'apps/logo-keychain/src/ui/ui.ts';
let content = fs.readFileSync(path, 'utf8');

const startIdx = content.indexOf('<div id="geometrySettingsContainer">');
const endIdx = content.indexOf('</details>', content.indexOf('id="sectionSwitch"')) + 10;

if (startIdx !== -1 && endIdx !== -1) {
  const newHtml = '<div id="geometrySettingsContainer">\n' +
        '  <details class="vl-section vl-section--collapsible" id="sectionBodyFit" open>\n' +
        '    <summary>Base &amp; Thickness</summary>\n' +
        '    <div class="vl-section__body">\n' +
        '      <div class="prow-stacked"><div id="topthickMount"></div></div>\n' +
        '      <div class="prow-stacked"><div id="imgdepthMount"></div></div>\n' +
        '      <div class="prow-stacked" style="margin-top: 12px; margin-bottom: 8px;"><div id="flushMount"></div></div>\n' +
        '    </div>\n' +
        '  </details>\n\n' +
        '  <details class="vl-section vl-section--collapsible" id="sectionRing" open>\n' +
        '    <summary>Keychain Ring</summary>\n' +
        '    <div class="vl-section__body">\n' +
        '      <div class="prow-stacked"><div id="ringStyleMount"></div></div>\n' +
        '      <div class="prow-stacked"><div id="holeDiaMount"></div></div>\n' +
        '      <div class="prow-stacked"><div id="ringThickMount"></div></div>\n' +
        '      <div class="prow-stacked"><div id="ringPosMount"></div></div>\n' +
        '      <div class="prow-stacked"><div id="ringAngleMount"></div></div>\n' +
        '    </div>\n' +
        '  </details>';
  content = content.substring(0, startIdx) + newHtml + content.substring(endIdx);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Replaced HTML');
} else {
  console.log('Not found');
}
