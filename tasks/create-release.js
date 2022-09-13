import esMain from 'es-main';
import yargs from 'yargs';
import {Octokit} from '@octokit/rest';
import {basename} from 'node:path';
import {hideBin} from 'yargs/helpers';
import {readFile, stat} from 'node:fs/promises';

/**
 * @typedef {Object} Options
 * @property {string} token The bearer token.
 * @property {string} tag The tag.
 * @property {boolean} draft Create a draft release.
 * @property {boolean} notes Generate release notes.
 * @property {string} site Path to zip archive with site contents.
 * @property {string} package Path to zip archive with source and full build.
 */

const owner = 'openlayers';
const repo = 'openlayers';

/**
 * Create a release.
 * @param {Options} options The release options.
 */
async function createRelease(options) {
  const client = new Octokit({
    auth: options.token,
  });

  const response = await client.rest.repos.createRelease({
    owner,
    repo,
    tag_name: options.tag,
    generate_release_notes: options.notes,
    draft: options.draft,
  });

  await uploadAsset(
    client,
    response.data,
    options.site,
    'Examples and docs (zip)'
  );

  await uploadAsset(
    client,
    response.data,
    options.package,
    'Package archive (zip)'
  );
}

async function uploadAsset(client, release, assetPath, label) {
  const name = basename(assetPath);
  const stats = await stat(assetPath);
  const data = await readFile(assetPath);

  await client.rest.repos.uploadReleaseAsset({
    url: release.upload_url,
    name,
    label,
    headers: {
      'content-type': 'application/zip',
      'content-length': stats.size,
    },
    data,
  });
}

if (esMain(import.meta)) {
  const options = yargs(hideBin(process.argv))
    .option('token', {
      describe: 'The token for auth',
      type: 'string',
    })
    .demandOption('token')
    .option('tag', {
      describe: 'The release tag (e.g. v7.0.0)',
      type: 'string',
    })
    .demandOption('tag')
    .option('package', {
      describe: 'Path to the archive with the source package',
      type: 'string',
    })
    .demandOption('package')
    .option('site', {
      describe: 'Path to the archive with the site contents',
      type: 'string',
    })
    .demandOption('site')
    .option('draft', {
      describe: 'Create a draft release',
      type: 'boolean',
      default: true,
    })
    .option('notes', {
      describe: 'Generate release notes',
      type: 'boolean',
      default: true,
    })
    .parse();

  createRelease(options).catch((err) => {
    process.stderr.write(`${err.stack}\n`, () => process.exit(1));
  });
}
