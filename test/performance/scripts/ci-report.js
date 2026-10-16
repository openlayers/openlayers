#! /usr/bin/env node
import fs from 'fs/promises';
import {formatMarkdown, toBenchmarkAction} from '../shared/report.js';

const [reportPath, baselinePath, actionPath] = process.argv.slice(2);
if (!reportPath || !actionPath) {
  throw new Error(
    'usage: ci-report.js REPORT [BASELINE|-] BENCHMARK_ACTION_OUTPUT',
  );
}

const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
let baseline = null;
if (baselinePath && baselinePath !== '-') {
  try {
    baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'ENOENT') {
      throw error;
    }
  }
}
await fs.writeFile(
  actionPath,
  JSON.stringify(toBenchmarkAction(report), null, 2),
);
console.log(formatMarkdown(report, baseline)); // eslint-disable-line no-console
