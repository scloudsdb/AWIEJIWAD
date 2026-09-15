const fs = require('fs');
const path = require('path');

const uiPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'ui', 'ui.ts');
const mountPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'mount.ts');
const geoPath = path.join('E:', 'Project', 'Website Clicker v2', 'apps', 'cardless', 'src', 'geometry', 'buildCardHolder.ts');

// --- 1. Patch UI ---
let uiCode = fs.readFileSync(uiPath, 'utf8');
if (!uiCode.includes('standUpPreview: boolean;')) {
    uiCode = uiCode.replace(/export interface UiState \{/, 'export interface UiState {\n  standUpPreview: boolean;\n  backLogo: boolean;');
    uiCode = uiCode.replace(/export interface UiCallbacks \{/, 'export interface UiCallbacks {\n  onStandUpPreview(v: boolean): void;\n  onBackLogo(v: boolean): void;');
    
    // Add toggles
    const toggleCode = `
  const standUpToggle = toggle({
    label: 'Stand Up Preview',
    checked: initial.standUpPreview,
    onChange: (v) => cb.onStandUpPreview(v),
  });
  $('baseShapeMount').after(standUpToggle);
  
  const backLogoToggle = toggle({
    label: 'Logo on Back',
    help: 'Adds the same image/emboss to the back cover.',
    checked: initial.backLogo,
    onChange: (v) => cb.onBackLogo(v),
  });
  $('imgdepthMount').after(backLogoToggle);
`;
    // Insert after 'hollowBaseToggle' or similar. We can just insert right before `// --- Import mode tabs ---`
    uiCode = uiCode.replace(/\/\/ --- Import mode tabs ---/, toggleCode + '\n  // --- Import mode tabs ---');
    
    // update() function logic
    const updateLogic = `
    standUpToggle.setValue(state.standUpPreview);
    backLogoToggle.setValue(state.backLogo);
`;
    uiCode = uiCode.replace(/importTabsCtl\.setValue\(state\.importMode\);/, updateLogic + '\n    importTabsCtl.setValue(state.importMode);');
    
    fs.writeFileSync(uiPath, uiCode);
}

// --- 2. Patch Mount ---
let mountCode = fs.readFileSync(mountPath, 'utf8');
if (!mountCode.includes('standUpPreview: false')) {
    mountCode = mountCode.replace(/export const DEFAULT_UI_STATE: UiState = \{/, 'export const DEFAULT_UI_STATE: UiState = {\n  standUpPreview: false,\n  backLogo: false,');
    
    // add to generatorParams
    mountCode = mountCode.replace(/tolerance: s\.tolerance,/, 'tolerance: s.tolerance,\n        standUpPreview: s.standUpPreview,\n        backLogo: s.backLogo,');
    
    // add to UiCallbacks implementation
    mountCode = mountCode.replace(/onHollowBase: \(v\) => store\.set\(\{ hollowBase: v \}\),/, 'onHollowBase: (v) => store.set({ hollowBase: v }),\n      onStandUpPreview: (v) => store.set({ standUpPreview: v }),\n      onBackLogo: (v) => store.set({ backLogo: v }),');
    
    fs.writeFileSync(mountPath, mountCode);
}

// --- 3. Patch Geometry ---
let geoCode = fs.readFileSync(geoPath, 'utf8');
if (!geoCode.includes('standUpPreview')) {
    const backLogoCode = `
    if (allLogos) {
      lidSol = keep(lidSol.subtract(allLogos));
      if (params.backLogo) {
        // Mirror along Y so it appears correct when flipped over horizontally
        let backLogo = keep(allLogos.scale([-1, 1, 1]));
        // Translate to the bottom of the base
        backLogo = keep(backLogo.translate([0, 0, -trayH]));
        backShellSol = keep(backShellSol.subtract(backLogo));
      }
    }
`;
    // Replace the existing logo subtraction
    geoCode = geoCode.replace(/if \(allLogos\) \{\s*\/\/ Cut the logo out of the lid.*?\n\s*lidSol = keep\(lidSol\.subtract\(allLogos\)\);\s*\}/s, backLogoCode);
    
    // Add standUp rotation before creating finalParts array
    // We can just iterate over finalParts after it's populated and rotate them, or rotate lidSol/backShellSol before pushing.
    // It's safer to rotate lidSol and backShellSol just before they are pushed.
    const rotateCode = `
    if (params.standUpPreview) {
      // Rotate 90 degrees around X to stand it upright, and translate it up so it rests on Z=0
      // The box is centered on X=0, Y=0. Length along Y is outerH.
      // So bottom edge is at Y = -outerH/2. After rotation [90,0,0], the bottom edge is at Z = outerH/2.
      lidSol = keep(lidSol.rotate([90, 0, 0]).translate([0, 0, outerH/2]));
      backShellSol = keep(backShellSol.rotate([90, 0, 0]).translate([0, 0, outerH/2]));
    }
    `;
    geoCode = geoCode.replace(/const bodyRgb: \[number, number, number\] = params\.bodyColorRgb \?\? \[220, 220, 220\];/, rotateCode + '\n    const bodyRgb: [number, number, number] = params.bodyColorRgb ?? [220, 220, 220];');
    
    fs.writeFileSync(geoPath, geoCode);
}

console.log('Successfully added standUpPreview and backLogo features!');
