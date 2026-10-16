import '../../../src/ol/ol.css';
import {
  createReport,
  REPORT_METRICS,
  summarizeRuns,
  validateReport,
} from '../shared/report.js';
import {startFrameRateDisplay} from './frame-rate-display.js';

const caseLoaders = import.meta.glob('../cases/*.js');

const cases = (
  await Promise.all(
    Object.entries(caseLoaders).map(async ([file, load]) => {
      const mod = await load();
      if (typeof mod.name !== 'string' || typeof mod.setup !== 'function') {
        throw new Error(`${file} must export a name and a setup function`);
      }
      return {...mod, title: mod.title || mod.name};
    }),
  )
).sort(
  (a, b) =>
    (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name),
);

const params = new URLSearchParams(location.search);
const requested = params.get('case') || cases[0]?.name;
const selected = cases.find((entry) => entry.name === requested);
if (!selected) {
  throw new Error(`Unknown benchmark case: ${requested}`);
}

const casesElement = /** @type {HTMLElement} */ (
  document.getElementById('cases')
);
const runsInput = /** @type {HTMLInputElement} */ (
  document.getElementById('runs')
);
const runAllButton = /** @type {HTMLButtonElement} */ (
  document.getElementById('run-all')
);
const target = /** @type {HTMLElement} */ (document.getElementById('map'));
const mapTitle = /** @type {HTMLElement} */ (
  document.getElementById('map-title')
);
const mapStatus = /** @type {HTMLElement} */ (
  document.getElementById('map-status')
);
const mapMessage = /** @type {HTMLElement} */ (
  document.getElementById('map-message')
);
const details = /** @type {HTMLElement} */ (document.getElementById('details'));
const reportHead = /** @type {HTMLElement} */ (
  document.getElementById('report-head')
);
const reportBody = /** @type {HTMLElement} */ (
  document.getElementById('report-body')
);
const downloadButton = /** @type {HTMLButtonElement} */ (
  document.getElementById('download')
);
const baselineInput = /** @type {HTMLInputElement} */ (
  document.getElementById('baseline')
);
const comparison = /** @type {HTMLElement} */ (
  document.getElementById('comparison')
);

/** @type {Object<string, Object>} */
const caseReports = {};
/** @type {Object<string, HTMLElement>} */
const caseRows = {};
/** @type {Object|null} */
let baseline = null;
/** File name of the loaded baseline report. */
let baselineName = '';
/** @type {Object|null} */
let currentBenchmark = null;
/** @type {AbortController|null} */
let runController = null;
let prepareGeneration = 0;
let currentCase = '';
let busy = false;

startFrameRateDisplay(
  /** @type {HTMLElement} */ (document.getElementById('map-heading')),
);

for (const entry of cases) {
  const row = document.createElement('div');
  row.className = 'case';
  const name = document.createElement('div');
  name.className = 'case-name';
  name.textContent = entry.title;
  name.title = entry.name;
  const status = document.createElement('div');
  status.className = 'case-status';
  status.textContent = 'Ready';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Run';
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    if (busy) {
      requestStop();
      return;
    }
    runCase(entry);
  });
  row.addEventListener('click', () => {
    if (!busy) {
      prepare(entry);
    }
  });
  row.append(name, button, status);
  casesElement.append(row);
  caseRows[entry.name] = row;
}

/**
 * @param {Object} entry Case module.
 * @param {string} text Status.
 */
function setCaseStatus(entry, text) {
  const status = caseRows[entry.name].querySelector('.case-status');
  status.textContent = text;
}

/**
 * @param {Object} entry Case module.
 */
function markSelected(entry) {
  for (const [name, row] of Object.entries(caseRows)) {
    const selected = name === entry.name;
    row.classList.toggle('case-selected', selected);
    if (selected) {
      row.setAttribute('aria-current', 'true');
    } else {
      row.removeAttribute('aria-current');
    }
  }
}

/**
 * @param {Object} [activeEntry] Case whose flight can be stopped.
 * @param {boolean} [runningAll] Whether the whole suite is running.
 */
function setRunning(activeEntry, runningAll) {
  busy = true;
  casesElement.classList.add('is-running');
  runsInput.disabled = true;
  runAllButton.textContent = runningAll ? 'Stop' : 'Run all';
  runAllButton.disabled = !runningAll;
  for (const [name, row] of Object.entries(caseRows)) {
    const button = row.querySelector('button');
    const active = name === activeEntry?.name;
    button.disabled = !active;
    button.textContent = active ? 'Stop' : 'Run';
  }
}

function setIdle() {
  busy = false;
  casesElement.classList.remove('is-running');
  runController = null;
  runsInput.disabled = false;
  runAllButton.disabled = false;
  runAllButton.textContent = 'Run all';
  for (const row of Object.values(caseRows)) {
    const button = row.querySelector('button');
    button.disabled = false;
    button.textContent = 'Run';
  }
}

function requestStop() {
  runController?.abort();
}

/**
 * Show the prepared case in the address bar without dropping other parameters.
 * @param {Object} entry Case module.
 */
