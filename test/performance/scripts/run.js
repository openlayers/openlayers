#! /usr/bin/env node
/**
 * Headless runner for the performance cases.
 *
 *   node test/performance/scripts/run.js --out base.json
 *   node test/performance/scripts/run.js --out head.json
 *   node test/performance/scripts/run.js --compare base.json head.json
 *
 * Each case gets one discarded warm-up flight followed by several measured
 * flights.
 */
import fs from 'fs/promises';
import path, {dirname} from 'path';
import {chromium} from 'playwright';
import {fileURLToPath} from 'url';
import {createServer} from 'vite';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import viteConfig from '../config/vite.config.js';
import {
  createReport,
  percentChange,
  REPORT_METRICS,
  summarizeRuns,
  validateReport,
} from '../shared/report.js';

const baseDir = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * @param {...*} args Values to print.
 */
function log(...args) {
  console.log(...args); // eslint-disable-line no-console
}

/**
 * @param {...*} args Values to print.
 */
function logError(...args) {
  console.error(...args); // eslint-disable-line no-console
}

/**
 * @return {Promise<Array<string>>} Case names, from `cases/*.js`.
 */
async function listCases() {
  const names = (await fs.readdir(path.join(baseDir, 'cases')))
    .filter((name) => name.endsWith('.js'))
    .map((name) => name.slice(0, -3))
    .sort();
  if (!names.length) {
    throw new Error('no benchmark cases found');
  }
  return names;
}

/**
 * @param {Object} options Options.
 * @return {Promise<{url: string, close: function(): Promise<void>}>} Server.
 */
async function serve(options) {
  const server = await createServer({
    ...viteConfig,
    configFile: false,
    logLevel: 'error',
    // Bind IPv4 explicitly: with `localhost` the dev server only listens on
    // ::1, which the browser cannot reach at 127.0.0.1.
    server: {host: '127.0.0.1', port: options.port, strictPort: false},
  });
  await server.listen();
  const address = server.httpServer?.address();
  const port =
    address && typeof address === 'object' ? address.port : options.port;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => server.close(),
  };
}

/**
 * @param {import('playwright').Page} page Page.
 * @param {string} url Page URL.
 * @param {Object} options Options.
 * @param {string} caseName Case name.
 * @return {Promise<string|undefined>} Unavailable reason.
 */
async function openCase(page, url, options, caseName) {
  const query = new URLSearchParams({
    case: caseName,
    projection: options.projection,
    features: String(options.features),
    vertices: String(options.vertices),
    frames: String(options.frames),
    warmup: String(options.warmup),
    displayHz: String(options.displayHz),
    autorun: 'false',
  });
  await page.goto(`${url}/?${query}`, {
    waitUntil: 'load',
    timeout: options.timeout,
  });
  await page.waitForFunction(
    () => typeof (/** @type {any} */ (window).olBenchmark) === 'object',
  );
  return page.evaluate(
    () => /** @type {any} */ (window).olBenchmark.unavailable,
  );
}

/**
 * @param {Object} options Options.
 * @return {Promise<Object>} Aggregated result.
 */
async function measure(options) {
  const caseNames = options.case ? [options.case] : await listCases();
  if (options.case && !(await listCases()).includes(options.case)) {
    throw new Error(`unknown benchmark case: ${options.case}`);
  }
  const server = await serve(options);
  const browser = await chromium.launch({
    headless: options.headless,
    // The default headless shell has no WebGPU support; the full browser in
    // headless mode does.
    channel: options.channel,
    args: [
      '--enable-unsafe-webgpu',
      '--enable-features=Vulkan',
      '--disable-dev-shm-usage',
      ...options.browserArg,
    ],
  });
  try {
    const [width, height] = options.viewport.split('x').map(Number);
    const page = await browser.newPage({
      viewport: {width, height},
      deviceScaleFactor: options.deviceScaleFactor,
    });
    page.setDefaultTimeout(options.timeout);
    page.on('pageerror', (err) => logError('page error:', err.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        logError('console error:', message.text());
      }
    });

    await openCase(page, server.url, options, caseNames[0]);
    const supported = await page.evaluate(() => !!navigator.gpu);
    if (!supported) {
      return {
        skipped: true,
        reason:
          'WebGPU is not available in this browser. Try --no-headless, or pass ' +
          '--browser-arg to enable it for your platform.',
      };
    }

    /** @type {Object<string, Object>} */
    const caseReports = {};
    for (const caseName of caseNames) {
      const unavailable = await openCase(page, server.url, options, caseName);
      if (unavailable) {
        log(`${caseName}: skipped (${unavailable})`);
        continue;
      }
      log(`${caseName} warm-up`);
      const warmupResult = await page.evaluate(
        () => /** @type {any} */ (window).olBenchmark.run(),
        undefined,
      );
      if (warmupResult.error) {
        throw new Error(`${caseName}: ${warmupResult.error}`);
      }
      /** @type {Array<Object>} */
      const runs = [];
      for (let i = 0; i < options.runs; ++i) {
        const result = await page.evaluate(
          () => /** @type {any} */ (window).olBenchmark.run(),
          undefined,
        );
        if (result.error) {
          throw new Error(`${caseName}: ${result.error}`);
        }
        runs.push(result);
        log(`${caseName} run ${i + 1}/${options.runs}`);
      }
      caseReports[caseName] = summarizeRuns(runs);
    }
    return createReport(caseReports);
  } finally {
    await browser.close();
    await server.close();
  }
}

/**
 * @param {string} title Table title.
 * @param {Object<string, number>} base Baseline summary.
 * @param {Object<string, number>} head Candidate summary.
 */
