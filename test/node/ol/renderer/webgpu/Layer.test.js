import {assert} from 'chai';
import WebGPULayerRenderer, {
  canvasGroupFor,
} from '../../../../../src/ol/renderer/webgpu/Layer.js';

/**
 * @param {string} [className] Layer class name.
 * @return {{layer: Object, renderer: WebGPULayerRenderer}} A layer and its renderer.
 */
function layerFor(className = 'ol-layer') {
  const layer = {
    className,
    addChangeListener() {},
    getClassName() {
      return this.className;
    },
    getRenderer() {
      return null;
    },
  };
  const renderer = new WebGPULayerRenderer(/** @type {any} */ (layer));
  layer.getRenderer = () => renderer;
  return {layer, renderer};
}

describe('ol/renderer/webgpu/Layer', () => {
  it('gives a translucent layer its own canvas', () => {
    const first = layerFor();
    const second = layerFor();
    const translucent = layerFor();
    const after = layerFor();
    const otherClass = layerFor('ol-layer-other');
    const frame = /** @type {any} */ ({
      layerStatesArray: [
        {layer: first.layer, opacity: 1},
        {layer: second.layer, opacity: 1},
        {layer: translucent.layer, opacity: 0.5},
        {layer: after.layer, opacity: 1},
        {layer: otherClass.layer, opacity: 1},
      ],
    });

    assert.strictEqual(canvasGroupFor(frame, first.renderer).groupNumber, 0);
    assert.strictEqual(canvasGroupFor(frame, second.renderer).groupNumber, 0);
    assert.strictEqual(
      canvasGroupFor(frame, translucent.renderer).groupNumber,
      1,
    );
    assert.strictEqual(
      canvasGroupFor(frame, translucent.renderer).opacity,
      0.5,
    );
    assert.strictEqual(canvasGroupFor(frame, after.renderer).groupNumber, 2);
    assert.strictEqual(
      canvasGroupFor(frame, otherClass.renderer).groupNumber,
      3,
    );
  });
});
