import { BRAND } from '@AI3DLabs/brand';
import { el } from '../dom';
import { ICONS, svgEl } from '../icons';
import { themeToggleButton } from './theme';
import { isDesktop, renderNothing } from '../host-env';

export interface TopbarLinksOptions {
  /** The application title to display on the left side of the topbar. */
  appTitle?: string;
  /** This app's GitHub repo (defaults to the org). */
  githubUrl?: string;
  /** This generator's own donation link. Omit to fall back to the central donate link. */
  donateUrl?: string;
  /** Add a light/dark theme toggle button. It flips <html data-theme> and
   *  persists the choice; observe data-theme in the app to re-theme the viewer. */
  themeToggle?: boolean;
  /** localStorage key used by the theme toggle (default 'vl-theme'). */
  themeStorageKey?: string;
}

function linkBtn(
  variant: '' | 'license' | 'mw' | 'kofi',
  icon: string,
  label: string,
  href: string,
): HTMLAnchorElement {
  const a = el('a', {
    className: `vl-topbar-btn${variant ? ` vl-topbar-btn--${variant}` : ''}`,
    attrs: { href, target: '_blank', rel: 'noopener noreferrer' },
  });
  a.append(svgEl(icon), label);
  return a;
}


import { openCommercialModal } from './license';

function actionBtn(
  variant: '' | 'license' | 'mw' | 'kofi',
  icon: string,
  label: string,
  onClick: () => void,
): HTMLButtonElement {
  const b = el('button', {
    className: `vl-topbar-btn${variant ? ` vl-topbar-btn--${variant}` : ''}`,
    attrs: { type: 'button' },
  });
  b.append(svgEl(icon), label);
  b.addEventListener('click', onClick);
  return b as HTMLButtonElement;
}

/** The updated topbar: title on the left, Support & License on the right. */
export function topbarLinks(opts: TopbarLinksOptions = {}): HTMLElement {
  // The host app owns its own chrome; a second nav bar inside it is noise.
  if (isDesktop()) return renderNothing();
  const rightGroup = el('div', { className: 'vl-topbar-group' }, [
    actionBtn('license', ICONS.license, 'Get the commercial license', () => openCommercialModal()),
    linkBtn('mw', ICONS.zap, 'Support me', opts.donateUrl ?? BRAND.urls.donate),
  ]);

  if (opts.themeToggle) {
    rightGroup.append(themeToggleButton({
      storageKey: opts.themeStorageKey ?? 'vl-theme',
      className: 'vl-topbar-btn vl-topbar-btn--theme',
    }));
  }

  const leftGroup = el('div', { className: 'vl-topbar-group' }, [
    ...(opts.appTitle ? [el('div', { className: 'vl-topbar-title', text: opts.appTitle, attrs: { style: 'font-weight: 800; font-size: 20px; padding-left: 16px; color: #fff; letter-spacing: 0.5px;' } })] : []),
  ]);

  return el('header', { className: 'vl-topbar' }, [
    leftGroup,
    rightGroup,
  ]);
}