function showCaseInUrl(entry) {
  const next = new URLSearchParams(location.search);
  if (next.get('case') === entry.name) {
    return;
  }
  next.set('case', entry.name);
  const query = next.toString();
  history.replaceState(
    null,
    '',
    `${location.pathname}?${query}${location.hash}`,
  );
}

/**
 * @param {Object} entry Case module.
 * @return {Promise<Object>} Prepared benchmark.
 */
async function prepare(entry) {
  markSelected(entry);
  showCaseInUrl(entry);
  if (currentCase === entry.name && currentBenchmark) {
    return currentBenchmark;
  }
  const generation = ++prepareGeneration;
  currentBenchmark?.dispose?.();
  currentBenchmark = null;
  currentCase = entry.name;
  target.replaceChildren();
  mapTitle.textContent = entry.title;
  mapStatus.textContent = 'Preparing map…';
  mapMessage.hidden = true;
  const benchmark = await entry.setup(target, params);
  if (generation !== prepareGeneration) {
    benchmark.dispose?.();
    return currentBenchmark;
  }
  currentBenchmark = benchmark;
  if (benchmark.unavailable) {
    mapStatus.textContent = 'Unavailable';
    mapMessage.textContent = benchmark.unavailable;
    mapMessage.hidden = false;
    setCaseStatus(entry, benchmark.unavailable);
  } else {
    mapStatus.textContent = 'Ready to run';
  }
  return benchmark;
}

/**
 * @param {Object} entry Case module.
 */
async function runCase(entry) {
  if (busy) {
    return;
  }
  const controller = new AbortController();
  runController = controller;
  setRunning(entry, false);
  try {
    await measureCase(entry, controller.signal);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setCaseStatus(entry, message);
    mapStatus.textContent = message;
  } finally {
    setIdle();
  }
}

/**
 * @param {Object} entry Case module.
 * @param {AbortSignal} signal Signal that stops the flight.
 * @return {Promise<boolean>} Whether the suite should continue.
 */
async function measureCase(entry, signal) {
  setRunning(entry, runAllButton.textContent === 'Stop');
  const benchmark = await prepare(entry);
  if (signal.aborted) {
    stopCase(entry);
    return false;
  }
  if (benchmark?.unavailable) {
    return true;
  }
  const runCount = Math.max(1, Math.min(20, Number(runsInput.value) || 5));
  runsInput.value = String(runCount);
  setCaseStatus(entry, 'Warm-up flight…');
  mapStatus.textContent = 'Warm-up flight';
  const warmup = await benchmark.run(signal);
  if (stopped(signal, warmup)) {
    stopCase(entry);
    return false;
  }
  if (warmup.error) {
    throw new Error(warmup.error);
  }
  const runs = [];
  for (let i = 0; i < runCount; ++i) {
    if (signal.aborted) {
      stopCase(entry);
      return false;
    }
    setCaseStatus(entry, `Measured flight ${i + 1} of ${runCount}…`);
    mapStatus.textContent = `Measured flight ${i + 1} of ${runCount}`;
    const result = await benchmark.run(signal);
    if (stopped(signal, result)) {
      stopCase(entry);
      return false;
    }
    if (result.error) {
      throw new Error(result.error);
    }
    runs.push(result);
    details.textContent = JSON.stringify(result, null, 2);
  }
  caseReports[entry.name] = summarizeRuns(runs);
  mapStatus.textContent = 'Complete';
  showCaseResult(entry, caseReports[entry.name]);
  renderReport();
  return true;
}

/**
 * @param {AbortSignal} signal Signal that stops the flight.
 * @param {Object} [result] Flight result.
 * @return {boolean} Whether the flight was stopped.
 */
function stopped(signal, result) {
  return signal.aborted || result?.cancelled === true;
}

/**
 * @param {Object} entry Case module.
 */
function stopCase(entry) {
  setCaseStatus(entry, 'Stopped');
  mapStatus.textContent = 'Stopped';
}

/**
 * @param {Object} entry Case module.
 * @param {Object} report Case report.
 */
function showCaseResult(entry, report) {
  setCaseStatus(entry, `${report.runs} measured runs`);
  caseRows[entry.name].querySelector('.case-result')?.remove();
  const result = document.createElement('div');
  result.className = 'case-result';
  for (const metric of REPORT_METRICS) {
    const item = document.createElement('div');
    item.className = 'metric';
    item.textContent = metric.label;
    const value = document.createElement('strong');
    value.textContent = formatValue(metric.key, report[metric.key]);
    item.append(value);
    result.append(item);
  }
  caseRows[entry.name].append(result);
}

/**
 * @param {string} key Metric key.
 * @param {number} value Metric value.
 * @return {string} Formatted value.
 */
function formatValue(key, value) {
  return key === 'worstFrameMs' ? value.toFixed(1) : value.toFixed(2);
}

/**
 * Classifies a change in a smaller-is-better metric. Values that format to the
 * same text are unchanged, so rounding noise is not reported as a change.
 * @param {string} key Metric key.
 * @param {number} previous Baseline value.
 * @param {number} value Current value.
 * @return {'better'|'worse'|'unchanged'} Direction of the change.
 */
