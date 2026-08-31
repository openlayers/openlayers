import {assert} from 'chai';
import LabelView from '../../../../../src/ol/renderer/webgpu/LabelView.js';
import {LABEL_COLLISION_MARGIN} from '../../../../../src/ol/renderer/webgpu/vectorUtil.js';

/**
 * @param {number} pixelRatio Pixel ratio.
 * @return {import('../../../../../src/ol/Map.js').FrameState} Frame.
 */
function frameState(pixelRatio = 2) {
  return /** @type {import('../../../../../src/ol/Map.js').FrameState} */ ({
    pixelRatio,
    size: [400, 300],
    coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
  });
}

/**
 * @param {Object} buffers Label buffers.
 * @param {number} [worldOffset] World offset.
 * @return {LabelView} View over a single source.
 */
function viewOf(buffers, worldOffset = 0) {
  const view = new LabelView();
  view.update([{buffers: /** @type {any} */ (buffers), worldOffset}]);
  return view;
}

describe('ol/renderer/webgpu/LabelView', () => {
  it('maps glyph collision boxes in CSS pixels, ignoring pixelRatio', () => {
    const glyph = {
      x: 100,
      y: 50,
      offsetX: -10,
      offsetY: -5,
      width: 20,
      height: 12,
    };
    const buffers = {
      glyphs: [glyph],
      labels: [
        {minX: 0, minY: 0, maxX: 1, maxY: 1, glyphStart: 0, glyphCount: 1},
      ],
    };
    const retina = viewOf(buffers).toScreen(frameState(2))[0];
    const css = viewOf(buffers).toScreen(frameState(1))[0];
    const margin = LABEL_COLLISION_MARGIN;
    assert.strictEqual(retina.minX, 100 - 10 - margin);
    assert.strictEqual(retina.minY, 50 - 5 - margin);
    assert.strictEqual(retina.maxX, 100 - 10 + 20 + margin);
    assert.strictEqual(retina.maxY, 50 - 5 + 12 + margin);
    assert.deepEqual(
      [retina.minX, retina.minY, retina.maxX, retina.maxY],
      [css.minX, css.minY, css.maxX, css.maxY],
    );
  });

  it('unions glyph quads and inflates with text padding plus margin', () => {
    const buffers = {
      glyphs: [
        {x: 0, y: 0, offsetX: 0, offsetY: 0, width: 10, height: 8},
        {x: 0, y: 0, offsetX: 8, offsetY: -2, width: 10, height: 10},
      ],
      labels: [
        {
          minX: 0,
          minY: 0,
          maxX: 1,
          maxY: 1,
          padding: [1, 2, 3, 4],
          glyphStart: 0,
          glyphCount: 2,
        },
      ],
    };
    const box = viewOf(buffers).toScreen(frameState())[0];
    const margin = LABEL_COLLISION_MARGIN;
    assert.strictEqual(box.minX, 0 - 4 - margin);
    assert.strictEqual(box.minY, -2 - 1 - margin);
    assert.strictEqual(box.maxX, 18 + 2 + margin);
    assert.strictEqual(box.maxY, 8 + 3 + margin);
  });

  it('inflates symbol boxes with the collision margin only', () => {
    const buffers = {
      glyphs: [],
      labels: [
        {
          minX: -5,
          minY: -4,
          maxX: 5,
          maxY: 4,
          glyphCount: 0,
          _anchor: [10, 20],
        },
      ],
    };
    const box = viewOf(buffers).toScreen(frameState(2))[0];
    const margin = LABEL_COLLISION_MARGIN;
    assert.strictEqual(box.minX, 10 - 5 - margin);
    assert.strictEqual(box.minY, 20 - 4 - margin);
    assert.strictEqual(box.maxX, 10 + 5 + margin);
    assert.strictEqual(box.maxY, 20 + 4 + margin);
  });

  it('offsets boxes for a wrapped world without touching the source labels', () => {
    const label = {
      minX: -5,
      minY: -4,
      maxX: 5,
      maxY: 4,
      glyphCount: 0,
      _anchor: [10, 20],
    };
    const buffers = {glyphs: [], labels: [label]};
    const box = viewOf(buffers, -50).toScreen(frameState())[0];
    assert.strictEqual(box.minX, 10 - 50 - 5 - LABEL_COLLISION_MARGIN);
    assert.deepEqual(label._anchor, [10, 20]);
  });

  it('keeps pairs of different tiles independent', () => {
    // pairId is only unique within a tile. Two tiles numbering their pairs
    // from one must not have their labels merged into a single collision box.
    const make = () => ({
      glyphs: [],
      labels: [
        {minX: 0, minY: 0, maxX: 1, maxY: 1, pairId: 1, _anchor: [0, 0]},
        {minX: 0, minY: 0, maxX: 1, maxY: 1, pairId: 2, _anchor: [0, 0]},
      ],
    });
    const view = new LabelView();
    view.update([
      {buffers: /** @type {any} */ (make()), worldOffset: 0},
      {buffers: /** @type {any} */ (make()), worldOffset: 0},
    ]);
    const boxes = view.toScreen(frameState());
    const pairIds = boxes.map((box) => box.pairId);
    assert.strictEqual(new Set(pairIds).size, 4);
    assert.deepEqual(view.starts, [0, 2]);
  });

  it('reuses its boxes between passes', () => {
    const buffers = {
      glyphs: [],
      labels: [{minX: 0, minY: 0, maxX: 1, maxY: 1, _anchor: [0, 0]}],
    };
    const view = viewOf(buffers);
    const first = view.toScreen(frameState())[0];
    const second = view.toScreen(frameState())[0];
    assert.strictEqual(first, second);
  });
});
