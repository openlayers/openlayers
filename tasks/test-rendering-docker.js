/**
 * Runs the rendering tests in Docker, in the Linux environment of the
 * rendering job on GitHub CI. Arguments are passed on to the test script.
 */
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const image = 'openlayers-rendering-tests';
// Puppeteer has no Chrome for Linux on ARM.
const platform = 'linux/amd64';

/**
 * @param {Array<string>} args Docker arguments.
 */
function docker(args) {
  const result = spawnSync('docker', args, {stdio: 'inherit'});
  if (result.error) {
    throw new Error(`Could not run docker: ${result.error.message}`);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

docker([
  'build',
  '--platform',
  platform,
  '--tag',
  image,
  '--file',
  path.join(root, 'test', 'rendering', 'Dockerfile'),
  root,
]);

const run = [
  'run',
  '--rm',
  '--platform',
  platform,
  '--env',
  'CI=true',
  '--volume',
  `${root}:/repo`,
  // The image's dependencies, not the ones installed for the host.
  '--volume',
  '/repo/node_modules',
];
// Files written in the container belong to root, so hand them over.
let owner = '';
if (process.getuid) {
  run.push('--env', `OWNER=${process.getuid()}:${process.getgid()}`);
  owner = '; chown -R "$OWNER" build test/rendering/cases';
}

docker([
  ...run,
  image,
  'sh',
  '-c',
  `npm run test-rendering -- "$@"; status=$?${owner}; exit $status`,
  'sh',
  ...process.argv.slice(2),
]);
