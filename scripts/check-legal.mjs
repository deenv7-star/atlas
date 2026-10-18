#!/usr/bin/env node
/** Lists the business / legal details still missing in src/config/legal.js (rendered as {{KEY}} on the site). */
import { LEGAL, REQUIRED_FOR_LAUNCH } from '../src/config/legal.js';

const missing = REQUIRED_FOR_LAUNCH.filter((k) => LEGAL[k] === null || LEGAL[k] === undefined || LEGAL[k] === '');
const optional = Object.keys(LEGAL).filter((k) => !REQUIRED_FOR_LAUNCH.includes(k) && (LEGAL[k] === null || LEGAL[k] === ''));
if (!missing.length) console.log('All required legal details are filled in.');
else {
  console.log(`Missing before the legal pages go live (${missing.length}):`);
  missing.forEach((k) => console.log(`  - ${k}`));
}
if (optional.length) console.log(`Optional, still empty: ${optional.join(', ')}`);
process.exitCode = process.argv.includes('--strict') && missing.length ? 1 : 0;
