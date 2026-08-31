import '../../src/ol/ol.css';

const caseLoaders = import.meta.glob('./cases/*.js');

const cases = (
  await Promise.all(
    Object.entries(caseLoaders).map(async ([file, load]) => {
      const mod = await load();
      if (typeof mod.name !== 'string' || typeof mod.setup !== 'function') {
        throw new Error(`${file} must export a name and a setup function`);
      }
      return mod;
    }),
  )
).sort((a, b) => a.name.localeCompare(b.name));

const params = new URLSearchParams(location.search);
const requested = params.get('case') || cases[0]?.name;
const selected = cases.find((entry) => entry.name === requested);
if (!selected) {
  throw new Error(`Unknown benchmark case: ${requested}`);
}

const caseSelect = /** @type {HTMLSelectElement} */ (
  document.getElementById('case')
);
for (const entry of cases) {
  const option = document.createElement('option');
  option.value = entry.name;
  option.textContent = entry.name;
  option.selected = entry.name === selected.name;
  caseSelect.appendChild(option);
}
caseSelect.addEventListener('change', () => {
  const next = new URL(location.href);
  next.searchParams.set('case', caseSelect.value);
  location.href = next.href;
});

const output = /** @type {HTMLTextAreaElement} */ (
  document.getElementById('output')
);
const summary = /** @type {HTMLElement} */ (document.getElementById('summary'));
const startButton = /** @type {HTMLButtonElement} */ (
  document.getElementById('start')
);

const target = /** @type {HTMLElement} */ (document.getElementById('map'));
const benchmark = await selected.setup(target, params);

/**
 * @param {Object} result Benchmark result.
 */
function show(result) {
  output.value = JSON.stringify(result, null, 2);
  if (result.error) {
    summary.textContent = result.error;
    return;
  }
  const rows = [
    `frames ${result.frames}`,
    `frame p50 ${result.frameMs.p50.toFixed(1)}ms`,
    `p95 ${result.frameMs.p95.toFixed(1)}ms`,
    `p99 ${result.frameMs.p99.toFixed(1)}ms`,
    `cpu p50 ${result.cpuMs.p50.toFixed(1)}ms`,
    `cpu p99 ${result.cpuMs.p99.toFixed(1)}ms`,
    `>20ms ${result.slowFrames20}`,
    `>33ms ${result.slowFrames33}`,
  ];
  summary.textContent = rows.join(' | ');
}

async function start() {
  startButton.disabled = true;
  summary.textContent = 'running...';
  try {
    show(await benchmark.run());
  } finally {
    startButton.disabled = false;
  }
}

startButton.addEventListener('click', start);

// Used by the headless runner.
/** @type {any} */ (window).olBenchmark = benchmark;

if (params.get('autorun') === 'true') {
  start();
}
