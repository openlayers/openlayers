import {assert} from 'chai';
import {createCanvasContext2D} from '../../../../../../src/ol/dom.js';
import ZIndexContext from '../../../../../../src/ol/render/canvas/ZIndexContext.js';

describe('ol/render/canvas/ZIndexContext', () => {
  let target;
  beforeEach(() => {
    target = createCanvasContext2D(1, 1);
  });
  it('creates a proxy and records instructions', () => {
    const zIndexContext = new ZIndexContext();
    const context = zIndexContext.getContext();
    assert.strictEqual(zIndexContext.zIndex, 0);
    zIndexContext.zIndex = 1;
    context.fillStyle = 'red';
    context.fillRect(0, 0, 1, 1);
    zIndexContext.draw(target);
    let imageData = target.getImageData(0, 0, 1, 1).data;
    assert.deepEqual(Array.from(imageData), [255, 0, 0, 255]);
    zIndexContext.clear();
    assert.deepEqual(zIndexContext.instructions_, []);
    context.clearRect(0, 0, 1, 1);
    zIndexContext.draw(target);
    imageData = target.getImageData(0, 0, 1, 1).data;
    assert.deepEqual(Array.from(imageData), [0, 0, 0, 0]);
    assert.deepEqual(zIndexContext.instructions_[0], [
      'clearRect',
      [0, 0, 1, 1],
    ]);
  });
});
