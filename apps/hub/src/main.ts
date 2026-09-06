import { BRAND } from '@AI3DLabs/brand';
import { el, button, openCommercialModal, ICONS, svgEl } from '@AI3DLabs/ui-kit';
import registryData from '../../../generators.json';
import './hub.css';

// Type the imported JSON
interface GeneratorDef {
  id: string;
  name: string;
  route: 'mw' | 'app' | 'both';
  status: 'live' | 'coming-soon';
  appUrl?: string;
  mwUrl?: string;
  blurb: string;
  external?: boolean;
}

interface Registry {
  generators: GeneratorDef[];
}
const registry = registryData as Registry;

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 568.55431 524.21602" fill="none" stroke="currentColor" stroke-width="16.551" role="img" aria-label="A&I 3D Labs" class="hub-logo-svg">
  <path d="M152.519,8.276 l-73.63,203.492 l-23.352,-60.835 l51.618,-142.657 z"/>
  <path d="M61.79,8.276 l-29.606,81.823 l-23.352,-60.835 l7.594,-20.988 z"/>
  <path d="M211.523,211.768 l-64.846,-11.238 l129.584,233.565 l41.054,73.99 l31.86,-56.326 l-94.02,-220.489 l-22.185,-39.387 z"/>
  <path d="M416.035,516.21 l-38.307,-67.721 l114.773,-200.781 l-12.002,-17.182 l-168.04,18.423 l-23.466,41.487 l21.602,38.257 l129.351,-23.771 l-63.513,111.109 z"/>
  <path d="M495.836,211.768 l-40.126,-48.918 l-62.83,5.132 l16.292,-28.5 l-81.656,-115.351 l-32.338,3.546 l100.932,142.6 l67.575,-5.518 z"/>
