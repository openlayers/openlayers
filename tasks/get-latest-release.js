import semver from 'semver';
import {Octokit} from '@octokit/rest';

async function main() {
  const client = new Octokit();

  let latest = '0.0.0';
  await client.paginate(
    client.rest.repos.listReleases,
    {
      owner: 'openlayers',
      repo: 'openlayers',
    },
    (response) => {
      for (const release of response.data) {
        const version = semver.valid(release.name);
        if (version && semver.gt(version, latest)) {
          latest = version;
        }
      }
    }
  );

  process.stdout.write(`v${latest}\n`);
}

main();
