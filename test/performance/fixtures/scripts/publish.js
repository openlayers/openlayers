#! /usr/bin/env node
import {spawn} from 'child_process';
import {createHash} from 'crypto';
import fs from 'fs/promises';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';

const fixturesDir = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.resolve(fixturesDir, '../../..');
const manifestPath = path.join(fixturesDir, 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const [fixtureId, ...args] = process.argv.slice(2);
const tagIndex = args.indexOf('--tag');
const tag = tagIndex === -1 ? undefined : args[tagIndex + 1];

if (!fixtureId || !tag) {
  throw new Error('usage: publish.js FIXTURE --tag NEW_RELEASE_TAG');
}
const fixture = manifest.fixtures[fixtureId];
if (!fixture) {
  throw new Error(`unknown benchmark fixture: ${fixtureId}`);
}
if (!fixture.provenance?.length) {
  throw new Error(`${fixtureId}: provenance and licenses are required`);
}

/**
 * @param {string} command Command.
 * @param {Array<string>} commandArgs Arguments.
 * @return {Promise<number>} Exit code.
 */
function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {stdio: 'inherit'});
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

if (
  (await run('gh', ['release', 'view', tag, '--repo', manifest.repository])) ===
  0
) {
  throw new Error(`release ${tag} already exists; use a new tag`);
}

const archivePath = path.resolve(repoRoot, fixture.archivePath);
const archive = await fs.readFile(archivePath);
const bytes = archive.byteLength;
const sha256 = createHash('sha256').update(archive).digest('hex');
const releaseVersion = Number(tag.match(/(\d+)$/)?.[1]);
if (!Number.isFinite(releaseVersion)) {
  throw new Error(`release tag must end in a numeric fixture version: ${tag}`);
}
const notes = [
  `OpenLayers benchmark fixture: ${fixtureId}`,
  '',
  ...fixture.provenance.map(
    (source) => `- ${source.name}: ${source.license} (${source.url})`,
  ),
  '',
  `SHA-256: ${sha256}`,
].join('\n');
const status = await run('gh', [
  'release',
  'create',
  tag,
  archivePath,
  '--repo',
  manifest.repository,
  '--title',
  `OpenLayers benchmark fixtures ${tag}`,
  '--notes',
  notes,
]);
if (status !== 0) {
  throw new Error(`could not publish ${fixtureId}`);
}

fixture.version = releaseVersion;
fixture.tag = tag;
fixture.bytes = bytes;
fixture.sha256 = sha256;
fixture.url = `https://github.com/${manifest.repository}/releases/download/${tag}/${fixture.archive}`;
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`published ${fixtureId} as ${fixture.url}`); // eslint-disable-line no-console
