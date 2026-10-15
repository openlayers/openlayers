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

## VersaTiles navigation

`versatiles.html` is a full-window WebGPU map of the VersaTiles Colorful style,
for judging navigation by how it feels. The tiles are an offline excerpt and
are not committed.

Fetch the excerpt (zoom levels 12–14 around the focus view, plus the style,
sprites, and Noto Sans), then start the bench server:

    node test/performance/fetch-versatiles.js
    npm run serve-bench

Open `http://127.0.0.1:8123/versatiles.html`. The map starts at the focus view
(`x=1813976.46267`, `y=6141328.17996`, zoom 14.16667). Zooming past 14 overzooms
level 14 tiles, which is as far as the VersaTiles source goes. To use a zip
that was already built:

    node test/performance/fetch-versatiles.js --url https://example.com/versatiles-vienna.zip

The page HUD (press `h` to hide it) shows what the page can see: `requestAnimationFrame`
gaps against the measured refresh interval, and WebGPU queue time from submit
until `onSubmittedWorkDone`. A blue bar is a frame that kept up, a yellow bar is
a late frame, and a red bar is a refresh the animation callback missed. That is
only part of what navigation feels like, because work that finishes late on the
GPU can still miss the screen.

Chrome's own frame classification is recorded separately. This opens the page
in headed Chrome with the browser's frame overlay on (`--show-fps-counter`) and
writes presented, partially presented, and dropped frames:

    node test/performance/record-frames.js

Navigate by hand. Each line printed is about one second: `presented` frames had
every update on screen, `partial` frames were shown with an older map image for
part of the update, and `dropped` frames never appeared. `fps` is presented plus
partial per second, which is the frame rate the overlay shows. Press Enter or
close the window. The JSON (default `test/performance/data/frame-session.json`)
adds the share of frames that were partial or dropped, the longest run of
dropped frames in a row, and the display refresh interval. A long dropped run
is a hitch you can see; a single dropped frame usually is not.

The trace flushes when it stops, so the recorder ends and restarts it about
once a second. Frames during that short pause are not counted. If bundled
Chromium is used instead of system Chrome, set
`PLAYWRIGHT_BROWSERS_PATH` to the machine Playwright cache. `--seconds 20`
ends the session on its own.

## Profile a pan

`profile-pan.js` repeats a drag at one view and writes a V8 CPU profile
summary. The default view is the zoom-15 area where panning drops frames:

    node test/performance/profile-pan.js
    node test/performance/profile-pan.js --pans 4 --view 'x=1813830.60524&y=6141396.74283&z=15&r=0&l=1'

The bench server must already be running, or the script starts one. Output
goes to `test/performance/data/pan-profile.json` (gitignored). `topSelfTime`
is main-thread time inside each function, not including functions it calls.
The HUD lines in that file are the frame rate and missed frames for the same
pans.
