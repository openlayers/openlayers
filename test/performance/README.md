# Performance benchmarks

These benchmarks run repeatable map navigation and report the frames a user
would notice. They are separate from `npm test`.

## Run locally

Start the benchmark page:

```sh
npm run serve-bench
```

The page lists every available case. It can run one case or the whole suite,
repeat measured flights, show frame timing while the map moves, download a
JSON report, and compare that report with an earlier one. Each case gets one
discarded warm-up flight before its measured runs.

The report metrics are smaller-is-better:

| Metric | Meaning | Across runs |
| --- | --- | --- |
| Missed frames | Display refreshes skipped between animation callbacks | Mean |
| Late frames | Frames later than 1.5× the measured display interval | Mean |
| Stalls | Gaps longer than 100 milliseconds | Maximum |
| Worst frame | Longest presented-frame gap | Maximum |

The map is always 800×600 CSS pixels, so results do not depend on the window
size. The report also records the display interval, map size, and device pixel
ratio as comparison context.

## Directory layout

- `client/` contains code loaded by the benchmark page.
- `cases/` contains benchmark case modules discovered by the page and CLI.
- `shared/` contains measurement, reporting, and synthetic-data modules.
- `scripts/` contains the benchmark runner, fixture installer, and CI tooling.
- `config/` contains development-server configuration.
- `fixtures/` contains the fixture manifest and maintainer-only tooling.

## Command line

Agents and automated jobs use the same cases and report:

```sh
npm run bench
npm run bench -- --case <name> --runs 5
npm run bench -- --out performance.json
npm run bench -- --compare baseline.json performance.json
```

Useful controls include `--frames`, `--warmup`, `--viewport`,
`--device-scale-factor`, `--projection`, `--features`, and `--vertices`. The
default is five measured runs after one discarded flight.

Comparisons are meaningful only on the same machine under similar load. Do not
compare local hardware results with CI, which uses a software WebGPU adapter.
The CI timeline compares CI runs with other CI runs.

## Add a case

Add one module to `cases/`. It exports a stable `name` and a `setup(target,
params)` function. `setup` returns an object with:

- `run()`, which resolves to the result of a repeatable flight.
- `dispose()`, which detaches the map when another case is prepared.

It may also export a display `title` and a `fixture` id. If a required fixture
is absent, return `{unavailable: 'reason'}` so **Run all** and the headless
runner can skip it.

Use `runFlight` for shared measurement. Define phases as functions of frame
progress instead of wall-clock time. Generate synthetic geometry from a seeded
source in `shared/data.js` so repeated runs receive identical input.

## Benchmark fixtures

Install all pinned fixtures with:

```sh
npm run fetch-bench-fixtures
```

`fixtures/manifest.json` pins each public release asset by URL, byte size, and
SHA-256 digest. Installation verifies both before extracting into the
gitignored `data/` directory. A missing fixture makes its cases unavailable;
other cases still run.

### Publish a fixture

Fixture builders and the publisher live in `fixtures/scripts/`. For the VersaTiles
fixture:

```sh
node test/performance/fixtures/scripts/build-versatiles.js
node test/performance/fixtures/scripts/publish.js versatiles --tag fixtures-v1
rm -rf test/performance/data/
npm run fetch-bench-fixtures
```

Publishing requires `gh` access to `openlayers/benchmarks`. The script rejects
an existing release tag or asset, uploads the archive under a new tag, and
updates the local manifest. Review the archive, provenance, redistribution
licenses, generated URL, size, and digest before committing that manifest.

To add another fixture:

1. Add `fixtures/scripts/build-<fixture>.js`.
2. Add its provenance and redistribution license references.
3. Build and inspect the archive.
4. Publish it under a new release tag.
5. Commit the generated manifest update.
6. Delete `data/` and prove that `npm run fetch-bench-fixtures` restores it.

Never replace an existing release asset. A fixture change always receives a new
version and release tag.

## Continuous integration

Pull requests and `main` write the four metrics to the Actions job summary and
upload the full report for short-term diagnosis. Pull requests compare with the
public latest report. Trusted `main` runs append the four metrics to the
`openlayers/benchmarks` history and GitHub Pages timeline.

Performance changes do not fail CI solely because a metric moved. Software
rendering on shared runners is noisy; reviewers use the summary and timeline
to investigate significant changes. A case error still fails the job.
