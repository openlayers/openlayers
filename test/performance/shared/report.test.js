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
  it('averages frame counts and preserves the worst hitch', () => {
    const report = summarizeRuns([
      {
        devicePixelRatio: 2,
        size: [1024, 768],
        experience: {
          displayMs: 16,
          droppedFrames: 2,
          lateFrames: 4,
          stalls: 0,
          worstGapMs: 40,
        },
      },
      {
        devicePixelRatio: 2,
        size: [1024, 768],
        experience: {
          displayMs: 18,
          droppedFrames: 4,
          lateFrames: 8,
          stalls: 1,
          worstGapMs: 1000,
        },
      },
    ]);

    assert.deepEqual(report, {
      runs: 2,
      missedFrames: 3,
      lateFrames: 6,
      stalls: 1,
      worstFrameMs: 1000,
      displayMs: 17,
      viewport: [1024, 768],
      devicePixelRatio: 2,
    });
  });

  it('creates and validates a versioned report', () => {
    const report = createReport({example: {runs: 1}});
    assert.doesNotThrow(() => validateReport(report));
    assert.throws(() => validateReport({...report, version: 2}));
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
        missedFrames: 2,
        lateFrames: 3,
        stalls: 0,
        worstFrameMs: 40,
        displayMs: 16.7,
      },
    });
    const baseline = createReport({
      example: {
        missedFrames: 1,
        lateFrames: 3,
        stalls: 0,
        worstFrameMs: 50,
        displayMs: 16.7,
      },
    });

    const action = toBenchmarkAction(current);
    assert.lengthOf(action, 4);
    assert.strictEqual(action[0].name, 'example · Missed frames');
    assert.include(formatMarkdown(current, baseline), '| +100.0% |');
  });
});