function compareSummaries(title, base, head) {
  const width = Math.max(
    title.length,
    ...REPORT_METRICS.map((metric) => metric.label.length),
  );
  log('');
  log(
    `${title.padEnd(width)}  ${'base'.padStart(12)}  ${'head'.padStart(
      12,
    )}  change`,
  );
  for (const metric of REPORT_METRICS) {
    if (
      typeof base[metric.key] !== 'number' &&
      typeof head[metric.key] !== 'number'
    ) {
      continue;
    }
    const a = base[metric.key] ?? 0;
    const b = head[metric.key] ?? 0;
    const change = percentChange(a, b);
    const sign = change > 0 ? '+' : '';
    log(
      `${metric.label.padEnd(width)}  ${a.toFixed(3).padStart(12)}  ${b
        .toFixed(3)
        .padStart(12)}  ${sign}${change.toFixed(1)}%`,
    );
  }
  if (Math.abs(base.displayMs - head.displayMs) > 0.5) {
    log(
      `warning: display interval changed from ${base.displayMs.toFixed(1)}ms to ${head.displayMs.toFixed(1)}ms`,
    );
  }
}

/**
 * @param {string} basePath Baseline JSON path.
 * @param {string} headPath Candidate JSON path.
 */
async function compare(basePath, headPath) {
  const base = JSON.parse(await fs.readFile(basePath, 'utf8'));
  const head = JSON.parse(await fs.readFile(headPath, 'utf8'));
  validateReport(base);
  validateReport(head);
  if (base.skipped || head.skipped) {
    throw new Error('cannot compare skipped runs');
  }
  const names = new Set([
    ...Object.keys(base.cases || {}),
    ...Object.keys(head.cases || {}),
  ]);
  for (const name of names) {
    const baseCase = base.cases?.[name];
    const headCase = head.cases?.[name];
    if (!baseCase || !headCase) {
      log(`${name}: missing from ${baseCase ? headPath : basePath}`);
      continue;
    }
    compareSummaries(name, baseCase, headCase);
    const phases = new Set([
      ...Object.keys(baseCase.phases || {}),
      ...Object.keys(headCase.phases || {}),
    ]);
    for (const phase of phases) {
      const basePhase = baseCase.phases?.[phase];
      const headPhase = headCase.phases?.[phase];
      if (basePhase && headPhase) {
        compareSummaries(`${name} · ${phase}`, basePhase, headPhase);
      }
    }
  }
}

const options = yargs(hideBin(process.argv))
  .option('case', {
    describe: 'Run a single case (default: every file in cases/)',
    type: 'string',
  })
  .option('projection', {
    describe: 'View projection',
    type: 'string',
    default: 'EPSG:3857',
  })
  .option('features', {
    describe: 'Feature count for vector cases',
    type: 'number',
    default: 1500,
  })
  .option('vertices', {
    describe: 'Vertices per polygon ring',
    type: 'number',
    default: 64,
  })
  .option('frames', {
    describe: 'Frames per flight phase',
    type: 'number',
    default: 90,
  })
  .option('warmup', {
    describe: 'Warmup frames before measuring',
    type: 'number',
    default: 20,
  })
  .option('display-hz', {
    describe: 'Fixed refresh rate for frame classification (0 measures it)',
    type: 'number',
    default: 0,
  })
  .option('runs', {
    describe: 'Number of flights to average',
    type: 'number',
    default: 5,
  })
  .option('out', {
    describe: 'Write the result JSON to this path',
    type: 'string',
  })
  .option('compare', {
    describe: 'Compare two result files instead of measuring',
    type: 'array',
  })
  .option('port', {
    describe: 'Port for the benchmark server',
    type: 'number',
    default: 8123,
  })
  .option('viewport', {
    describe: 'Browser viewport, as WIDTHxHEIGHT',
    type: 'string',
    default: '1280x900',
  })
  .option('device-scale-factor', {
    describe: 'Browser device pixel ratio',
    type: 'number',
    default: 1,
  })
  .option('headless', {
    describe: 'Run the browser headless',
    type: 'boolean',
    default: true,
  })
  .option('channel', {
    describe: 'Playwright browser channel',
    type: 'string',
    default: 'chromium',
  })
  .option('browser-arg', {
    describe: 'Extra Chromium argument (repeatable)',
    type: 'array',
    default: [],
  })
  .option('timeout', {
    describe: 'Page and flight timeout in milliseconds',
    type: 'number',
    default: 180000,
  })
  .parse();

if (options.compare) {
  if (options.compare.length !== 2) {
    throw new Error('--compare needs exactly two files');
  }
  await compare(String(options.compare[0]), String(options.compare[1]));
} else {
  const result = await measure(options);
  if (result.skipped) {
    log(`skipped: ${result.reason}`);
  } else {
    const width = Math.max(
      ...REPORT_METRICS.map((metric) => metric.label.length),
    );
    /**
     * @param {Object<string, number>} summary Summary.
     * @param {string} indent Line prefix.
     */
    const logSummary = (summary, indent) => {
      for (const metric of REPORT_METRICS) {
        if (typeof summary[metric.key] === 'number') {
          log(
            `${indent}${metric.label.padEnd(width)} ${summary[metric.key].toFixed(3)}`,
          );
        }
      }
    };
    for (const caseName of Object.keys(result.cases)) {
      log('');
      log(caseName);
      logSummary(result.cases[caseName], '');
      for (const [phase, summary] of Object.entries(
        result.cases[caseName].phases || {},
      )) {
        log(`  ${phase}`);
        logSummary(summary, '  ');
      }
    }
  }
  if (options.out) {
    const outPath = path.resolve(options.out);
    await fs.writeFile(outPath, JSON.stringify(result, null, 2));
    log(`wrote ${outPath}`);
  }
}
