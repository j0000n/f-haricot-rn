'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');

function isBinary(buffer) {
  return buffer.includes(0);
}

function detectEol(text) {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

function normalizeText(text) {
  const eol = detectEol(text);
  const lines = text.split(/\r?\n/);
  const trimmed = lines.map((line) => line.replace(/[ \t]+$/u, ''));

  while (trimmed.length > 0 && trimmed[trimmed.length - 1] === '') {
    trimmed.pop();
  }

  if (trimmed.length === 0) {
    return '';
  }

  return `${trimmed.join(eol)}${eol}`;
}

function processFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (isBinary(buffer)) {
    return;
  }

  const original = buffer.toString('utf8');
  const normalized = normalizeText(original);

  if (normalized !== original) {
    fs.writeFileSync(filePath, normalized, 'utf8');
  }
}

function processTrackedFiles() {
  return new Promise((resolve, reject) => {
    const child = spawn('git', ['ls-files', '-z']);
    let buffer = Buffer.alloc(0);

    child.stdout.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      let index = buffer.indexOf(0);

      while (index !== -1) {
        const filePath = buffer.slice(0, index).toString('utf8');
        if (filePath) {
          processFile(filePath);
        }
        buffer = buffer.slice(index + 1);
        index = buffer.indexOf(0);
      }
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (buffer.length > 0) {
        processFile(buffer.toString('utf8'));
      }
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`git ls-files exited with ${code}`));
    });
  });
}

processTrackedFiles().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
