import { themeCheckRun } from '@shopify/theme-check-node';
import path from 'node:path';
const root = path.resolve(process.argv[2] || 'theme');
const { offenses } = await themeCheckRun(root);
const sev = ['error', 'warning', 'info'];
for (const o of offenses) {
  console.log(`${sev[o.severity]} ${o.check} ${path.relative(root, o.uri.replace('file://', ''))}:${o.start.line + 1} ${o.message}`);
}
console.log(`offenses: ${offenses.length}`);
