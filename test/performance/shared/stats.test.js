import {assert} from 'chai';
import {DEFAULT_DISPLAY_MS, frameExperience, median} from './stats.js';

describe('test/performance/shared/stats', () => {
  describe('median()', () => {
    it('reports the middle sample', () => {
      assert.strictEqual(median([30, 10, 20]), 20);
      assert.strictEqual(median([]), 0);
    });
  });

  describe('frameExperience()', () => {
    it('treats a steady 30 Hz cadence as keeping up', () => {
      const gaps = Array.from({length: 90}, () => 33.3);
      const experience = frameExperience(gaps, 33.3);

      assert.strictEqual(experience.frames, 90);
      assert.strictEqual(experience.displayMs, 33.3);
      assert.strictEqual(experience.lateFrames, 0);
      assert.strictEqual(experience.droppedFrames, 0);
      assert.strictEqual(experience.stalls, 0);
      assert.closeTo(experience.worstGapMs, 33.3, 1e-9);
    });

    it('preserves one long gap as a stall and the worst frame', () => {
      const gaps = Array.from({length: 100}, () => 33.3);
      gaps.push(180);
      const experience = frameExperience(gaps, 33.3);

      assert.strictEqual(experience.lateFrames, 1);
      assert.strictEqual(experience.droppedFrames, 4);
      assert.strictEqual(experience.stalls, 1);
      assert.strictEqual(experience.worstGapMs, 180);
    });

    it('counts a missed 60 Hz frame without calling a short gap a stall', () => {
      const experience = frameExperience([16.7, 40], 16.7);

      assert.strictEqual(experience.lateFrames, 1);
      assert.strictEqual(experience.droppedFrames, 1);
      assert.strictEqual(experience.stalls, 0);
      assert.strictEqual(experience.worstGapMs, 40);
    });

    it('does not count a gap of exactly 100 ms as a stall', () => {
      const experience = frameExperience([100], 16.7);

      assert.strictEqual(experience.stalls, 0);
      assert.strictEqual(experience.worstGapMs, 100);
    });

    it('falls back to the 60 fps budget when the display interval is missing', () => {
      const experience = frameExperience([], 0);

      assert.strictEqual(experience.displayMs, DEFAULT_DISPLAY_MS);
      assert.strictEqual(experience.frames, 0);
      assert.strictEqual(experience.lateFrames, 0);
    });
  });
});
