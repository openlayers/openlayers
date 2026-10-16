export const REPORT_VERSION = 2;

export const REPORT_METRICS = [
  {
    key: 'missedFramePercent',
    label: 'Missed frames (%)',
    unit: '%',
    aggregate: 'mean',
  },
  {
    key: 'lateFramePercent',
    label: 'Late frames (%)',
    unit: '%',
    aggregate: 'mean',
  },
  {key: 'stalls', label: 'Stalls', unit: 'frames', aggregate: 'max'},
  {
    key: 'worstFrameMs',
    label: 'Worst frame (ms)',
    unit: 'ms',
    aggregate: 'max',
  },
];

/**
 * @param {Array<number>} values Values.
 * @return {number} Mean.
 */
function mean(values) {
  return values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;
}

/**
 * @param {number} part Counted frames.
 * @param {number} whole Frames they are counted out of.
 * @return {number} Percentage, or 0 when nothing was counted.
 */
function percent(part, whole) {
  return whole > 0 ? (part / whole) * 100 : 0;
}

/**
 * Missed frames are a share of the display refreshes during the flight, which
 * are the presented frames plus the refreshes that were skipped between them.
 * Late frames are a share of the presented frames.
 * @param {Array<Object>} runs Measured flights, excluding the warm-up flight.
 * @return {Object} Comparable case report.
 */
export function summarizeRuns(runs) {
  if (!runs.length) {
    throw new Error('cannot summarize a benchmark without measured runs');
  }
  const experiences = runs.map((run) => run.experience);
  return {
    runs: runs.length,
    missedFramePercent: mean(
      experiences.map((experience) =>
        percent(
          experience.droppedFrames,
          experience.frames + experience.droppedFrames,
        ),
      ),
    ),
    lateFramePercent: mean(
      experiences.map((experience) =>
        percent(experience.lateFrames, experience.frames),
      ),
    ),
    stalls: Math.max(...experiences.map((experience) => experience.stalls)),
    worstFrameMs: Math.max(
      ...experiences.map((experience) => experience.worstGapMs),
    ),
    displayMs: mean(experiences.map((experience) => experience.displayMs)),
    viewport: runs[0].size,
    devicePixelRatio: runs[0].devicePixelRatio,
  };
}

/**
 * @param {Object<string, Object>} cases Case reports.
 * @return {{version: number, cases: Object<string, Object>}} Report.
 */
export function createReport(cases) {
  return {version: REPORT_VERSION, cases};
}

/**
 * @param {number} base Baseline value.
 * @param {number} candidate Candidate value.
 * @return {number} Percent change.
 */
export function percentChange(base, candidate) {
  if (base === 0) {
    return candidate === 0 ? 0 : Infinity;
  }
  return ((candidate - base) / base) * 100;
}

/**
 * @param {Object} report Report.
 */
export function validateReport(report) {
  if (report.version !== REPORT_VERSION || !report.cases) {
    throw new Error(`expected benchmark report version ${REPORT_VERSION}`);
  }
}

/**
 * @param {Object} report Report.
 * @return {Array<{name: string, unit: string, value: number, extra: string}>} Custom benchmark data.
 */
export function toBenchmarkAction(report) {
  validateReport(report);
  const data = [];
  for (const [caseName, result] of Object.entries(report.cases)) {
    for (const metric of REPORT_METRICS) {
      data.push({
        name: `${caseName} · ${metric.label}`,
        unit: metric.unit,
        value: result[metric.key],
        extra: `${result.runs} runs · ${result.displayMs.toFixed(1)} ms display interval`,
      });
    }
  }
  return data;
}

/**
 * @param {Object} report Current report.
 * @param {Object|null} baseline Previous report.
 * @return {string} GitHub-flavored Markdown.
 */
export function formatMarkdown(report, baseline = null) {
  validateReport(report);
  if (baseline) {
    validateReport(baseline);
  }
  const lines = [
    '## Rendering performance',
    '',
    '| Case | Metric | Current | Baseline | Change |',
    '| --- | --- | ---: | ---: | ---: |',
  ];
  for (const [caseName, result] of Object.entries(report.cases)) {
    for (const metric of REPORT_METRICS) {
      const value = result[metric.key];
      const previous = baseline?.cases?.[caseName]?.[metric.key];
      const baselineText =
        typeof previous === 'number' ? previous.toFixed(2) : '—';
      const change =
        typeof previous === 'number' ? percentChange(previous, value) : null;
      const changeText =
        change === null ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
      lines.push(
        `| ${caseName} | ${metric.label} | ${value.toFixed(2)} | ${baselineText} | ${changeText} |`,
      );
    }
    const baselineDisplay = baseline?.cases?.[caseName]?.displayMs;
    if (
      typeof baselineDisplay === 'number' &&
      Math.abs(result.displayMs - baselineDisplay) > 0.5
    ) {
      lines.push(
        `| ${caseName} | Display interval changed | ${result.displayMs.toFixed(1)} ms | ${baselineDisplay.toFixed(1)} ms | compare with caution |`,
      );
    }
  }
  lines.push(
    '',
    'Smaller is better. Local results are comparable only on the same machine; this baseline is from CI.',
  );
  return lines.join('\n');
}
