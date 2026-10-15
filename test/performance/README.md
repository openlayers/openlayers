# Performance benchmarks

Benchmarks are for measuring map rendering while developing. They are not
published with the examples on the website.

Each file in `cases/` is one benchmark. It exports a `name` and a `setup`
function. `setup` receives the map element and the page query string, builds
the map, and returns an object with a `run()` method. `run()` resolves to JSON
with `experience`, `frameMs`, `cpuMs`, `phases`, and `config`.

`experience` is the result to read. `displayMs` is the measured refresh
interval. Presented-frame gaps (`gaps`) are only meaningful next to that
interval: a p99 of 33 ms on a 30 Hz display means the map kept up with the
screen. `lateFrames` counts gaps longer than 1.5× the display interval, and
`droppedFrames` estimates how many refreshes those gaps skipped. `stalls`,
`worstGapMs`, and `stallMs` describe gaps longer than 100 ms, which is long
enough to feel like the map froze during a pan or zoom. `work` is renderer
main-thread time. `overBudget` counts frames whose work exceeded 16.7 ms, so
they cannot sustain 60 fps whatever refresh the display used for the run.

`frameMs` and `cpuMs` stay in the JSON for diagnosis. Comparisons use the
experience counts above, not raw gap percentiles, so a 30 Hz cadence is not
reported as a regression.

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

The `webgpu-vector-tiles-overzoom` case uses deterministic procedural vector
tiles with a source maximum zoom of 14 and drives the view from zoom 13 through
17. It reports separate zoom, kinetic-pan, settle, and zoom-out phases together
with long tasks and WebGPU renderer metrics. To exercise HiDPI behavior:

    npm run bench -- --case webgpu-vector-tiles-overzoom --device-scale-factor 2

Compare two checkouts. From the baseline checkout:

    npm run bench -- --out base.json

From the branch:

    npm run bench -- --out head.json
    npm run bench -- --compare base.json head.json

Results are a trimmed mean of several flights. They are comparable only across
runs on the same machine. CI uses a software WebGPU adapter, so those numbers
are not comparable to a local GPU.

The overzoom case deliberately avoids network data. Its seeded source
reproduces source/render tile amplification and preparation churn without an
external PMTiles fixture, keeping local and CI runs self-contained.
