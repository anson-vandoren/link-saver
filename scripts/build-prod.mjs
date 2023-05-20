import fs from 'fs';
import path from 'path';
import * as esbuild from 'esbuild';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const WWW_OUT_DIR = path.join(__dirname, '..', 'www');

console.log('Cleaning www/ ...');
if (fs.existsSync(WWW_OUT_DIR)) {
  fs.rmSync(WWW_OUT_DIR, { recursive: true });
}
fs.mkdirSync(WWW_OUT_DIR);

// copy all HTML and CSS files from ui/ to www/
console.log('Copying HTML and CSS files ...');
const files = fs.readdirSync(path.join(__dirname, '..', 'ui'));
for (const file of files) {
  if (file.endsWith('.html') || file.endsWith('.css')) {
    fs.copyFileSync(path.join(__dirname, '..', 'ui', file), path.join(WWW_OUT_DIR, file));
  }
}

await esbuild.build({
  entryPoints: ['ui/js/index.ts'],
  bundle: true,
  outfile: 'www/js/bundle.js',
  minify: true,
});
