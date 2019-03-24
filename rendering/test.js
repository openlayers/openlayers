#! /usr/bin/env node
const puppeteer = require('puppeteer');
const webpack = require('webpack');
const config = require('./webpack.config');
const webpackMiddleware = require('webpack-dev-middleware');
const http = require('http');
const path = require('path');
const png = require('pngjs');
const fs = require('fs');
const fse = require('fs-extra');
const pixelmatch = require('pixelmatch');
const yargs = require('yargs');
const log = require('loglevelnext');
const globby = require('globby');
const serveStatic = require('serve-static');

const compiler = webpack(Object.assign({mode: 'development'}, config));

function getHref(entry) {
  return path.dirname(entry).slice(1) + '/';
}

const staticHandler = serveStatic(__dirname);

const defaultHandler = serveStatic(path.join(__dirname, 'default'));

const srcHandler = serveStatic(path.join(__dirname, '..', 'src'));

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
    if (req.url.match(/^\/cases\/[^\/]+\/(index.html)?$/)) {
      // request for a case index file, and file not found, use default
      req.url = '/index.html';
      return defaultHandler(req, res, () => indexHandler(req, res));
    }

    // next try the src directory (only needed for ol/ol.css)
    return srcHandler(req, res, () => indexHandler(req, res));
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

      const ext = path.extname(req.url);
      if (ext === '.js' || ext === '.map') {
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
      options.log.info(`test server listening http://${address.address}:${address.port}/`);
      resolve(() => server.close());
    });
  });
}

function getActualScreenshotPath(entry) {
  return path.join(__dirname, path.dirname(entry), 'actual.png');
}

function getExpectedScreenshotPath(entry) {
  return path.join(__dirname, path.dirname(entry), 'expected.png');
}

function getPassFilePath(entry) {
  return path.join(__dirname, path.dirname(entry), 'pass');
}

function parsePNG(filepath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filepath);
    stream.on('error', err => {
      if (err.code === 'ENOENT') {
        return reject(new Error(`File not found: ${filepath}`));
      }
      reject(err);
    });

    const image = stream.pipe(new png.PNG());
    image.on('parsed', () => resolve(image));
    image.on('error', reject);
  });
}

async function match(actual, expected) {
  const actualImage = await parsePNG(actual);
  const expectedImage = await parsePNG(expected);
  const width = expectedImage.width;
  const height = expectedImage.height;
  if (actualImage.width != width) {
    throw new Error(`Unexpected width for ${actual}: expected ${width}, got ${actualImage.width}`);
  }
  if (actualImage.height != height) {
    throw new Error(`Unexpected height for ${actual}: expected ${height}, got ${actualImage.height}`);
  }
  const count = pixelmatch(actualImage.data, expectedImage.data, null, width, height);
  return count / (width * height);
}

async function getScreenshotsMismatch(entry) {
  const actual = getActualScreenshotPath(entry);
  const expected = getExpectedScreenshotPath(entry);
  let mismatch, error;
  try {
    mismatch = await match(actual, expected);
  } catch (err) {
    error = err;
  }
  return {error, mismatch};
}

let handleRender;
async function exposeRender(page) {
  await page.exposeFunction('render', (message) => {
    if (!handleRender) {
      throw new Error('No render handler set for current page');
    }
    handleRender(message);
  });
}

async function renderPage(page, entry, options) {
  const renderCalled = new Promise(resolve => {
    handleRender = (config) => {
      handleRender = null;
      resolve(config || {});
    };
  });
  options.log.debug('navigating', entry);
  await page.goto(`http://${options.host}:${options.port}${getHref(entry)}`, {waitUntil: 'networkidle0'});
  const config = await renderCalled;
  options.log.debug('screenshot', entry);
  await page.screenshot({path: getActualScreenshotPath(entry)});
  return config;
}

async function touch(filepath) {
  const fd = await fse.open(filepath, 'w');
  await fse.close(fd);
}

