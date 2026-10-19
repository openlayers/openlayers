import {assert} from 'chai';
import {
  FrameUniformPool,
  MAX_RENDER_CLIP_EXTENTS,
  VECTOR_FRAME_UNIFORM_SIZE,
  VectorGpuBuffers,
  placementKey,
  shouldStartImageAtlasOver,
} from '../../../../../src/ol/renderer/webgpu/vectorUtil.js';
import {
  apply as applyTransform,
  compose,
  create,
} from '../../../../../src/ol/transform.js';

/**
 * Where the glyph shader would put an anchor, simulating its float32 math.
 *
 * @param {Float32Array} matrix Projection matrix.
 * @param {number} x Anchor x.
 * @param {number} y Anchor y.
 * @param {number} width Viewport width.
 * @param {number} height Viewport height.
 * @return {Array<number>} Pixel.
 */
function projectLabel(matrix, x, y, width, height) {
  const fx = Math.fround(x);
  const fy = Math.fround(y);
  const clipX = Math.fround(
    Math.fround(Math.fround(matrix[0]) * fx) +
      Math.fround(Math.fround(matrix[4]) * fy) +
      Math.fround(matrix[12]),
  );
  const clipY = Math.fround(
    Math.fround(Math.fround(matrix[1]) * fx) +
      Math.fround(Math.fround(matrix[5]) * fy) +
      Math.fround(matrix[13]),
  );
  return [(clipX + 1) * 0.5 * width, (1 - clipY) * 0.5 * height];
}

