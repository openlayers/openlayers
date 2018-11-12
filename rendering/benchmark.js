#! /usr/bin/env node
const puppeteer = require('puppeteer');
const webpack = require('webpack');
const config = require('./webpack.config');
const webpackMiddleware = require('webpack-dev-middleware');
const http = require('http');
const path = require('path');
const fs = require('fs');
const yargs = require('yargs');
const log = require('loglevelnext');
const serveStatic = require('serve-static');

const compiler = webpack(Object.assign({mode: 'development'}, config));

function getHref(entry) {
  return path.dirname(entry).slice(1) + '/';
}

const staticHandler = serveStatic(__dirname, {
  'setHeaders': (res, path) => {
    // add the correct headers for pbf tiles on disk
    if (path.match(/\.pbf$/)) {
      res.setHeader('Content-Type', 'application/x-protobuf');
      res.setHeader('Content-Encoding', 'gzip');
    }
  }
});

const defaultHandler = serveStatic(path.join(__dirname, 'default'));

function indexHandler(req, res) {
  const items = [];
  for (const key in config.entry) {
    const href = getHref(config.entry[key]);
    items.push(`<li><a href="${href}">${href}</a></li>`);
  }
  const markup = `<!DOCTYPE html><body><ul>${items.join('')}</ul></body>`;

  res.writeHead(404, {
    'Content-Type': 'text/html'
  });
  res.end(markup);
}

function notFound(req, res) {
  return () => {
    // first, try the default directory
    if (req.url.match(/^\/benchmarks\/[^\/]+\/(index.html)?$/)) {
      // request for a case index file, and file not found, use default
      req.url = '/index.html';
      return defaultHandler(req, res, () => indexHandler(req, res));
    }

    // check if it's data but missing
    if (req.url.match(/^\/data\//)) {
      console.log('missing data was requested', req.url);
      res.writeHead(404, {
        'Content-Type': 'text/html'
      });
      res.end();
      return;
    }

    // fall back to a listing of all cases
    indexHandler(req, res);
  };
}

function serve(options) {
  const webpackHandler = webpackMiddleware(compiler, {
    lazy: true,
    logger: options.log,
    stats: 'minimal'
  });

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (path.extname(req.url) === '.js') {
        webpackHandler(req, res, notFound(req, res));
        return;
      }

      staticHandler(req, res, notFound(req, res));
    });

    server.listen(options.port, options.host, err => {
      if (err) {
        return reject(err);
      }
      const address = server.address();
      options.log.info(`benchmark server listening http://${address.address}:${address.port}/`);
      resolve(() => server.close());
    });
  });
}

let iterationResolver;
async function exposeIterationControls(page) {
  await page.exposeFunction('endIteration', () => {
    if (iterationResolver) {
      iterationResolver();
    }
  })
}

function printTime(time) { return (time * 1000).toFixed(1); }

async function renderPage(page, entry, options) {
  options.log.debug('navigating', entry);

  await page.goto(`http://${options.host}:${options.port}${getHref(entry)}`, {waitUntil: 'load'});
  await page.evaluate('window.benchmarking = true');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // fps counter; frameTimes is an array of array (one array for each iteration)
  let iterationNumber = 0;
  const frameTimes = [];
  const flatFrameTimes = [];
  let refTime = 0;
  page.on('metrics', (metrics) => {
    // first iteration is ignored
    if (iterationNumber === 0) {
      return;
    }

    const time = metrics.metrics.Timestamp;
    if (metrics.title === 'frameend' && frameTimes.length) {
      frameTimes[frameTimes.length - 1].push(time - refTime);
      flatFrameTimes.push(time - refTime);
    } else if (metrics.title === 'framestart') {
      refTime = time;
    }
  });

  for (iterationNumber; iterationNumber < options.iterations + 1; iterationNumber++) {
    let iterationEnd = new Promise(resolve => iterationResolver = resolve);
    const currentTimes = [];
    frameTimes.push(currentTimes);

    await page.evaluate('startIteration()');
    await iterationEnd

    if (iterationNumber === 0) {
      continue;
    }

    // metrics for the iteration
    const averageTime = currentTimes.reduce((prev, curr) => prev + curr / currentTimes.length, 0);
    const maxTime = currentTimes.reduce((prev, curr) => Math.max(curr, prev), 0);
    options.log.debug(`iteration ${iterationNumber} ended - average ${printTime(averageTime)}ms / max ${printTime(maxTime)}ms`);
  }

  // printing the report
  const metrics = await page.metrics();
  const screenshot = await page.screenshot({encoding: 'base64'});
  const totalFrameTime = flatFrameTimes.reduce((prev, curr) => prev + curr, 0);
  const maximumFrameTime = frameTimes.reduce((prev, times) => {
    return times.reduce((prev, curr) => Math.max(curr, prev), 0) / frameTimes.length + prev;
  }, 0);

  options.log.info(`${entry} - benchmark finished
Maximum frame time: ${printTime(maximumFrameTime)}ms
Average frame time: ${printTime(totalFrameTime / flatFrameTimes.length)}ms
`);

  return `
<html>
  <body>
    <h3>${entry}</h3>
    <div><img src="data:image/png;base64,${screenshot}"/></div>
    <ul>
      <li>Average frame time: ${printTime(totalFrameTime / flatFrameTimes.length)}ms</li>
      <li>Maximum frame time: ${printTime(maximumFrameTime)}ms</li>
      <li>Total frame time: ${printTime(totalFrameTime)}ms</li>
      <li>Heap used: ${(metrics.JSHeapUsedSize / 1024).toFixed(1)}ko</li>
      <li>Total heap: ${(metrics.JSHeapTotalSize / 1024).toFixed(1)}ko</li>
    </ul>
  </body>
</html>`
}

