#! /usr/bin/env node
const puppeteer = require('puppeteer');
const webpack = require('webpack');
const config = require('./webpack.config');
const middleware = require('webpack-dev-middleware');
const http = require('http');
const path = require('path');
const png = require('pngjs');
const fs = require('fs');
const fse = require('fs-extra');
const pixelmatch = require('pixelmatch');
const yargs = require('yargs');

const compiler = webpack(Object.assign({mode: 'development'}, config));

const handler = middleware(compiler, {
  lazy: true,
  logLevel: 'error'
});

function getHref(entry) {
  return path.dirname(entry).slice(1) + '/';
}

function notFound(res) {
  return () => {
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
  };
}

function serve(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      handler(req, res, notFound(res));
    });

    server.listen(port, err => {
      if (err) {
        return reject(err);
      }
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

async function assertScreenshotsMatch(entry) {
  const actual = getActualScreenshotPath(entry);
  const expected = getExpectedScreenshotPath(entry);
  let mismatch, error;
  try {
    mismatch = await match(actual, expected);
  } catch (err) {
    error = err;
  }
  if (error) {
    return error;
  }
  if (mismatch) {
    return new Error(`${entry} mistmatch: ${mismatch}`);
  }
}

function exposeRender(page) {
  return new Promise((resolve, reject) => {
    const innerPromise = new Promise(innerResolve => {
      page.exposeFunction('render', innerResolve).then(() => resolve(() => innerPromise), reject);
    });
  });
}

async function renderPage(page, entry, options) {
  const href = getHref(entry);
  const renderCalled = await exposeRender(page);
  await page.goto(`http://localhost:${options.port}${href}`, {waitUntil: 'networkidle2'});
  await renderCalled();
  await page.screenshot({path: getActualScreenshotPath(entry)});
}

async function copyActualToExpected(entry) {
  const actual = getActualScreenshotPath(entry);
  const expected = getExpectedScreenshotPath(entry);
  await fse.copy(actual, expected);
}

async function renderEach(page, entries, options) {
  let fail = false;
  for (const entry of entries) {
    await renderPage(page, entry, options);
    if (options.fix) {
      await copyActualToExpected(entry);
      continue;
    }
    const error = await assertScreenshotsMatch(entry);
    if (error) {
      process.stderr.write(`${error.message}\n`);
      fail = true;
    }
  }
  return fail;
}

async function render(entries, options) {
  const browser = await puppeteer.launch();
  let fail = false;

  try {
    const page = await browser.newPage();
    await page.setViewport({width: 256, height: 256});
    fail = await renderEach(page, entries, options);
  } finally {
    browser.close();
  }

  if (fail) {
    throw new Error('RENDERING TESTS FAILED');
  }
}

async function main(entries, options) {
  const done = await serve(options.port);
  try {
    await render(entries, options);
  } finally {
    done();
  }
}

if (require.main === module) {

  const options = yargs.
    option('fix', {
      describe: 'Accept all screenshots as accepted',
      default: false
    }).
    option('port', {
      describe: 'The port for serving rendering cases',
      default: 3000
    }).
    parse();

  const entries = Object.keys(config.entry).map(key => config.entry[key]);

  main(entries, options).catch(err => process.stderr.write(`${err.message}\n`, () => process.exit(1)));
}
