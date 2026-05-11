#!/usr/bin/env node
/**
 * Enforce a per-file size budget on the client `dist/assets` output.
 *
 * Runs in CI after `vite build`. The intent is not to be exhaustive but to
 * fail loudly if someone accidentally pulls in a hefty new dependency that
 * lands in the *main* bundle. Lazy-loaded route chunks have their own
 * generous limit because the only one near the limit (BookingConfirmation)
 * pulls in jspdf + qrcode by design.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'dist', 'assets');

// Soft limit per chunk type, in kilobytes (raw, not gzipped).
const LIMITS = {
  // Main entry chunk: must stay small now that we code-split routes.
  index: 300,
  // Any other lazy chunk: 500 kB. BookingConfirmation embeds jspdf/qrcode and
  // is the one we expect to flirt with this ceiling.
  other: 500,
};

function classify(name) {
  if (/^index-.*\.js$/.test(name)) return 'index';
  return 'other';
}

async function main() {
  let files;
  try {
    files = await fs.readdir(ROOT);
  } catch (err) {
    console.error(`Could not read ${ROOT}. Did you run 'npm run build' first?`);
    process.exitCode = 1;
    return;
  }

  const jsFiles = files.filter((f) => f.endsWith('.js'));
  const offenders = [];

  for (const file of jsFiles) {
    const full = path.join(ROOT, file);
    const stat = await fs.stat(full);
    const kb = stat.size / 1024;
    const bucket = classify(file);
    const limit = LIMITS[bucket];
    const ok = kb <= limit;
    const marker = ok ? '✓' : '✗';
    console.log(
      `${marker} ${file.padEnd(48)} ${kb.toFixed(1).padStart(8)} kB  (limit ${limit} kB ${bucket})`,
    );
    if (!ok) offenders.push({ file, kb, limit });
  }

  if (offenders.length > 0) {
    console.error('\nBundle-size budget exceeded:');
    for (const o of offenders) {
      console.error(
        `  ${o.file}: ${o.kb.toFixed(1)} kB > ${o.limit} kB`,
      );
    }
    process.exitCode = 1;
    return;
  }
  console.log('\nBundle-size budget OK.');
}

main();
