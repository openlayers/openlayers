#! /usr/bin/env node
/**
 * Build the versioned VersaTiles benchmark fixture from upstream sources.
 *
 * The output is gitignored. Contributors install the published archive with
 * `npm run fetch-bench-fixtures`; this script is only for maintainers.
 */
import {spawn} from 'child_process';
import fs from 'fs/promises';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';

const baseDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const dataDir = path.join(baseDir, 'data');
const outDir = path.join(dataDir, 'versatiles');
const zipPath = path.join(dataDir, 'versatiles-vienna.zip');

/** Tile at the focus view, zoom 14. */
const CENTER_X = 8933;
const CENTER_Y = 5681;
/** Half-width of the z14 block, in tiles. 7 gives a 15×15 block. */
const HALF = 7;
const MAX_ZOOM = 14;
const MIN_ZOOM = 12;

const TILE_URL = 'https://tiles.versatiles.org/tiles/osm';
const STYLE_URL =
  'https://tiles.versatiles.org/assets/styles/colorful/style.json';
const SPRITE_URL = 'https://tiles.versatiles.org/assets/sprites/base';
const FONT_CSS =
  'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans/{weight}.css';
const FONT_LICENSE =
  'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans/LICENSE';

const CONCURRENCY = 8;

/**
 * @param {...*} args Values to print.
 */
function log(...args) {
  console.log(...args); // eslint-disable-line no-console
}

/**
 * @param {string} command Command.
 * @param {Array<string>} args Arguments.
 * @param {string} [cwd] Working directory.
 * @return {Promise<void>} Completes when the command exits 0.
 */
function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {cwd, stdio: 'inherit'});
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with ${code}`));
      }
    });
  });
}

/**
 * @param {string} url URL.
 * @param {number} [attempt] Attempt number, starting at 1.
 * @return {Promise<Response>} Response with status 200.
 */
async function fetchOk(url, attempt = 1) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    if (attempt >= 3) {
      throw error;
    }
    await delay(attempt * 500);
    return fetchOk(url, attempt + 1);
  }
  if (response.ok) {
    return response;
  }
  if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
    await delay(attempt * 500);
    return fetchOk(url, attempt + 1);
  }
  throw new Error(`${response.status} ${response.statusText} for ${url}`);
}

/**
 * @param {number} ms Delay in milliseconds.
 * @return {Promise<void>} Completes after the delay.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} file Path relative to the dataset directory.
 * @param {Buffer|string} contents File contents.
 * @return {Promise<number>} Bytes written.
 */
async function writeOut(file, contents) {
  const target = path.join(outDir, file);
  await fs.mkdir(path.dirname(target), {recursive: true});
  await fs.writeFile(target, contents);
  return Buffer.byteLength(contents);
}

/**
 * @param {Array<T>} items Items.
 * @param {number} limit Maximum concurrent tasks.
 * @param {function(T): Promise<void>} task Task.
 * @return {Promise<void>} Completes when every task has finished.
 * @template T
 */
async function pool(items, limit, task) {
  let index = 0;
  const workers = Array.from({length: Math.min(limit, items.length)}, () =>
    (async function worker() {
      while (index < items.length) {
        const current = index;
        index += 1;
        await task(items[current]);
      }
    })(),
  );
  await Promise.all(workers);
}

/**
 * z12–z14 tiles covering a square block around the focus view.
 * @return {Array<{z: number, x: number, y: number}>} Tiles.
 */
function tileList() {
  const x0 = CENTER_X - HALF;
  const x1 = CENTER_X + HALF;
  const y0 = CENTER_Y - HALF;
  const y1 = CENTER_Y + HALF;
  /** @type {Array<{z: number, x: number, y: number}>} */
  const tiles = [];
  for (let z = MIN_ZOOM; z <= MAX_ZOOM; ++z) {
    const shift = MAX_ZOOM - z;
    for (let x = x0 >> shift; x <= x1 >> shift; ++x) {
      for (let y = y0 >> shift; y <= y1 >> shift; ++y) {
        tiles.push({z, x, y});
      }
    }
  }
  return tiles;
}

/**
 * @param {string} css Fontsource CSS.
 * @return {string} CSS that references only woff2 files.
 */
function woff2Only(css) {
  return css.replace(/src:\s*([^;]+);/g, (match, src) => {
    const woff2 = src
      .split(',')
      .map((part) => part.trim())
      .find((part) => part.includes('.woff2'));
    return woff2 ? `src: ${woff2};` : match;
  });
}

/**
 * @return {Promise<number>} Bytes written.
 */
async function downloadStyleSpritesAndFonts() {
  let bytes = 0;
  const style = await (await fetchOk(STYLE_URL)).json();
  style.sources['versatiles-shortbread'].tiles = ['tiles/{z}/{x}/{y}'];
  style.sprite = [{id: 'base', url: 'sprites/base'}];
  style.glyphs = 'glyphs/{fontstack}/{range}.pbf';
  bytes += await writeOut('style.json', JSON.stringify(style));

  const sprites = ['', '@2x'].flatMap((suffix) => [
    [`sprites/base${suffix}.json`, `${SPRITE_URL}${suffix}.json`],
    [`sprites/base${suffix}.png`, `${SPRITE_URL}${suffix}.png`],
  ]);
  for (const [file, url] of sprites) {
    const response = await fetchOk(url);
    bytes += await writeOut(file, Buffer.from(await response.arrayBuffer()));
  }

  // ol-mapbox-style asks for the Mapbox family name at weight 400, including
  // noto_sans_bold. The bold cut is served under that family so labels match
  // the style without a network font request.
  const faces = [
    ['noto_sans_regular', 400],
    ['noto_sans_bold', 700],
  ];
  for (const [family, weight] of faces) {
    const cssUrl = FONT_CSS.replace('{weight}', String(weight));
    const original = await (await fetchOk(cssUrl)).text();
    const css = woff2Only(original)
      .replaceAll("font-family: 'Noto Sans'", `font-family: '${family}'`)
      .replaceAll('font-weight: 700', 'font-weight: 400');
    bytes += await writeOut(`fonts/${family}/400.css`, css);
    const files = new Set(
      [...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map((match) =>
        match[1].replace(/['"]/g, ''),
      ),
    );
    for (const relative of files) {
      const url = new URL(relative, cssUrl);
      const response = await fetchOk(url);
      const name = path.basename(url.pathname);
      bytes += await writeOut(
        `fonts/${family}/files/${name}`,
        Buffer.from(await response.arrayBuffer()),
      );
    }
  }
  const fontLicense = await (await fetchOk(FONT_LICENSE)).text();
  bytes += await writeOut('LICENSES/Noto-Sans-OFL.txt', fontLicense);
  const notice = `# Benchmark fixture sources

