const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@expo',
  'cli',
  'build',
  'src',
  'run',
  'ios',
  'appleDevice',
  'client',
  'AFCClient.js'
);

if (!fs.existsSync(targetFile)) {
  console.warn(`[patch-expo-cli] Skipping patch: ${targetFile} not found.`);
  process.exit(0);
}

const originalSnippet = `function toCString(s) {
    const buf = Buffer.alloc(s.length + 1);
    const len = buf.write(s);
    buf.writeUInt8(0, len);
    return buf;
}`;

const patchedSnippet = `function toCString(s) {
    const byteLength = Buffer.byteLength(s);
    const buf = Buffer.alloc(byteLength + 1);
    buf.write(s, 0, byteLength, "utf8");
    buf.writeUInt8(0, byteLength);
    return buf;
}`;

const fileContents = fs.readFileSync(targetFile, 'utf8');

if (fileContents.includes(patchedSnippet)) {
  console.log('[patch-expo-cli] Patch already applied.');
  process.exit(0);
}

if (!fileContents.includes(originalSnippet)) {
  console.warn('[patch-expo-cli] Original snippet not found. Please verify the CLI version.');
  process.exit(1);
}

const updated = fileContents.replace(originalSnippet, patchedSnippet);
fs.writeFileSync(targetFile, updated);
console.log('[patch-expo-cli] Successfully patched AFCClient toCString implementation.');
