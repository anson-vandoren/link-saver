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

// build backend

const SERVER_OUT_DIR = path.join(__dirname, '..', 'dist');
console.log('Cleaning dist/ ...');
if (fs.existsSync(SERVER_OUT_DIR)) {
  fs.rmSync(SERVER_OUT_DIR, { recursive: true });
}
fs.mkdirSync(SERVER_OUT_DIR);

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  minify: true,
  outfile: 'dist/index.cjs',
});

const NATIVE_MODULE_DIR = path.join(__dirname, '..', 'build'); // _shrug_ that's where node will look
if (!fs.existsSync(NATIVE_MODULE_DIR)) {
  fs.mkdirSync(NATIVE_MODULE_DIR);
}

// copy native node modules
console.log('Copying native node modules ...');
// better-sqlite3
fs.copyFileSync(
  path.join(__dirname, '..', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'),
  path.join(NATIVE_MODULE_DIR, 'better_sqlite3.node'),
);

