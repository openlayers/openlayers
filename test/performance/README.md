# Performance benchmarks

Benchmarks are for measuring map rendering while developing. They are not
published with the examples on the website.

Each file in `cases/` is one benchmark. It exports a `name` and a `setup`
function. `setup` receives the map element and the page query string, builds
the map, and returns an object with a `run()` method. `run()` resolves to JSON
with `frameMs`, `cpuMs`, `slowFrames20`, `slowFrames33`, `phases`, and
`config`.

`flight.js` is the shared zoom, pan, and rotate script. A case can call
`runFlight` with its own phases, or implement `run()` itself, as long as the
result has that shape. Geometry that must stay identical across runs belongs
in `data.js` and should come from a seeded random number generator, not the
network.

## Run locally

Start the dev page and open the URL Vite prints. That page lists every case:

    npm run serve-bench

Headless, every case:

    npm run bench

One case, fewer frames:

    npm run bench -- --case webgpu-vector --frames 30 --runs 1

Compare two checkouts. From the baseline checkout:

    npm run bench -- --out base.json

From the branch:

    npm run bench -- --out head.json
    npm run bench -- --compare base.json head.json

Results are a trimmed mean of several flights. They are comparable only across
runs on the same machine. CI uses a software WebGPU adapter, so those numbers
are not comparable to a local GPU.
