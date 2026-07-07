#!/usr/bin/env node
// Regenerates src/app/shared/components/icon/icon-registry.ts from the SVG
// files in public/images/icons/. The SVG files are the single source of
// truth; run `npm run icons:generate` after adding/editing an icon.
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'images', 'icons');
const OUTPUT_FILE = path.join(
  __dirname,
  '..',
  'src',
  'app',
  'shared',
  'components',
  'icon',
  'icon-registry.ts'
);
const SUFFIX = '-icon.svg';

function toIconName(fileName) {
  return fileName.slice(0, -SUFFIX.length);
}

function cleanSvg(raw) {
  return raw
    .trim()
    .replace(/\s+width="[^"]*"/, '')
    .replace(/\s+height="[^"]*"/, '')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

const files = fs
  .readdirSync(ICONS_DIR)
  .filter((file) => file.endsWith(SUFFIX))
  .sort();

if (files.length === 0) {
  throw new Error(`No icon SVGs found in ${ICONS_DIR}`);
}

const entries = files.map((file) => ({
  name: toIconName(file),
  svg: cleanSvg(fs.readFileSync(path.join(ICONS_DIR, file), 'utf8')),
}));

const iconNameUnion = entries.map((entry) => `  | '${entry.name}'`).join('\n');
const iconsMap = entries.map((entry) => `  '${entry.name}': \`${entry.svg}\`,`).join('\n');

const output = `// GENERATED FILE - do not edit by hand.
// Source of truth: public/images/icons/*.svg
// Regenerate with \`npm run icons:generate\` after adding/editing an icon.
export type IconName =
${iconNameUnion};

export const ICONS: Record<IconName, string> = {
${iconsMap}
};
`;

fs.writeFileSync(OUTPUT_FILE, output);
console.log(`Generated ${entries.length} icons -> ${path.relative(process.cwd(), OUTPUT_FILE)}`);
