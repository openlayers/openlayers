import {assert} from 'chai';
import {percentile, summarize, trimmedMean} from './stats.js';

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
});