- Vector tiles: OpenStreetMap (ODbL 1.0) and ESA WorldCover (CC BY 4.0)
  - https://docs.versatiles.org/basics/tilesets.html
  - https://www.openstreetmap.org/copyright
  - https://esa-worldcover.org/en/data-access
- Style: VersaTiles Style (Unlicense)
  - https://github.com/versatiles-org/versatiles-style
- Sprites: VersaTiles Style (CC0 1.0)
  - https://github.com/versatiles-org/versatiles-style/blob/main/icons/LICENSE.md
- Noto Sans: SIL Open Font License 1.1
  - LICENSES/Noto-Sans-OFL.txt
`;
  bytes += await writeOut('NOTICE.md', notice);
  return bytes;
}

/**
 * @return {Promise<void>} Completes when the dataset and zip exist.
 */
async function buildFromUpstream() {
  await fs.rm(outDir, {recursive: true, force: true});
  await fs.mkdir(outDir, {recursive: true});
  const tiles = tileList();
  log(`downloading ${tiles.length} tiles, plus style, sprites, and fonts`);
  let tileBytes = 0;
  let done = 0;
  await pool(tiles, CONCURRENCY, async ({z, x, y}) => {
    const url = `${TILE_URL}/${z}/${x}/${y}`;
    const response = await fetchOk(url);
    const bytes = await writeOut(
      `tiles/${z}/${x}/${y}`,
      Buffer.from(await response.arrayBuffer()),
    );
    tileBytes += bytes;
    done += 1;
    if (done % 25 === 0 || done === tiles.length) {
      log(`${done}/${tiles.length} tiles, ${formatBytes(tileBytes)}`);
    }
  });
  const extraBytes = await downloadStyleSpritesAndFonts();
  log(
    `${tiles.length} tiles, ${formatBytes(tileBytes)}; style, sprites, and fonts ${formatBytes(extraBytes)}`,
  );
  await fs.rm(zipPath, {force: true});
  const files = (await fs.readdir(outDir, {recursive: true}))
    .map((file) => String(file))
    .sort();
  const timestamp = new Date('2000-01-01T00:00:00Z');
  const archiveFiles = [];
  for (const file of files) {
    const absolute = path.join(outDir, file);
    const stat = await fs.stat(absolute);
    if (stat.isFile()) {
      await fs.utimes(absolute, timestamp, timestamp);
      archiveFiles.push(file);
    }
  }
  await run('zip', ['-X', '-q', zipPath, ...archiveFiles], outDir);
  const zipStat = await fs.stat(zipPath);
  log(`wrote ${zipPath} (${formatBytes(zipStat.size)})`);
}

/**
 * @param {number} bytes Byte count.
 * @return {string} Rounded size.
 */
function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

await buildFromUpstream();
