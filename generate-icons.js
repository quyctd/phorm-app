const fs = require('node:fs');
const path = require('node:path');

// Create a simple favicon.ico placeholder
const faviconContent = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="4" fill="#3B82F6"/>
  <circle cx="16" cy="16" r="8" fill="white"/>
  <circle cx="13" cy="13" r="1" fill="#3B82F6"/>
  <circle cx="19" cy="13" r="1" fill="#3B82F6"/>
  <path d="M13 19C13 19.5523 13.4477 20 14 20H18C18.5523 20 19 19.5523 19 19" stroke="#3B82F6" stroke-width="1" stroke-linecap="round"/>
</svg>`;

// Create apple-touch-icon (180x180)
const appleTouchIconContent = `<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" rx="22" fill="#3B82F6"/>
  <path d="M90 45C105.464 45 118 57.536 118 73V107C118 122.464 105.464 135 90 135C74.536 135 62 122.464 62 107V73C62 57.536 74.536 45 90 45Z" fill="white"/>
  <circle cx="79" cy="79" r="6" fill="#3B82F6"/>
  <circle cx="101" cy="79" r="6" fill="#3B82F6"/>
  <path d="M79 101C79 105.418 82.582 109 87 109H93C97.418 109 101 105.418 101 101" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
  <rect x="45" y="34" width="90" height="11" rx="6" fill="white"/>
  <rect x="45" y="146" width="90" height="11" rx="6" fill="white"/>
</svg>`;

// Create masked-icon.svg
const maskedIconContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M256 128C300.183 128 336 163.817 336 208V304C336 348.183 300.183 384 256 384C211.817 384 176 348.183 176 304V208C176 163.817 211.817 128 256 128Z" fill="black"/>
  <circle cx="224" cy="224" r="16" fill="white"/>
  <circle cx="288" cy="224" r="16" fill="white"/>
  <path d="M224 288C224 299.046 233.954 308 245 308H267C278.046 308 288 299.046 288 288" stroke="white" stroke-width="8" stroke-linecap="round"/>
  <rect x="128" y="96" width="256" height="32" rx="16" fill="black"/>
  <rect x="128" y="416" width="256" height="32" rx="16" fill="black"/>
</svg>`;

// Write the files
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.svg'), faviconContent);
fs.writeFileSync(path.join(__dirname, 'public', 'apple-touch-icon.svg'), appleTouchIconContent);
fs.writeFileSync(path.join(__dirname, 'public', 'masked-icon.svg'), maskedIconContent);

console.log('✅ Generated PWA icons successfully!');
console.log('📝 Note: These are placeholder SVG icons. For production, you should:');
console.log('   1. Create proper PNG icons (192x192, 512x512) for better compatibility');
console.log('   2. Use a tool like https://realfavicongenerator.net/ for comprehensive icon generation');
console.log('   3. Replace the placeholder icons with your actual app design');