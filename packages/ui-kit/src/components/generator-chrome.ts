import { el } from '../dom';
import { ICONS, svgEl } from '../icons';
import { isDesktop } from '../host-env';

/* Shared chrome for every AI3DLabs generator so they all look the same: a header
   (name + description + "Made by A&I 3D Labs"), an optional dismissable quality
   callout, and the Save / Load / Help / Light-mode action block under the export
   button. Modelled on the shipped clicker app, sized on the ui-kit token scale. */

export interface GeneratorHeaderOptions {
  /** Generator name, e.g. "Name Keychain Generator". */
  title: string;
  /** One-line description under the title. */
  description: string;
  /** Where "Made by A&I 3D Labs" links (default: the MakerWorld profile). */
  madeByUrl?: string;
  /** Whether to hide the "Made by A&I 3D Labs" credit. */
  hideCredit?: boolean;
}

/** Description + "Made by A & I 3D Labs" - the top of every generator sidebar. */
export function generatorHeader(opts: GeneratorHeaderOptions): HTMLElement {
  const children: HTMLElement[] = [
    el('p', { className: 'vl-app-subtitle', text: opts.description }),
  ];

  if (!opts.hideCredit && !isDesktop()) {
    children.push(el('p', { className: 'vl-app-credit' }, [document.createTextNode('Made by A & I 3D Labs')]));
  }

  return el('div', { className: 'vl-app-header' }, children);
}

export interface QualityCalloutOptions {
  /** Callout body as HTML (links allowed). Use this or `text`. */
  html?: string;
  /** Callout body as plain text. */
  text?: string;
  /** localStorage key so a dismiss sticks across visits. Omit = not dismissable. */
  storageKey?: string;
}

/**
 * The "for best print quality…" info callout that sits under the header. Pass a
 * storageKey to make it dismissable (an × that hides it and remembers). Returns
 * null when it was previously dismissed, so callers can `if (c) parent.append(c)`.
 */
export function qualityCallout(opts: QualityCalloutOptions): HTMLElement | null {
  if (opts.storageKey) {
    try { if (localStorage.getItem(opts.storageKey) === 'dismissed') return null; } catch { /* ignore */ }
  }

  const body = el('div', { className: 'vl-callout__body' });
  if (opts.html) body.innerHTML = opts.html;
  else body.textContent = opts.text ?? '';

  const root = el('div', { className: 'vl-callout' }, [svgEl(ICONS.info), body]);

  if (opts.storageKey) {
    const dismiss = el('button', {
      className: 'vl-callout__dismiss',
      text: '×',
      attrs: { type: 'button', 'aria-label': 'Dismiss' },
    });
    dismiss.addEventListener('click', () => {
      try { localStorage.setItem(opts.storageKey!, 'dismissed'); } catch { /* ignore */ }
      root.remove();
    });
    root.append(dismiss);
  }
  return root;
}

function actionBtn(label: string, icon: string | null, onClick: () => void, title?: string): HTMLButtonElement {
  const btn = el('button', {
    className: 'vl-btn vl-btn--secondary vl-action-btn',
    attrs: title ? { type: 'button', title } : { type: 'button' },
  }) as HTMLButtonElement;
  if (icon) btn.append(svgEl(icon));
  btn.append(el('span', { text: label }));
  btn.addEventListener('click', onClick);
  return btn;
}

export interface ProjectActionsOptions {
  /** Serialize + download the current project. */
  onSave: () => void;
  /** Load a project file the user picked (or undefined if desktop native picker should be used). */
  onLoad: (file?: File) => void;
  /** Show the help/intro. Omit to hide the Help button. */
  onHelp?: () => void;
  /** Include the light/dark toggle (default true). */
  theme?: boolean;
  /** localStorage key for the theme toggle. */
  themeStorageKey?: string;
  /**
   * The host draws Save and Open itself, so this block must not.
   *
   * Pass `Boolean(host?.registerProject)` — not `isDesktop()`. The two are different
   * questions: a desktop host that has not implemented project ownership still needs these
   * buttons, and inferring one from the other is how a generator ends up with no way to
   * save at all. Explicit, so every combination is correct rather than assumed.
   */
  hostOwnsProjects?: boolean;
}

/**
 * The Save project / Load project / Help / Light-mode block that sits under the
 * export button. One row of short-labelled buttons, matching the clicker.
 *
 * With `hostOwnsProjects` the first row is gone and only Help (and, on the web, the theme
 * toggle) remains — the block collapses to what the host is not already providing rather
 * than disappearing, because Help is the generator's own and nobody else can draw it.
 */
export function projectActions(opts: ProjectActionsOptions): HTMLElement {
  const fileInput = el('input', {
    attrs: { type: 'file', accept: 'application/json', hidden: '' },
  }) as HTMLInputElement;
  fileInput.addEventListener('change', () => {
    const f = fileInput.files?.[0];
    if (f) opts.onLoad(f);
    fileInput.value = '';
  });

  /* ONE row. Save / Load on one line and Help / Light mode on another spent two rows of the
     sidebar's fixed footer on four small actions, and the footer's height is taken straight
     out of the settings above it. Short labels ("Save", not "Save project") are what let
     three or four buttons share a 293 px line; the full name lives in the tooltip. */
  const save = actionBtn('Save', ICONS.save, () => opts.onSave(), 'Save project');
  const load = actionBtn('Load', ICONS.load, () => {
    if (isDesktop()) {
      opts.onLoad();
    } else {
      fileInput.click();
    }
  }, 'Load project');

  const row: (HTMLElement | Node)[] = [];
  if (!opts.hostOwnsProjects) row.push(save, load, fileInput);
  if (opts.onHelp) row.push(actionBtn('Help', ICONS.help, () => opts.onHelp!()));
  // The bottom theme toggle was removed because we already have one in the top bar.

  return el('div', { className: 'vl-project-actions' }, row.length ? [el('div', { className: 'vl-action-row' }, row)] : []);
}
