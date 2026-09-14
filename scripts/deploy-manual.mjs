import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import ghpages from 'gh-pages';

console.log('Building Hub...');
execSync('pnpm build:hub', { stdio: 'inherit' });

console.log('Building Clicker Generator...');
execSync('pnpm build:clicker', { stdio: 'inherit' });

console.log('Building Name Keychain Generator...');
execSync('pnpm build:keychain', { stdio: 'inherit' });

console.log('Building Cardless Generator...');
execSync('pnpm build:cardless', { stdio: 'inherit' });

const distPath = path.resolve('final-dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });

console.log('Copying files...');
fs.cpSync('apps/hub/dist', distPath, { recursive: true });
fs.mkdirSync(path.join(distPath, 'Clicker-Generator'), { recursive: true });
fs.cpSync('apps/clicker-generator/dist', path.join(distPath, 'Clicker-Generator'), { recursive: true });

fs.mkdirSync(path.join(distPath, 'name-keychain'), { recursive: true });
fs.cpSync('apps/name-keychain/dist', path.join(distPath, 'name-keychain'), { recursive: true });

fs.mkdirSync(path.join(distPath, 'cardless'), { recursive: true });
fs.cpSync('apps/cardless/dist', path.join(distPath, 'cardless'), { recursive: true });

// Copy CNAME
fs.writeFileSync(path.join(distPath, 'CNAME'), 'ai3dlabs.site');

// Create a dummy .gitignore to prevent the root .gitignore from ignoring .3mf files during gh-pages publish
fs.writeFileSync(path.join(distPath, '.gitignore'), '# Empty gitignore to override root\n');

console.log('Publishing to gh-pages branch...');
ghpages.publish(distPath, {
  branch: 'gh-pages',
  dotfiles: true,
  message: 'Auto-deploy via Rencana B'
}, (err) => {
  if (err) {
    console.error('Deploy failed:', err);
  } else {
    console.log('Deploy SUCCESS!');
  }
});