</svg>`;

function parseSvg(raw: string): Element {
  const tpl = document.createElement('template');
  tpl.innerHTML = raw.trim();
  return tpl.content.firstElementChild!;
}

const fmt = (n: number) => $;

function buildNav(): HTMLElement {
  const logoLink = el('a', {
    className: 'hub-nav__logo',
    attrs: { href: '/', 'aria-label': 'A&I 3D Labs home' },
  });
  const logoImg = el('img', {
    attrs: { src: '/favicon-white.png', alt: 'A&I 3D Labs Logo', style: 'width: 32px; height: 32px;' }
  });
  logoLink.append(logoImg);
  logoLink.append(el('span', { className: 'hub-nav__logo-text', text: 'A&I 3D Labs' }));

  const links = el('nav', { className: 'hub-nav__links' }, [
    el('a', { className: 'hub-nav__link', text: 'Generators', attrs: { href: '#generators' } }),
    el('a', { className: 'hub-nav__link', text: 'Pricing', attrs: { href: '#licensing' } }),
  ]);

  const btn = el('button', {
    className: 'hub-btn hub-btn--primary',
    text: 'Get Commercial License',
    attrs: { type: 'button' },
  });
  btn.addEventListener('click', () => openCommercialModal());

  const rightGroup = el('div', { className: 'hub-nav__right' }, [links, btn]);

  const inner = el('div', { className: 'hub-nav__inner hub-container' }, [logoLink, rightGroup]);
  return el('header', { className: 'hub-nav' }, [inner]);
}

function buildHero(): HTMLElement {
  const eyebrow = el('p', {
    className: 'hub-hero__eyebrow',
    text: 'For Makers & Sellers',
  });

  const title = el('h1', { className: 'hub-hero__title' });
  title.innerHTML = 'Free 3D Print <em>Generators</em>';

  const sub = el('p', {
    className: 'hub-hero__sub',
    text: 'Parametric model generators for makers and sellers. Customize, download, and print. No account needed.',
  });

  return el('section', { className: 'hub-hero hub-container' }, [eyebrow, title, sub]);
}

function generatorCard(gen: GeneratorDef): HTMLElement {
  let thumbUrl = `/thumbs/${gen.id}.png`;

  const thumb = el('div', { className: 'hub-card__thumb' }, [
    el('img', { attrs: { src: thumbUrl, alt: gen.name, loading: 'lazy' } }),
  ]);

  if (gen.status === 'coming-soon') {
    thumb.append(el('div', { className: 'hub-card__badge', text: 'Coming Soon' }));
  }

  const body = el('div', { className: 'hub-card__body' }, [
    el('h3', { className: 'hub-card__name', text: gen.name }),
    el('p', { className: 'hub-card__blurb', text: gen.blurb }),
  ]);

  if (gen.status === 'coming-soon') {
    return el('article', { className: 'hub-card hub-card--disabled' }, [thumb, body]);
  } else {
    // If it's live, make the whole card clickable
    return el('a', { 
      className: 'hub-card', 
      attrs: { 
        href: gen.appUrl || '#',
        ...(gen.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})
      } 
    }, [thumb, body]);
  }
}

function buildCatalog(): HTMLElement {
  const grid = el('div', { className: 'hub-grid' });
  for (const gen of registry.generators) {
    grid.append(generatorCard(gen));
  }

  return el('section', {
    className: 'hub-section',
    attrs: { id: 'generators' },
  }, [
    el('div', { className: 'hub-container' }, [
      el('div', { className: 'hub-section__header' }, [
        el('h2', { className: 'hub-section__title', text: 'Generators' }),
        el('p', { className: 'hub-section__desc', text: 'Free for personal use.' }),
      ]),
      grid,
    ]),
  ]);
}

function pricingFeature(text: string): HTMLElement {
  const li = el('li');
  li.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>';
  li.append(document.createTextNode(text));
  return li;
}

function buildLicensing(): HTMLElement {
  const s = BRAND.pricing.subscription;

  const monthlyCard = el('div', { className: 'hub-pricing__card hub-pricing__card--featured' }, [
    el('div', { className: 'hub-pricing__discount-badge', text: '50% OFF' }),
    el('span', { className: 'hub-pricing__label', text: 'Monthly' }),
    el('div', { className: 'hub-pricing__price' }), // We'll set innerHTML below
    el('p', { className: 'hub-pricing__desc', text: 'Billed monthly' }),
    el('ul', { className: 'hub-pricing__features' }, [
      pricingFeature(`Covers ${s.covers}`),
      pricingFeature('Sell prints on Etsy, fairs, your own shop'),
      pricingFeature('Cancel anytime'),
    ]),
    el('a', {
      className: 'hub-btn hub-btn--primary',
      text: 'Get Monthly',
      attrs: { href: 'https://www.patreon.com/16745258/join', target: '_blank', rel: 'noopener noreferrer' },
    }),
  ]);
  
  // Use innerHTML for the price to render the strikethrough
  monthlyCard.querySelector('.hub-pricing__price')!.innerHTML = '$5/mo <span style="text-decoration: line-through; color: #94a3b8; font-size: 24px; vertical-align: super; margin-left: 8px;">$10/mo</span>';

  const wrap = el('div', { className: 'hub-pricing__wrap' }, [monthlyCard]);

  const freeLine = el('p', { style: 'text-align: center; color: #94a3b8; margin-top: 40px;' });
  freeLine.innerHTML = '<strong>Personal use is free.</strong> You can download and print as many models as you like. A commercial license is only required if you sell the physical prints.';

  return el('section', { className: 'hub-section', attrs: { id: 'licensing' } }, [
    el('div', { className: 'hub-container' }, [
      el('div', { className: 'hub-section__header' }, [
        el('h2', { className: 'hub-section__title', text: 'Commercial Licensing' }),
        el('p', { className: 'hub-section__desc', text: 'Sell what you print. Pick the plan that fits you best.' }),
      ]),
      wrap,
      freeLine
    ])
  ]);
}

function buildFooter(): HTMLElement {
  const copy = el('div', { className: 'hub-footer' });
  copy.innerHTML = "&copy; " + new Date().getFullYear() + " " + BRAND.name + ". All rights reserved.";
  return copy;
}

function init() {
  const app = document.getElementById('app')!;
  app.className = 'hub-page';

  app.append(
    buildNav(),
    buildHero(),
    buildCatalog(),
    buildLicensing(),
    buildFooter(),
  );

  app.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (anchor) {
      e.preventDefault();
      const id = anchor.getAttribute('href')!.slice(1);
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

init();
