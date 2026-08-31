import {assert} from 'chai';
import LabelRenderer from '../../../../../src/ol/renderer/webgpu/LabelRenderer.js';

/**
 * @return {Object} Helper stub that records buffer writes.
 */
function fakeHelper() {
  const writes = [];
  return {
    writes,
    createBuffer: () => ({destroy() {}}),
    writeBuffer: (buffer, data) => writes.push(data.length),
  };
}

/**
 * @param {number} count Label count.
 * @return {Object} Buffers with one glyph per label.
 */
function labelBuffers(count) {
  const labels = [];
  const glyphs = [];
  for (let i = 0; i < count; ++i) {
    labels.push({
      minX: 0,
      minY: 0,
      maxX: 1,
      maxY: 1,
      glyphStart: i,
      glyphCount: 1,
    });
    glyphs.push({x: i, y: 0, offsetX: 0, offsetY: 0, width: 1, height: 1});
  }
  return {labels, glyphs, symbolInstances: new Float32Array(0)};
}

describe('ol/renderer/webgpu/LabelRenderer', () => {
  beforeEach(() => {
    globalThis.GPUBufferUsage = /** @type {any} */ ({VERTEX: 32, COPY_DST: 8});
  });

  afterEach(() => {
    delete globalThis.GPUBufferUsage;
  });

  it('reports opacity changes only when a value actually moved', () => {
    // A pan that changes nothing about label visibility must not cost an
    // upload, which is what makes the per-frame label path nearly free.
    const renderer = new LabelRenderer();
    renderer.setLabels(
      /** @type {any} */ (fakeHelper()),
      /** @type {any} */ (labelBuffers(3)),
    );
    const opacities = new Float32Array([
      0, 0, 0, 0, 1, 100, 1, 1, 0, 0.5, 1, 100, 1, 1, 0,
    ]);
    assert.isTrue(renderer.setOpacities(opacities, 1));
    assert.isFalse(renderer.setOpacities(opacities, 1));

    opacities[6] = 0;
    assert.isTrue(renderer.setOpacities(opacities, 1));
    renderer.dispose();
  });

  it('reads its own slice of the shared opacities', () => {
    const renderer = new LabelRenderer();
    renderer.setLabels(
      /** @type {any} */ (fakeHelper()),
      /** @type {any} */ (labelBuffers(2)),
    );
    const opacities = new Float32Array([1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0]);
    renderer.setOpacities(opacities, 2);
    // Only entries 2 and 3 belong to this set, so touching entry 0 is not a
    // change for it.
    opacities[0] = 0;
    assert.isFalse(renderer.setOpacities(opacities, 2));
    renderer.dispose();
  });
});
