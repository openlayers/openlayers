import {assert} from 'chai';
import {PlacementScheduler} from '../../../../../src/ol/render/webgpu/placement.js';

/**
 * @param {number} xScale Transform x scale.
 * @param {number} xTranslation Transform x translation.
 * @param {boolean} moving Whether the view is animating.
 * @param {number} yScale Transform y scale.
 * @return {import('../../../../../src/ol/Map.js').FrameState} Frame.
 */
function frame(xScale, xTranslation = 0, moving = true, yScale = -xScale) {
  return /** @type {import('../../../../../src/ol/Map.js').FrameState} */ ({
    coordinateToPixelTransform: [xScale, 0, 0, yScale, xTranslation, 0],
    viewHints: [moving ? 1 : 0, 0],
  });
}

describe('ol/render/webgpu/PlacementScheduler', () => {
  it('throttles scale changes while the view is moving', () => {
    const scheduler = new PlacementScheduler();
    const initial = frame(1);
    scheduler.commit('1', 1000, 0, initial);

    assert.isFalse(scheduler.shouldRun('2', 1050, frame(0.75)));
    assert.isTrue(scheduler.isDeferred('2', 1050));
    assert.isTrue(scheduler.shouldRun('2', 1200, frame(0.5)));
  });

  it('does not throttle the final placement after the view settles', () => {
    const scheduler = new PlacementScheduler();
    scheduler.commit('1', 1000, 50, frame(1));

    assert.isTrue(scheduler.shouldRun('2', 1001, frame(0.5, 0, false)));
  });

  it('does not place again for translation alone', () => {
    const scheduler = new PlacementScheduler();
    scheduler.commit('1', 1000, 0, frame(1));

    assert.isFalse(scheduler.shouldRun('1', 1001, frame(1, 1000)));
    assert.isFalse(scheduler.shouldRun('1', 1001, frame(1, 1000, false)));
  });
});