function changeDirection(key, previous, value) {
  if (formatValue(key, previous) === formatValue(key, value)) {
    return 'unchanged';
  }
  return value < previous ? 'better' : 'worse';
}

/**
 * Builds a report cell. With a baseline, the cell also says whether the value
 * got better or worse, by how much in the column's unit, and what it was.
 * @param {string} key Metric key.
 * @param {number} value Current value.
 * @param {number|undefined} previous Baseline value, if the baseline has one.
 * @return {HTMLTableCellElement} Cell.
 */
function metricCell(key, value, previous) {
  const cell = document.createElement('td');
  const current = document.createElement('strong');
  current.textContent = formatValue(key, value);
  cell.append(current);
  if (!baseline) {
    return cell;
  }
  const change = document.createElement('small');
  change.className = 'change';
  cell.append(change);
  if (typeof previous !== 'number') {
    change.textContent = 'not in baseline';
    return cell;
  }
  const direction = changeDirection(key, previous, value);
  cell.classList.add(`change-${direction}`);
  const difference = formatValue(key, Math.abs(value - previous));
  change.textContent =
    direction === 'unchanged'
      ? 'unchanged'
      : `${direction === 'better' ? '▼' : '▲'} ${direction} by ${difference}`;
  const was = document.createElement('small');
  was.textContent = `was ${formatValue(key, previous)}`;
  cell.append(was);
  return cell;
}

/**
 * Summarizes the comparison above the table, so the overall outcome and any
 * reason to distrust it are visible without reading every cell.
 */
function renderComparison() {
  comparison.hidden = !baseline;
  if (!baseline) {
    return;
  }
  const counts = {better: 0, worse: 0, unchanged: 0};
  const intervalChanged = [];
  for (const [name, report] of Object.entries(caseReports)) {
    const previous = baseline.cases?.[name];
    if (!previous) {
      continue;
    }
    for (const metric of REPORT_METRICS) {
      if (typeof previous[metric.key] !== 'number') {
        continue;
      }
      ++counts[
        changeDirection(metric.key, previous[metric.key], report[metric.key])
      ];
    }
    if (Math.abs(report.displayMs - previous.displayMs) > 0.5) {
      intervalChanged.push(
        cases.find((entry) => entry.name === name)?.title || name,
      );
    }
  }
  const lines = [
    `Compared with ${baselineName}. Smaller is better: ▼ better, ▲ worse.`,
  ];
  if (Object.keys(caseReports).length) {
    lines.push(
      `${counts.better} better, ${counts.worse} worse, ${counts.unchanged} unchanged.`,
    );
  } else {
    lines.push('Run cases to compare them.');
  }
  if (intervalChanged.length) {
    lines.push(
      `The display interval differs for ${intervalChanged.join(', ')}; compare those with caution.`,
    );
  }
  comparison.replaceChildren(
    ...lines.map((line) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = line;
      return paragraph;
    }),
  );
}

function renderReport() {
  reportHead.replaceChildren();
  reportBody.replaceChildren();
  const heading = document.createElement('tr');
  for (const label of [
    'Case',
    ...REPORT_METRICS.map((metric) => metric.label),
  ]) {
    const cell = document.createElement('th');
    cell.textContent = label;
    heading.append(cell);
  }
  reportHead.append(heading);
  for (const [name, report] of Object.entries(caseReports)) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent =
      cases.find((entry) => entry.name === name)?.title || name;
    row.append(nameCell);
    for (const metric of REPORT_METRICS) {
      row.append(
        metricCell(
          metric.key,
          report[metric.key],
          baseline?.cases?.[name]?.[metric.key],
        ),
      );
    }
    reportBody.append(row);
  }
  renderComparison();
  downloadButton.disabled = !Object.keys(caseReports).length;
}

// Used by the headless runner.
const benchmark = await prepare(selected);
/** @type {any} */ (window).olBenchmark = benchmark;

runAllButton.addEventListener('click', async () => {
  if (busy) {
    requestStop();
    return;
  }
  const controller = new AbortController();
  runController = controller;
  setRunning(undefined, true);
  try {
    for (const entry of cases) {
      try {
        const keepGoing = await measureCase(entry, controller.signal);
        if (!keepGoing) {
          break;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setCaseStatus(entry, message);
        mapStatus.textContent = message;
        break;
      }
    }
  } finally {
    setIdle();
  }
});

downloadButton.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(createReport(caseReports), null, 2)], {
    type: 'application/json',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'openlayers-performance.json';
  link.click();
  URL.revokeObjectURL(link.href);
});

baselineInput.addEventListener('change', async () => {
  const [file] = baselineInput.files || [];
  if (!file) {
    return;
  }
  try {
    const candidate = JSON.parse(await file.text());
    validateReport(candidate);
    baseline = candidate;
    baselineName = file.name;
    renderReport();
  } catch (error) {
    comparison.hidden = false;
    comparison.textContent = `Could not compare with ${file.name}: ${
      /** @type {Error} */ (error).message
    }.`;
  } finally {
    baselineInput.value = '';
  }
});

renderReport();
