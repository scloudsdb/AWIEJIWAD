// Single source of truth for every A&I 3D Labs URL, price, and license string.
// Rule: NOTHING in any app hardcodes these - always import from @AI3DLabs/brand.
// A price or link change is one edit here.

export const BRAND = {
  name: 'A&I 3D Labs',
  urls: {
    hub: 'https://ai3dlabs.github.io',
    donate: 'https://www.patreon.com/16745258/join',
    kofi: 'https://ko-fi.com/ai3dlabs',
    makerworld: 'https://makerworld.com/en/@AI3DLabs_Labs',
    commercialLicense: 'https://www.patreon.com/16745258/join',
    github: 'https://github.com/ai3dlabs',
    clickerApp: 'https://ai3dlabs.github.io/Clicker-Generator/',
    clickerListing: 'https://makerworld.com/en/models/2980346',
    keycapApp: 'https://ai3dlabs.github.io/SVG-keycap-generator/',
    keycapListing: 'https://makerworld.com/en/models/2959969',
    licenseTerms: 'TODO_LICENSE_PAGE_URL',
  },
  pricing: {
    currency: 'USD',
    subscription: {
      month: 5,
      quarter: 20,
      year: 50,
      covers: 'the entire catalog',
      note: 'valid while the membership is active',
    },
    lifetime: {
      one: 70,
      three: 150, // unused
      twelve: 500, // unused
      covers: 'the entire catalog',
      note: 'one-time payment, yours forever',
    },
  },
  freeTierLine:
    'Free for personal use. Selling prints requires a commercial license.',
} as const;

export type Brand = typeof BRAND;
