const fs = require('fs');

// Patch 1: types.ts
{
  const path = 'apps/clicker-generator/src/types.ts';
  let content = fs.readFileSync(path, 'utf8');
  if (!content.includes('noSwitch?: boolean')) {
    content = content.replace(
      /export interface BuildParams \{/,
      `export interface BuildParams {
    noSwitch?: boolean;`
    );
    fs.writeFileSync(path, content);
    console.log('types.ts patched');
  }
}

// Patch 2: ui.ts
{
  const path = 'apps/clicker-generator/src/ui/ui.ts';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(
    /capProud: number;/,
    `capProud: number;
    noSwitch: boolean;`
  );
  content = content.replace(
    /onCapProud\(mm: number\): void;/,
    `onCapProud(mm: number): void;
    onNoSwitch(on: boolean): void;`
  );
  content = content.replace(
    /const hollowToggle = toggleSwitch\(\{/,
    `const nametagToggle = toggleSwitch({
      label: 'Photo Nametag (No Switch)',
      help: 'Prints a solid keychain without the mechanical switch hole.',
      checked: initial.noSwitch,
      onChange: (v) => cb.onNoSwitch(v),
    });
    $('hollowMount').parentElement.insertBefore(nametagToggle, $('hollowMount'));

    const hollowToggle = toggleSwitch({`
  );
  content = content.replace(
    /hollowToggle\.setValue\(state\.hollowBase\);/,
    `hollowToggle.setValue(state.hollowBase);
      nametagToggle.setValue(state.noSwitch);
      
      // Hide irrelevant settings if noSwitch is active
      if (state.noSwitch) {
        hollowToggle.hidden = true;
        capProudRow.hidden = true;
        toleranceRow.hidden = true;
        stemFitRow.hidden = true;
        socketFitRow.hidden = true;
        $('advancedSettingsBlock').hidden = true;
      } else {
        hollowToggle.hidden = false;
        capProudRow.hidden = false;
        toleranceRow.hidden = false;
        stemFitRow.hidden = false;
        socketFitRow.hidden = false;
        $('advancedSettingsBlock').hidden = false;
      }`
  );
  fs.writeFileSync(path, content);
  console.log('ui.ts patched');
}

// Patch 3: mount.ts
{
  const path = 'apps/clicker-generator/src/mount.ts';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(
    /hollowBase: false,/,
    `hollowBase: false,
      noSwitch: false,`
  );
  content = content.replace(
    /onHollowBase: \(on\) => store\.set\(\{ hollowBase: on \}\),/,
    `onHollowBase: (on) => store.set({ hollowBase: on }),
      onNoSwitch: (on) => store.set({ noSwitch: on }),`
  );
  content = content.replace(
    /hollowBase: s\.hollowBase,/,
    `hollowBase: s.hollowBase,
      noSwitch: s.noSwitch,`
  );
  // Also we need to make sure the Project export saves and loads it
  content = content.replace(
    /hollowBase: e\.hollowBase \?\? false,/,
    `hollowBase: e.hollowBase ?? false,
          noSwitch: e.noSwitch ?? false,`
  );
  // and clickerProject()
  content = content.replace(
    /hollowBase: st\.hollowBase,/,
    `hollowBase: st.hollowBase,
    noSwitch: st.noSwitch,`
  );
  fs.writeFileSync(path, content);
  console.log('mount.ts patched');
}
