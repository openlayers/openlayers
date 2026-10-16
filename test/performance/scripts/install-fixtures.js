#! /usr/bin/env node
import {spawn} from 'child_process';
import {createHash} from 'crypto';
import fs from 'fs/promises';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';

const baseDir = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = path.join(baseDir, 'data');
const manifestPath = path.join(baseDir, 'fixtures', 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const requested = process.argv.slice(2);
const fixtureIds = requested.length
  ? requested
  : Object.keys(manifest.fixtures);

/**
 * @param {...*} args Values to print.
 */
function log(...args) {
  console.log(...args); // eslint-disable-line no-console
}

/**
 * @param {string} command Command.
 * @param {Array<string>} args Arguments.
 * @return {Promise<void>} Completes when the command exits successfully.
 */
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: 'inherit'});
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited ${code}`));
      }
    });
  });
}

/**
 * @param {string} url URL.
 * @param {number} [attempt] Attempt.
 * @return {Promise<Response>} Successful response.
 */
async function fetchOk(url, attempt = 1) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      return response;
    }
    if (response.status < 500 && response.status !== 429) {
      throw new Error(`${response.status} ${response.statusText} for ${url}`);
    }
  } catch (error) {
    if (attempt === 3) {
      throw error;
    }
  }
  if (attempt === 3) {
    throw new Error(`could not download ${url}`);
  }
  await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  return fetchOk(url, attempt + 1);
}

/**
 * @param {string} id Fixture id.
 * @param {Object} fixture Fixture manifest entry.
 */
async function install(id, fixture) {
  const destination = path.join(dataDir, fixture.destination);
  const markerPath = path.join(destination, '.fixture.json');
  try {
    const marker = JSON.parse(await fs.readFile(markerPath, 'utf8'));
    if (marker.sha256 === fixture.sha256) {
      log(`${id}: already installed`);
      return;
    }
  } catch {
    // Install below.
  }

  const baseUrl = process.env.OL_BENCHMARK_FIXTURE_BASE_URL;
  const url = baseUrl ? new URL(fixture.archive, baseUrl).href : fixture.url;
  log(`${id}: downloading ${url}`);
  const response = await fetchOk(url);
  const archive = Buffer.from(await response.arrayBuffer());
  if (archive.byteLength !== fixture.bytes) {
    throw new Error(
      `${id}: expected ${fixture.bytes} bytes, got ${archive.byteLength}`,
    );
  }
  const digest = createHash('sha256').update(archive).digest('hex');
  if (digest !== fixture.sha256) {
    throw new Error(`${id}: SHA-256 mismatch`);
  }

  await fs.mkdir(dataDir, {recursive: true});
  const archivePath = path.join(dataDir, `.${fixture.archive}`);
  await fs.writeFile(archivePath, archive);
  await fs.rm(destination, {recursive: true, force: true});
  await fs.mkdir(destination, {recursive: true});
  try {
    await run('unzip', ['-q', archivePath, '-d', destination]);
    await fs.writeFile(
      markerPath,
      JSON.stringify(
        {fixture: id, version: fixture.version, sha256: fixture.sha256},
        null,
        2,
      ),
    );
  } finally {
    await fs.rm(archivePath, {force: true});
  }
  log(`${id}: installed in ${path.relative(process.cwd(), destination)}`);
}

for (const id of fixtureIds) {
  const fixture = manifest.fixtures[id];
  if (!fixture) {
    throw new Error(`unknown benchmark fixture: ${id}`);
  }
  await install(id, fixture);
}
