import esMain from 'es-main';
import fse from 'fs-extra';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';
import {spawn} from 'child_process';
import {walk} from 'walk';

const isWindows = process.platform.startsWith('win');
const baseDir = dirname(fileURLToPath(import.meta.url));

const sourceDir = path.join(baseDir, '..', 'src');
const infoPath = path.join(baseDir, '..', 'build', 'info.json');

/**
 * Get checked path of a binary.
 * @param {string} binaryName Binary name of the binary path to find.
 * @return {string} Path.
 */
function getBinaryPath(binaryName) {
  if (isWindows) {
    binaryName += '.cmd';
  }

  const jsdocResolved = path.join(
    baseDir,
    '..',
    'node_modules',
    'jsdoc',
    'jsdoc.js'
  );
  const expectedPaths = [
    path.join(baseDir, '..', 'node_modules', '.bin', binaryName),
    path.resolve(
      path.join(path.dirname(jsdocResolved), '..', '.bin', binaryName)
    ),
  ];

  for (let i = 0; i < expectedPaths.length; i++) {
    const expectedPath = expectedPaths[i];
    if (fse.existsSync(expectedPath)) {
      return expectedPath;
    }
  }

  throw Error(
    'JsDoc binary was not found in any of the expected paths: ' + expectedPaths
  );
}

const jsdoc = getBinaryPath('jsdoc');

const jsdocConfig = path.join(
  baseDir,
  '..',
  'config',
  'jsdoc',
  'info',
  'conf.json'
);

/**
 * Generate a list of all .js paths in the source directory.
 * @return {Promise<Array>} Resolves to an array of source paths.
 */
function getPaths() {
  return new Promise((resolve, reject) => {
    let paths = [];

    const walker = walk(sourceDir);
    walker.on('file', (root, stats, next) => {
      const sourcePath = path.join(root, stats.name);
      if (sourcePath.endsWith('.js')) {
        paths.push(sourcePath);
      }
      next();
    });
    walker.on('errors', () => {
      reject(new Error(`Trouble walking ${sourceDir}`));
    });

    walker.on('end', () => {
      /**
       * Windows has restrictions on length of command line, so passing all the
       * changed paths to a task will fail if this limit is exceeded.
       * To get round this, if this is Windows and there are newer files, just
       * pass the sourceDir to the task so it can do the walking.
       */
      if (isWindows) {
        paths = [sourceDir];
      }

      resolve(paths);
    });
  });
}

/**
 * Parse the JSDoc output.
 * @param {string} output JSDoc output
 * @return {Object} Symbol and define info.
 */
function parseOutput(output) {
  if (!output) {
    throw new Error('Expected JSON output');
  }

  let info;
  try {
    info = JSON.parse(String(output));
  } catch (err) {
    throw new Error('Failed to parse output as JSON: ' + output);
  }
  if (!Array.isArray(info.symbols)) {
    throw new Error('Expected symbols array: ' + output);
  }
  if (!Array.isArray(info.defines)) {
    throw new Error('Expected defines array: ' + output);
  }

  return info;
}

/**
 * Spawn JSDoc.
 * @param {Array<string>} paths Paths to source files.
 * @return {Promise<string>} Resolves with the JSDoc output (new metadata).
 *     If provided with an empty list of paths, resolves with null.
 */
function spawnJSDoc(paths) {
  return new Promise((resolve, reject) => {
    let output = '';
    let errors = '';
    const cwd = path.join(baseDir, '..');
    const child = spawn(jsdoc, ['-c', jsdocConfig].concat(paths), {cwd: cwd});

    child.stdout.on('data', (data) => {
      output += String(data);
    });

    child.stderr.on('data', (data) => {
      errors += String(data);
    });

    child.on('exit', (code) => {
      if (code) {
        reject(new Error(errors || 'JSDoc failed with no output'));
        return;
      }

      let info;
      try {
        info = parseOutput(output);
      } catch (err) {
        reject(err);
        return;
      }
      resolve(info);
    });
  });
}

/**
 * Writes the info.json file.
 * @param {Object} info The info.
 * @return {Promise} Resolves on completion.
 */
async function write(info) {
  await fse.outputJson(infoPath, info, {spaces: 2});
}

/**
 * Generate info from the sources.
 * @return {Promise<Error>} Resolves with the info object.
 */
export default async function main() {
  const paths = await getPaths();
  return await spawnJSDoc(paths);
}

/**
 * If running this module directly, generate and write out the info.json file.
 */
if (esMain(import.meta)) {
  main()
    .then(write)
    .catch((err) => {
      process.stderr.write(`${err.message}\n`, () => process.exit(1));
    });
}