async function renderEach(page, entries, options) {
  let report = '';
  for (const entry of entries) {
    report += await renderPage(page, entry, options);
  }

  if (options.report) {
    const markup = `
<html>
  <body>
    ${report}
  </body>
</html>`;
    const reportPath = path.join(__dirname, 'benchmark-report.html');
    fs.writeFile(reportPath, markup, (err) => {
      if (err) {
        options.log.error(err);
      } else {
        options.log.debug('report created', reportPath);
      }
    });
  }
}

async function render(entries, options) {
  const browser = await puppeteer.launch({
    args: options.puppeteerArgs,
    headless: options.headless
  });

  try {
    const page = await browser.newPage();
    page.on('error', err => {
      options.log.error('page crash', err);
    });
    page.on('pageerror', err => {
      options.log.error('uncaught exception', err);
    });
    page.on('console', message => {
      const type = message.type();
      if (options.log[type]) {
        options.log[type](message.text());
      }
    });

    page.setDefaultNavigationTimeout(options.timeout);
    await page.setViewport({width: 256, height: 256});
    await exposeIterationControls(page);
    await renderEach(page, entries, options);
  } finally {
    browser.close();
  }
}

async function main(entries, options) {
  if (!options.interactive && entries.length === 0) {
    return;
  }

  const done = await serve(options);
  try {
    await render(entries, options);
  } finally {
    if (!options.interactive) {
      done();
    }
  }
}

if (require.main === module) {

  const options = yargs.
  option('host', {
    describe: 'The host for serving rendering cases',
    default: '127.0.0.1'
  }).
  option('port', {
    describe: 'The port for serving rendering cases',
    type: 'number',
    default: 3000
  }).
  option('timeout', {
    describe: 'The timeout for loading pages (in milliseconds)',
    type: 'number',
    default: 60000
  }).
  option('report', {
    describe: 'Generate an HTML report called benchmark-report.html in the working dir',
    type: 'boolean',
    default: false
  }).
  option('iterations', {
    describe: 'Iteration count',
    type: 'number',
    default: 10
  }).
  option('interactive', {
    describe: 'Run all tests and keep the test server running (this option will be reworked later)',
    type: 'boolean',
    default: false
  }).
  option('log-level', {
    describe: 'The level for logging',
    choices: ['trace', 'debug', 'info', 'warn', 'error', 'silent'],
    default: 'error'
  }).
  option('headless', {
    describe: 'Launch Puppeteer in headless mode',
    type: 'boolean',
    default: process.env.CI ? false : true
  }).
  option('puppeteer-args', {
    describe: 'Additional args for Puppeteer',
    type: 'array',
    default: process.env.CI ? ['--no-sandbox', '--disable-setuid-sandbox'] : []
  }).
  parse();

  const entries = Object.keys(config.entry).filter(key => key.startsWith('benchmarks')).map(key => config.entry[key]);

  options.log = log.create({name: 'benchmarking', level: options.logLevel});

  main(entries, options).catch(err => {
    options.log.error(err.message);
    process.exit(1);
  });
}
