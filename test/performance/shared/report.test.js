import {assert} from 'chai';
import {
  createReport,
  formatMarkdown,
  percentChange,
  summarizeRuns,
  toBenchmarkAction,
  validateReport,
} from './report.js';

describe('test/performance/shared/report', () => {
  it('averages frame percentages and preserves the worst hitch', () => {
    const report = summarizeRuns([
      {
        devicePixelRatio: 2,
        size: [1024, 768],
        experience: {
          frames: 98,
          displayMs: 16,
          droppedFrames: 2,
          lateFrames: 49,
          stalls: 0,
          worstGapMs: 40,
        },
        phases: [
          {
            name: 'zoom',
            experience: {
              frames: 49,
              displayMs: 16,
              droppedFrames: 1,
              lateFrames: 20,
              stalls: 0,
              worstGapMs: 32,
            },
          },
        ],
      },
      {
        devicePixelRatio: 2,
        size: [1024, 768],
        experience: {
          frames: 60,
          displayMs: 18,
          droppedFrames: 15,
          lateFrames: 6,
          stalls: 1,
          worstGapMs: 1000,
        },
        phases: [
          {
            name: 'zoom',
            experience: {
              frames: 30,
              displayMs: 18,
              droppedFrames: 5,
              lateFrames: 3,
              stalls: 1,
              worstGapMs: 200,
            },
          },
        ],
      },
    ]);

    assert.deepEqual(report, {
      runs: 2,
      missedFramePercent: 11,
      lateFramePercent: 30,
      stalls: 1,
      worstFrameMs: 1000,
      displayMs: 17,
      longTasks: 0,
      blockingMs: 0,
      settleMs: 0,
      phases: {
        zoom: {
          missedFramePercent: 8.142857142857142,
          lateFramePercent: 25.408163265306122,
          stalls: 1,
          worstFrameMs: 200,
          displayMs: 17,
          longTasks: 0,
          blockingMs: 0,
          settleMs: 0,
        },
      },
      viewport: [1024, 768],
      devicePixelRatio: 2,
    });
  });

  it('keeps the worst GPU memory and averages GPU work', () => {
    const experience = {
      frames: 10,
      displayMs: 16,
      droppedFrames: 0,
      lateFrames: 0,
      stalls: 0,
      worstGapMs: 16,
    };
    const gpu = (peakMB, retainedMB, writeBufferCalls) => ({
      peakMB,
      retainedMB,
      allocations: 4,
      writeBufferCalls,
      writeBufferMB: 1,
      textureUploadMB: 0,
      submits: 10,
    });
    const report = summarizeRuns([
      {experience, gpu: gpu(30, 20, 100), phases: []},
      {experience, gpu: gpu(40, 10, 200), phases: []},
    ]);

    assert.include(report, {
      gpuPeakMB: 40,
      gpuRetainedMB: 20,
      gpuAllocations: 4,
      writeBufferCalls: 150,
      writeBufferMB: 1,
      textureUploadMB: 0,
    });
    assert.notProperty(
      summarizeRuns([{experience, phases: []}]),
      'writeBufferCalls',
    );
  });

  it('creates and validates a versioned report', () => {
    const report = createReport({example: {runs: 1}});
    assert.doesNotThrow(() => validateReport(report));
    assert.throws(() => validateReport({...report, version: 1}));
  });

  it('calculates percent changes including a zero baseline', () => {
    assert.strictEqual(percentChange(10, 12), 20);
    assert.strictEqual(percentChange(0, 0), 0);
    assert.strictEqual(percentChange(0, 1), Infinity);
  });

  it('formats CI data and a baseline comparison', () => {
    const current = createReport({
      example: {
        runs: 5,
        missedFramePercent: 2,
        lateFramePercent: 3,
        stalls: 0,
        worstFrameMs: 40,
        displayMs: 16.7,
        longTasks: 0,
        blockingMs: 0,
        settleMs: 0,
        phases: {
          'animated-zoom': {
            missedFramePercent: 4,
            lateFramePercent: 5,
            stalls: 0,
            worstFrameMs: 30,
            displayMs: 16.7,
            longTasks: 0,
            blockingMs: 0,
            settleMs: 0,
          },
        },
      },
    });
    const baseline = createReport({
      example: {
        missedFramePercent: 1,
        lateFramePercent: 3,
        stalls: 0,
        worstFrameMs: 50,
        displayMs: 16.7,
      },
    });

    const action = toBenchmarkAction(current);
    assert.lengthOf(action, 14);
    assert.strictEqual(action[0].name, 'example · Missed frames (%)');
    assert.strictEqual(action[0].unit, '%');
    assert.strictEqual(
      action[7].name,
      'example · animated-zoom · Missed frames (%)',
    );
    assert.include(formatMarkdown(current, baseline), '| +100.0% |');
  });
});
