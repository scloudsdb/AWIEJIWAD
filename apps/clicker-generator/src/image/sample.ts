// Bundled sample images, shipped as static assets under public/assets/media.
// Selecting one loads the real PNG through the same path as a user upload.
import { loadUrlToImage, type RgbaImage } from './decode';
import { assetUrl } from '../assets';

const imgDir = () => assetUrl('assets/media/images/');

export interface SampleInfo {
  name: string;
  /** Thumbnail / preview URL (the asset itself). */
  readonly src: string;
  /** Decode the asset into an RgbaImage for the pipeline. */
  load: () => Promise<RgbaImage>;
}

/**
 * `src` is a getter, not a string, and that is load-order rather than style.
 *
 * `SAMPLES` is built when this module is first imported. `mount()` sets the asset base
 * after that — it cannot run earlier, because it is the thing doing the importing. A plain
 * string would therefore capture the web default, and inside a desktop host every sample
 * would point at a path that does not exist there. Reading it at use time is what makes the
 * base the caller sets actually apply.
 */
function imageSample(file: string, name: string): SampleInfo {
  return {
    name,
    get src() { return imgDir() + file; },
    load: () => loadUrlToImage(imgDir() + file),
  };
}

export const SAMPLES: SampleInfo[] = [
  imageSample('ai3dlabs.png', 'A & I 3D Labs'),
  imageSample('rocket.svg', 'Rocket'),
  imageSample('coffee.svg', 'Coffee'),
  imageSample('gamepad.svg', 'Gamepad'),
  imageSample('crown.svg', 'Crown'),
  imageSample('diamond.svg', 'Diamond'),
];

// Bundled vector samples, surfaced as ready-to-use presets in the SVG panel.
const iconDir = () => assetUrl('icons/');

export interface SvgSampleInfo {
  name: string;
  readonly src: string;
}

export const SVG_SAMPLES: SvgSampleInfo[] = [
  // Same getter, same reason as above.
  { name: 'Bambu Lab', get src() { return iconDir() + 'bambulab.svg'; } },
  { name: 'Discord', get src() { return iconDir() + 'discord.svg'; } },
  { name: 'Gmail', get src() { return iconDir() + 'gmail.svg'; } },
  { name: 'Google', get src() { return iconDir() + 'google.svg'; } },
  { name: 'Chrome', get src() { return iconDir() + 'googlechrome.svg'; } },
  { name: 'Drive', get src() { return iconDir() + 'googledrive.svg'; } },
  { name: 'Sheets', get src() { return iconDir() + 'googlesheets.svg'; } },
  { name: 'Instagram', get src() { return iconDir() + 'instagram.svg'; } },
  { name: 'Twitch', get src() { return iconDir() + 'twitch.svg'; } },
  { name: 'X', get src() { return iconDir() + 'x.svg'; } },
  { name: 'YouTube', get src() { return iconDir() + 'youtube.svg'; } },
];