async function copyActualToExpected(entry) {
  const actual = getActualScreenshotPath(entry);
  const expected = getExpectedScreenshotPath(entry);
  await fse.copy(actual, expected);
  await touch(getPassFilePath(entry));
}

async function renderEach(page, entries, options) {
  let fail = false;
  for (const entry of entries) {
    const {tolerance = 0, message = ''} = await renderPage(page, entry, options);

    if (options.fix) {
      await copyActualToExpected(entry);
      continue;
    }

    const {error, mismatch} = await getScreenshotsMismatch(entry);
    if (error) {
      options.log.error(error);
      fail = true;
      continue;
    }

    let detail = `case ${entry}`;
    if (message) {
      detail = `${detail} (${message})`;
    }

    if (mismatch > tolerance) {
      options.log.error(`${detail}': mismatch ${mismatch.toFixed(3)}`);
      fail = true;
    } else {
      options.log.info(`${detail}': ok`);
      await touch(getPassFilePath(entry));
    }
  }
  return fail;
}

async function render(entries, options) {
  const browser = await puppeteer.launch({
    args: options.puppeteerArgs,
    headless: options.headless
  });

  let fail = false;

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
    await exposeRender(page);
    await page.setViewport({width: 256, height: 256});
    fail = await renderEach(page, entries, options);
  } finally {
    browser.close();
  }

  if (fail) {
    throw new Error('RENDERING TESTS FAILED');
  }
}

async function getLatest(patterns) {
  const stats = await globby(patterns, {stats: true});
  let latest = 0;
  for (const stat of stats) {
    if (stat.mtime > latest) {
      latest = stat.mtime;
    }
  }
  return latest;
}

async function getOutdated(entries, options) {
  const libTime = await getLatest(path.join(__dirname, '..', 'src', 'ol', '**', '*'));
  options.log.debug('library time', libTime);
  const outdated = [];
  for (const entry of entries) {
    const passPath = getPassFilePath(entry);
    const passTime = await getLatest(passPath);
    options.log.debug('pass time', entry, passTime);
    if (passTime < libTime) {
      outdated.push(entry);
      continue;
    }

    const caseTime = await getLatest(path.join(__dirname, path.dirname(entry), '**', '*'));
    options.log.debug('case time', entry, caseTime);
    if (passTime < caseTime) {
      outdated.push(entry);
      continue;
    }

    options.log.info('skipping', entry);
  }
  return outdated;
}

async function main(entries, options) {
  if (!options.force && !options.match) {
    entries = await getOutdated(entries, options);
  }
  if (options.match) {
    const exp = new RegExp(options.match);
    entries = entries.filter(entry => exp.test(entry));
  }
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
    option('fix', {
      describe: 'Accept all screenshots as accepted',
      type: 'boolean',
      default: false
    }).
    option('host', {
      describe: 'The host for serving rendering cases',
      default: '127.0.0.1'
    }).
    option('port', {
      describe: 'The port for serving rendering cases',
      type: 'number',
      default: 3000
    }).
    option('match', {
      describe: 'Only run tests matching the provided string RegExp pattern',
      type: 'string'
    }).
    option('force', {
      describe: 'Run all tests (instead of just outdated tests)',
      type: 'boolean',
      default: false
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
    option('timeout', {
      describe: 'The timeout for loading pages (in milliseconds)',
      type: 'number',
      default: 60000
    }).
    option('headless', {
      describe: 'Launch Puppeteer in headless mode',
      type: 'boolean',
      default: false
    }).
    option('puppeteer-args', {
      describe: 'Additional args for Puppeteer',
      type: 'array',
      default: process.env.CI ? ['--no-sandbox', '--disable-setuid-sandbox'] : []
    }).
    parse();

  const entries = Object.keys(config.entry).map(key => config.entry[key]);

  options.log = log.create({name: 'rendering', level: options.logLevel});

  main(entries, options).catch(err => {
    options.log.error(err.message);
    process.exit(1);
  });
}
