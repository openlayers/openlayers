import {assert} from 'chai';
import LabelRenderer from '../../../../../src/ol/renderer/webgpu/LabelRenderer.js';
import {ICON_STRIDE} from '../../../../../src/ol/renderer/webgpu/vectorUtil.js';

/**
 * @return {Object} Helper stub that records buffer writes.
 */
function fakeHelper() {
  const writes = [];
  const pipelines = [];
  const draws = [];
  const pass = {
    setPipeline(pipeline) {
      pipelines.push(pipeline.name);
    },
    setBindGroup() {},
    setVertexBuffer() {},
    draw(vertexCount, instanceCount, firstVertex, firstInstance) {
      draws.push({vertexCount, instanceCount, firstVertex, firstInstance});
    },
  };
  return {
    writes,
    pipelines,
    draws,
    createBuffer: () => ({destroy() {}}),
    writeBuffer: (buffer, data) => writes.push(data.length),
    getRenderPipeline: (name) => ({name}),
    getRenderPass: () => pass,
  };
}

/**
 * @param {number} count Label count.
 * @param {Array<boolean>} [halos] Whether each glyph has a halo.
 * @return {Object} Buffers with one glyph per label.
 */
function labelBuffers(count, halos = []) {
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
    glyphs.push({
      x: i,
      y: 0,
      offsetX: 0,
      offsetY: 0,
      width: 1,
      height: 1,
      hasHalo: halos[i] || false,
    });
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

  it('draws halos before fills only for ranges that contain halos', () => {
    const helper = fakeHelper();
    const renderer = new LabelRenderer();
    renderer.setLabels(
      /** @type {any} */ (helper),
      /** @type {any} */ (labelBuffers(3, [false, true, false])),
    );
    const slot = {
      getBindGroup: () => ({}),
    };
    const atlas = {
      upload: () => ({}),
    };

    renderer.drawInstances(
      /** @type {any} */ (helper),
      'glyph',
      0,
      1,
      /** @type {any} */ (slot),
      /** @type {any} */ (atlas),
      /** @type {any} */ ({}),
    );
    assert.deepEqual(helper.pipelines, ['vector-glyph-fill']);

    helper.pipelines.length = 0;
    helper.draws.length = 0;
    renderer.drawInstances(
      /** @type {any} */ (helper),
      'glyph',
      1,
      2,
      /** @type {any} */ (slot),
      /** @type {any} */ (atlas),
      /** @type {any} */ ({}),
    );
    assert.deepEqual(helper.pipelines, [
      'vector-glyph-halo',
      'vector-glyph-fill',
    ]);
    assert.deepEqual(
      helper.draws.map(({instanceCount, firstInstance}) => ({
        instanceCount,
        firstInstance,
      })),
      [
        {instanceCount: 2, firstInstance: 1},
        {instanceCount: 2, firstInstance: 1},
      ],
    );
    renderer.dispose();
  });

  it('draws icon ranges with the image atlas and shared fade opacity', () => {
    const helper = fakeHelper();
    const renderer = new LabelRenderer();
    renderer.setLabels(
      /** @type {any} */ (helper),
      /** @type {any} */ ({
        labels: [
          {
            minX: 0,
            minY: 0,
            maxX: 1,
            maxY: 1,
            glyphCount: 0,
            iconIndex: 0,
          },
        ],
        glyphs: [],
        symbolInstances: new Float32Array(0),
        iconInstances: new Float32Array(ICON_STRIDE),
      }),
    );
    renderer.setOpacities(new Float32Array([0, 1, 100]), 0);
    const texture = {};
    renderer.drawInstances(
      /** @type {any} */ (helper),
      'icon',
      0,
      1,
      /** @type {any} */ ({getBindGroup: () => ({})}),
      /** @type {any} */ ({}),
      /** @type {any} */ ({}),
      /** @type {any} */ ({upload: () => texture}),
    );
    assert.deepEqual(helper.pipelines, ['vector-icon']);
    assert.deepEqual(helper.draws, [
      {vertexCount: 4, instanceCount: 1, firstVertex: 0, firstInstance: 0},
    ]);
    assert.include(helper.writes, 3);
    renderer.dispose();
  });
});
