import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import ghpages from 'gh-pages';

// ── URL mapping (obscured folder names) ─────────────────────────────────────
//   clicker-generator  → /cg/
//   name-keychain      → /kc/
//   cardless           → /ch/
//   admin              → /admin/
// ────────────────────────────────────────────────────────────────────────────

console.log('Building Hub...');
execSync('pnpm build:hub', { stdio: 'inherit' });

console.log('Building Clicker Generator...');
execSync('pnpm build:clicker', { stdio: 'inherit' });

console.log('Building Name Keychain Generator...');
execSync('pnpm build:keychain', { stdio: 'inherit' });

console.log('Building Cardless Generator...');
execSync('pnpm build:cardless', { stdio: 'inherit' });

console.log('Building Admin Panel...');
execSync('pnpm build:admin', { stdio: 'inherit' });

const distPath = path.resolve('final-dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });

console.log('Copying files...');

// Hub (root landing page)
fs.cpSync('apps/hub/dist', distPath, { recursive: true });

// Tools — obscured folder names
fs.mkdirSync(path.join(distPath, 'cg'), { recursive: true });
fs.cpSync('apps/clicker-generator/dist', path.join(distPath, 'cg'), { recursive: true });

fs.mkdirSync(path.join(distPath, 'kc'), { recursive: true });
fs.cpSync('apps/name-keychain/dist', path.join(distPath, 'kc'), { recursive: true });

fs.mkdirSync(path.join(distPath, 'ch'), { recursive: true });
fs.cpSync('apps/cardless/dist', path.join(distPath, 'ch'), { recursive: true });

// Admin panel
fs.mkdirSync(path.join(distPath, 'admin'), { recursive: true });
fs.cpSync('apps/admin/dist', path.join(distPath, 'admin'), { recursive: true });

// CNAME
fs.writeFileSync(path.join(distPath, 'CNAME'), 'ai3dlabs.site');

// Empty gitignore so gh-pages doesn't skip .3mf files
fs.writeFileSync(path.join(distPath, '.gitignore'), '# Empty gitignore to override root\n');

console.log('Publishing to gh-pages branch...');
ghpages.publish(distPath, {
  branch: 'gh-pages',
  dotfiles: true,
  add: true,
  message: 'deploy: revamp landing page + admin panel',
}, (err) => {
  if (err) {
    console.error('Deploy failed:', err);
    process.exit(1);
  } else {
    console.log('Deploy SUCCESS!');
  }
});
