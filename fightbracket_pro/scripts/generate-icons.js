import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'public/twitch-extension/assets');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#050a14"/>
  <rect x="4" y="4" width="92" height="92" rx="16" fill="#091328" stroke="#00e5ff" stroke-width="3"/>
  <path d="M 25 30 L 75 30 L 85 52 L 50 80 L 15 52 Z" fill="#ff006e" opacity="0.85" stroke="#00e5ff" stroke-width="2"/>
  <text x="50" y="52" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="28">FB</text>
  <text x="50" y="88" text-anchor="middle" dominant-baseline="central" fill="#00e5ff" font-family="Arial, sans-serif" font-weight="800" font-size="10">PRO</text>
</svg>`;

const icon24Svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="4" fill="#050a14"/>
  <rect x="1" y="1" width="22" height="22" rx="3" fill="#ff006e" stroke="#00e5ff" stroke-width="1"/>
  <text x="12" y="13" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="12">F</text>
</svg>`;

const discoverySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300">
  <rect width="600" height="300" fill="#050a14"/>
  <rect x="12" y="12" width="576" height="276" rx="24" fill="#0b152d" stroke="#00e5ff" stroke-width="4"/>
  <text x="50" y="100" fill="#00e5ff" font-family="Arial, sans-serif" font-weight="900" font-size="44" letter-spacing="4">FUNSTREAMS</text>
  <text x="50" y="150" fill="#ff006e" font-family="Arial, sans-serif" font-weight="800" font-size="22" letter-spacing="2">FIGHTBRACKET PRO EXTENSION</text>
  <text x="50" y="200" fill="#94a3b8" font-family="Arial, sans-serif" font-weight="600" font-size="16">Live Tournament Scoreboards • Tekken 8 Stats • Steam Cards</text>
</svg>`;

fs.writeFileSync(path.join(dir, 'logo-100x100.svg'), logoSvg);
fs.writeFileSync(path.join(dir, 'icon-24x24.svg'), icon24Svg);
fs.writeFileSync(path.join(dir, 'discovery-600x300.svg'), discoverySvg);

console.log('SVG extension icons generated successfully!');
