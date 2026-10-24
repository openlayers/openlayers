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
  {
    key: 'longTasks',
    label: 'Long tasks',
    unit: 'tasks',
    aggregate: 'mean',
  },
  {
    key: 'blockingMs',
    label: 'Blocking time (ms)',
    unit: 'ms',
    aggregate: 'mean',
  },
  {
    key: 'settleMs',
    label: 'Settle time (ms)',
    unit: 'ms',
    aggregate: 'mean',
  },
  // WebGPU cases only. Other cases leave these out of their summaries.
  {
    key: 'gpuPeakMB',
    label: 'Peak GPU memory (MB)',
    unit: 'MB',
    aggregate: 'max',
  },
  {
    key: 'gpuRetainedMB',
    label: 'Retained GPU memory (MB)',
    unit: 'MB',
    aggregate: 'max',
  },
  {
    key: 'gpuAllocations',
    label: 'GPU allocations',
    unit: 'allocations',
    aggregate: 'mean',
  },
  {
    key: 'writeBufferCalls',
    label: 'writeBuffer calls',
    unit: 'calls',
    aggregate: 'mean',
  },
  {
    key: 'writeBufferMB',
    label: 'writeBuffer (MB)',
    unit: 'MB',
    aggregate: 'mean',
  },
  {
    key: 'textureUploadMB',
    label: 'Texture uploads (MB)',
    unit: 'MB',
    aggregate: 'mean',
  },
];

/**
 * Phases important enough to publish as CI timeline metrics. All phases remain
 * in the JSON report and command-line comparison.
 */
const PUBLISHED_PHASES = new Set(['animated-zoom']);

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
 * @param {Array<Object>} results Flights or phases, each with an `experience`
 * and an optional `settleMs`.
 * @return {Object} Comparable metrics.
 */
function summarizeExperiences(results) {
  const experiences = results.map((result) => result.experience);
  return {
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
    longTasks: mean(experiences.map((experience) => experience.longTasks ?? 0)),
    blockingMs: mean(
      experiences.map((experience) => experience.blockingMs ?? 0),
    ),
    settleMs: mean(results.map((result) => result.settleMs ?? 0)),
    ...summarizeGpuUsage(results),
  };
}

/**
 * @param {Array<Object>} results Flights or phases, each with an optional `gpu`.
 * @return {Object} GPU metrics, or none unless every result has GPU usage.
 */
function summarizeGpuUsage(results) {
  if (!results.every((result) => result.gpu)) {
    return {};
  }
  const usages = results.map((result) => result.gpu);
  return {
    gpuPeakMB: Math.max(...usages.map((usage) => usage.peakMB)),
    gpuRetainedMB: Math.max(...usages.map((usage) => usage.retainedMB)),
    gpuAllocations: mean(usages.map((usage) => usage.allocations)),
    writeBufferCalls: mean(usages.map((usage) => usage.writeBufferCalls)),
    writeBufferMB: mean(usages.map((usage) => usage.writeBufferMB)),
    textureUploadMB: mean(usages.map((usage) => usage.textureUploadMB)),
  };
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
  /** @type {Object<string, Object>} */
  const phases = {};
  for (const first of runs[0].phases ?? []) {
    const matching = runs
      .map((run) => run.phases?.find((phase) => phase.name === first.name))
      .filter(Boolean);
    if (matching.length === runs.length) {
      phases[first.name] = summarizeExperiences(matching);
    }
  }
  return {
    runs: runs.length,
    ...summarizeExperiences(runs),
    phases,
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
    const summaries = [
      [caseName, result],
      ...Object.entries(result.phases || {})
        .filter(([phase]) => PUBLISHED_PHASES.has(phase))
        .map(([phase, summary]) => [`${caseName} · ${phase}`, summary]),
    ];
    for (const [name, summary] of summaries) {
      for (const metric of REPORT_METRICS) {
        if (typeof summary[metric.key] !== 'number') {
          continue;
        }
        data.push({
          name: `${name} · ${metric.label}`,
          unit: metric.unit,
          value: summary[metric.key],
          extra: `${result.runs} runs · ${summary.displayMs.toFixed(1)} ms display interval`,
        });
      }
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
    const summaries = [
      [caseName, result, baseline?.cases?.[caseName]],
      ...Object.entries(result.phases || {})
        .filter(([phase]) => PUBLISHED_PHASES.has(phase))
        .map(([phase, summary]) => [
          `${caseName} · ${phase}`,
          summary,
          baseline?.cases?.[caseName]?.phases?.[phase],
        ]),
    ];
    for (const [name, summary, previousSummary] of summaries) {
      for (const metric of REPORT_METRICS) {
        const value = summary[metric.key];
        if (typeof value !== 'number') {
          continue;
        }
        const previous = previousSummary?.[metric.key];
        const baselineText =
          typeof previous === 'number' ? previous.toFixed(2) : '—';
        const change =
          typeof previous === 'number' ? percentChange(previous, value) : null;
        const changeText =
          change === null
            ? '—'
            : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        lines.push(
          `| ${name} | ${metric.label} | ${value.toFixed(2)} | ${baselineText} | ${changeText} |`,
        );
      }
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