describe('ol/renderer/webgpu/vectorUtil', () => {
  it('gives each world offset its own uniform buffer', () => {
    // Uniforms written with queue.writeBuffer all land before the encoded pass
    // runs, so tiles drawn at different world offsets need separate buffers.
    globalThis.GPUBufferUsage = /** @type {any} */ ({
      UNIFORM: 64,
      COPY_DST: 8,
    });
    /** @type {Array<{buffer: Object, matrix: Float32Array}>} */
    const writes = [];
    const helper = /** @type {any} */ ({
      getDevice: () => ({createBuffer: () => ({destroy() {}})}),
      writeBuffer(buffer, data) {
        writes.push({
          buffer,
          matrix: Float32Array.from(data.subarray(0, 16)),
        });
      },
    });
    const frame = /** @type {any} */ ({
      size: [200, 100],
      viewState: {resolution: 1},
      coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
      layerStatesArray: [{opacity: 1}],
      layerIndex: 0,
    });
    const pool = new FrameUniformPool(helper);
    pool.begin();
    const canonical = pool.get(frame, 0);
    const wrapped = pool.get(frame, -40075016.68557849);

    assert.notStrictEqual(canonical, wrapped);
    assert.notStrictEqual(canonical.buffer, wrapped.buffer);
    assert.strictEqual(writes.length, 2);
    assert.strictEqual(writes[0].matrix[12], -1);
    assert.isBelow(writes[1].matrix[12], writes[0].matrix[12]);

    // The same offset within a frame reuses its slot instead of rewriting it.
    assert.strictEqual(pool.get(frame, 0), canonical);
    assert.strictEqual(writes.length, 2);

    pool.dispose();
    delete globalThis.GPUBufferUsage;
  });

  it('projects a high-zoom label from its local origin', () => {
    // Around zoom 18 a web mercator coordinate is only exact to about a metre
    // in float32. Multiplying that by the view matrix cancels two huge terms
    // and the residual jumps by pixels as the resolution changes. Anchors
    // stored relative to a nearby origin stay on the float64 pixel.
    globalThis.GPUBufferUsage = /** @type {any} */ ({
      UNIFORM: 64,
      COPY_DST: 8,
    });
    /** @type {Array<Float32Array>} */
    const matrices = [];
    const helper = /** @type {any} */ ({
      getDevice: () => ({createBuffer: () => ({destroy() {}})}),
      writeBuffer(buffer, data) {
        matrices.push(Float32Array.from(data.subarray(0, 16)));
      },
    });
    const width = 800;
    const height = 600;
    const resolution = 78271.51696402048 / 2 ** 18;
    const center = [-13617292.03302, 6041469.55783];
    const transform = create();
    compose(
      transform,
      width / 2,
      height / 2,
      1 / resolution,
      -1 / resolution,
      0,
      -center[0],
      -center[1],
    );
    const frame = /** @type {any} */ ({
      size: [width, height],
      viewState: {resolution},
      coordinateToPixelTransform: transform,
      layerStatesArray: [{opacity: 1}],
      layerIndex: 0,
    });
    const pool = new FrameUniformPool(helper);
    pool.begin();
    pool.get(frame);
    const absolute = matrices.at(-1);
    const originX = center[0] - 1000;
    const originY = center[1] - 800;
    pool.begin();
    pool.get(frame, 0, 0, originX, originY);
    const relative = matrices.at(-1);

    const expected = applyTransform(transform, center.slice());
    const absolutePixel = projectLabel(
      absolute,
      center[0],
      center[1],
      width,
      height,
    );
    const relativePixel = projectLabel(
      relative,
      center[0] - originX,
      center[1] - originY,
      width,
      height,
    );
    assert.closeTo(relativePixel[0], expected[0], 0.05);
    assert.closeTo(relativePixel[1], expected[1], 0.05);
    const absoluteError = Math.hypot(
      absolutePixel[0] - expected[0],
      absolutePixel[1] - expected[1],
    );
    assert.isAbove(absoluteError, 0.5);

    // Tiles drawn in one frame do not share a matrix unless the origin matches.
    pool.begin();
    const first = pool.get(frame, 0, 0, originX, originY);
    const second = pool.get(frame, 0, 0, originX + 50, originY);
    assert.notStrictEqual(first, second);
    assert.strictEqual(pool.get(frame, 0, 0, originX, originY), first);

    pool.dispose();
    delete globalThis.GPUBufferUsage;
  });

  it('uses every linear transform component but ignores translation', () => {
    const frame = /** @type {any} */ ({
      coordinateToPixelTransform: [1, 2, 3, 4, 5, 6],
    });
    const key = placementKey(7, frame);
    frame.coordinateToPixelTransform[4] = 500;
    assert.strictEqual(placementKey(7, frame), key);
    frame.coordinateToPixelTransform[3] = 4.5;
    assert.notStrictEqual(placementKey(7, frame), key);
  });

  it('packs world clip extents in batch-local coordinates', () => {
    let written;
    const helper = /** @type {any} */ ({
      writeBuffer(buffer, data) {
        written = Float32Array.from(data);
      },
    });
    const gpu = /** @type {any} */ (Object.create(VectorGpuBuffers.prototype));
    gpu.uniformBuffer_ = {};
    gpu.grid = {originX: 10, originY: 20, scaleX: 2, scaleY: -4};
    const frame = /** @type {any} */ ({
      size: [200, 100],
      pixelRatio: 1,
      viewState: {resolution: 1, rotation: 0},
      coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
      layerStatesArray: [{opacity: 1}],
      layerIndex: 0,
    });
    const data = new Float32Array(VECTOR_FRAME_UNIFORM_SIZE / 4);

    gpu.writeUniforms(helper, data, new Float32Array(16), frame, 0, 100, [
      [112, 12, 120, 28],
    ]);

    assert.strictEqual(new Uint32Array(written.buffer)[32], 1);
    assert.deepEqual(Array.from(written.subarray(36, 40)), [1, -2, 5, 2]);

    gpu.writeUniforms(
      helper,
      data,
      new Float32Array(16),
      frame,
      0,
      100,
      Array.from({length: MAX_RENDER_CLIP_EXTENTS + 1}, () => [0, 0, 1, 1]),
    );
    assert.strictEqual(new Uint32Array(written.buffer)[32], 0);
  });

  describe('shouldStartImageAtlasOver()', () => {
    /**
     * @param {number} allocatedArea Texels taken by all entries.
     * @return {import("../../../../../src/ol/webgpu/ImageAtlas.js").default} Full 100 x 100 atlas.
     */
    function fullAtlas(allocatedArea) {
      return /** @type {any} */ ({
        isFull: () => true,
        getSize: () => 100,
        getAllocatedArea: () => allocatedArea,
      });
    }

    /**
     * @param {number} width Width.
     * @return {import("../../../../../src/ol/webgpu/ImageAtlas.js").ImageAtlasEntry} Entry 100 texels high.
     */
    function entry(width) {
      return {texX0: 0, texY0: 0, texX1: width, texY1: 100};
    }

    const idle = /** @type {any} */ ({viewHints: [0, 0]});

    it('starts over when unused entries free at least half the atlas', () => {
      const used = entry(50);
      assert.isTrue(
        shouldStartImageAtlasOver(fullAtlas(9000), idle, () => [[used, used]]),
      );
      assert.isFalse(
        shouldStartImageAtlasOver(
          fullAtlas(9000),
          /** @type {any} */ ({viewHints: [0, 1]}),
          () => [[used]],
        ),
      );
    });

    it('stays full, and warns once, while starting over cannot help', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      assert.isFalse(
        shouldStartImageAtlasOver(fullAtlas(9000), idle, () => [[entry(60)]]),
      );
      assert.isFalse(
        shouldStartImageAtlasOver(fullAtlas(3000), idle, () => [[entry(30)]]),
      );
      assert.strictEqual(warn.mock.calls.length, 1);
      warn.mockRestore();
    });
  });
});
