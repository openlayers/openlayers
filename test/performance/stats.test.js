import {assert} from 'chai';
import {
  FRAME_BUDGET_MS,
  formatExperience,
  frameExperience,
  percentile,
  summarize,
  trimmedMean,
} from './stats.js';

describe('test/performance/stats', () => {
  describe('trimmedMean()', () => {
    it('drops the fastest and slowest sample', () => {
      assert.strictEqual(trimmedMean([1, 5, 2, 4, 3]), 3);
    });

    it('uses a plain mean when there are fewer than three samples', () => {
      assert.strictEqual(trimmedMean([1, 2]), 1.5);
      assert.strictEqual(trimmedMean([]), 0);
    });

    it('ignores values that are not numbers', () => {
      assert.strictEqual(trimmedMean([1, undefined, 3, 5]), 3);
    });
  });

  describe('summarize()', () => {
    it('reports the median and the extremes', () => {
      const summary = summarize([30, 10, 20]);
      assert.strictEqual(summary.mean, 20);
      assert.strictEqual(summary.p50, 20);
      assert.strictEqual(summary.max, 30);
      assert.strictEqual(percentile([10, 20, 30], 0), 10);
    });

    it('returns zeros for an empty sample', () => {
      const summary = summarize([]);
      assert.strictEqual(summary.mean, 0);
      assert.strictEqual(summary.p50, 0);
      assert.strictEqual(summary.max, 0);
    });
  });

  describe('frameExperience()', () => {
    it('treats a steady 30 Hz cadence as keeping up', () => {
      const gaps = Array.from({length: 90}, () => 33.3);
      const work = [2.4, 4, 8];
      const experience = frameExperience(gaps, work, 33.3);

      assert.strictEqual(experience.frames, 90);
      assert.strictEqual(experience.displayMs, 33.3);
      assert.strictEqual(experience.lateFrames, 0);
      assert.strictEqual(experience.droppedFrames, 0);
      assert.strictEqual(experience.stalls, 0);
      assert.strictEqual(experience.stallMs, 0);
      assert.strictEqual(experience.overBudget, 0);
      assert.closeTo(experience.gaps.p99, 33.3, 1e-9);
    });

    it('counts one long gap as a stall even when p99 stays on cadence', () => {
      const gaps = Array.from({length: 100}, () => 33.3);
      gaps.push(180);
      const experience = frameExperience(gaps, [4], 33.3);

      assert.closeTo(experience.gaps.p99, 33.3, 1e-9);
      assert.strictEqual(experience.lateFrames, 1);
      assert.strictEqual(experience.droppedFrames, 4);
      assert.strictEqual(experience.stalls, 1);
      assert.strictEqual(experience.worstGapMs, 180);
      assert.strictEqual(experience.stallMs, 180);
    });

    it('counts a missed 60 Hz frame without calling a short gap a stall', () => {
      const experience = frameExperience([16.7, 40], [10], 16.7);

      assert.strictEqual(experience.lateFrames, 1);
      assert.strictEqual(experience.droppedFrames, 1);
      assert.strictEqual(experience.stalls, 0);
      assert.strictEqual(experience.worstGapMs, 40);
    });

    it('counts render work that cannot sustain 60 fps', () => {
      const experience = frameExperience(
        [33.3],
        [FRAME_BUDGET_MS, FRAME_BUDGET_MS + 0.1, 2],
        33.3,
      );

      assert.strictEqual(experience.overBudget, 1);
      assert.strictEqual(experience.lateFrames, 0);
    });

    it('does not count a gap of exactly 100 ms as a stall', () => {
      const experience = frameExperience([100], [], 16.7);

      assert.strictEqual(experience.stalls, 0);
      assert.strictEqual(experience.stallMs, 0);
      assert.strictEqual(experience.worstGapMs, 100);
    });

    it('falls back to the 60 fps budget when the display interval is missing', () => {
      const experience = frameExperience([], [], 0);

      assert.strictEqual(experience.displayMs, FRAME_BUDGET_MS);
      assert.strictEqual(experience.frames, 0);
      assert.strictEqual(experience.lateFrames, 0);
      assert.strictEqual(experience.overBudget, 0);
    });
  });

  describe('formatExperience()', () => {
    it('names gaps as presented-frame intervals and work against the 60 fps budget', () => {
      const lines = formatExperience(frameExperience([33.3], [2.4], 33.3));

      assert.include(lines[0], '30 Hz');
      assert.include(lines[1], 'presented-frame interval');
      assert.include(lines[2], 'stalls 0');
      assert.include(lines[3], `over ${FRAME_BUDGET_MS.toFixed(1)}ms: 0`);
    });
  });
});
