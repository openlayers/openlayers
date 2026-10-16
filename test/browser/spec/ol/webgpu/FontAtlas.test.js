import {assert} from 'chai';
import {createCanvasContext2D} from '../../../../../src/ol/dom.js';
import {requestDevice} from '../../../../../src/ol/webgpu/Device.js';
import FontAtlas, {
  drawCell,
  measureCell,
} from '../../../../../src/ol/webgpu/FontAtlas.js';

/**
 * @param {GPUDevice} device Device.
 * @param {GPUTexture} texture Atlas page.
 * @param {import("../../../../../src/ol/webgpu/FontAtlas.js").GlyphMetrics} glyph Glyph.
 * @return {Promise<Array<number>>} Two bytes per texel of the glyph cell.
 */
async function readTexels(device, texture, glyph) {
  const width = glyph.texX1 - glyph.texX0;
  const height = glyph.texY1 - glyph.texY0;
  const bytesPerRow = Math.ceil((width * 2) / 256) * 256;
  const buffer = device.createBuffer({
    size: bytesPerRow * height,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
  const encoder = device.createCommandEncoder();
  encoder.copyTextureToBuffer(
    {texture, origin: {x: glyph.texX0, y: glyph.texY0}},
    {buffer, bytesPerRow},
    [width, height],
  );
  device.queue.submit([encoder.finish()]);
  await buffer.mapAsync(GPUMapMode.READ);
  const rows = new Uint8Array(buffer.getMappedRange());
  const texels = [];
  for (let y = 0; y < height; ++y) {
    texels.push(...rows.subarray(y * bytesPerRow, y * bytesPerRow + width * 2));
  }
  buffer.destroy();
  return texels;
}

describe('ol/webgpu/FontAtlas', () => {
  it('keeps existing glyph coordinates stable when the atlas grows', () => {
    const atlas = new FontAtlas();
    const a = atlas.getGlyph('48px sans-serif', 'A');
    const b = atlas.getGlyph('48px sans-serif', 'B');
    assert.isAbove(a.width, 0);
    assert.isAbove(a.height, 0);
    assert.isAbove(a.ascent, 0);
    assert.isBelow(a.ascent, a.height);
    assert.notDeepEqual([a.texX0, a.texY0], [b.texX0, b.texY0]);
    const again = atlas.getGlyph('48px sans-serif', 'A');
    assert.deepEqual(again, a);

    const before = [a.texX0, a.texY0, a.texX1, a.texY1];
    const initialSize = atlas.getPageSize(0);
    for (let i = 0; atlas.getPageSize(0) === initialSize; ++i) {
      assert.isBelow(i, 100);
      atlas.getGlyph(`${48 + i}px sans-serif`, String(i));
    }
    assert.strictEqual(atlas.getPageSize(0), initialSize * 2);
    assert.deepEqual([a.texX0, a.texY0, a.texX1, a.texY1], before);
  });

  it('keeps existing glyph texels when a page texture grows', async ({
    skip,
  }) => {
    const device = await requestDevice().then(
      (handle) => handle.device,
      () => null,
    );
    if (!device) {
      skip();
    }
    const helper = /** @type {*} */ ({getDevice: () => device});
    const atlas = new FontAtlas();
    const a = atlas.getGlyph('48px sans-serif', 'A', 2);
    atlas.upload(helper);
    const before = await readTexels(device, atlas.getTexture(0), a);
    assert.isAbove(Math.max(...before), 200);

    for (let i = 0; atlas.getPageSize(0) === 512; ++i) {
      assert.isBelow(i, 100);
      atlas.getGlyph(`${48 + i}px sans-serif`, String(i));
    }
    atlas.upload(helper);
    assert.strictEqual(atlas.getTexture(0).width, 1024);
    const after = await readTexels(device, atlas.getTexture(0), a);
    assert.deepEqual(after, before);
  });

  it('opens another page instead of growing past 4096', () => {
    const atlas = new FontAtlas();
    const first = atlas.getGlyph('48px sans-serif', 'A');
    const before = [first.texX0, first.texY0, first.texX1, first.texY1];
    let moved;
    for (let i = 0; atlas.getPageCount() < 2; ++i) {
      assert.isBelow(i, 30);
      moved = atlas.getGlyph('1800px sans-serif', String(i));
    }
    assert.strictEqual(atlas.getPageCount(), 2);
    assert.strictEqual(first.page, 0);
    assert.strictEqual(moved.page, 1);
    assert.strictEqual(atlas.getPageSize(0), 4096);
    assert.strictEqual(atlas.getPageSize(1), 4096);
    assert.deepEqual(
      [first.texX0, first.texY0, first.texX1, first.texY1],
      before,
    );
  });

  it('starts over with an empty first page when cleared', () => {
    const atlas = new FontAtlas();
    for (let i = 0; atlas.getPageCount() < 2; ++i) {
      assert.isBelow(i, 30);
      atlas.getGlyph('1800px sans-serif', String(i));
    }
    const glyph = atlas.getGlyph('48px sans-serif', 'A');
    atlas.clear();
    assert.strictEqual(atlas.getPageCount(), 1);
    assert.strictEqual(atlas.getPageSize(0), 512);
    const again = atlas.getGlyph('48px sans-serif', 'A');
    assert.notStrictEqual(again, glyph);
    assert.strictEqual(again.page, 0);
  });

  it('measures glyph advances per font', () => {
    const atlas = new FontAtlas();
    const small = atlas.getGlyph('10px sans-serif', 'B');
    const large = atlas.getGlyph('30px sans-serif', 'B');
    assert.closeTo(large.advance, small.advance * 3, 1);
  });

  it('encodes fill and halo coverage in independent channels', () => {
    /**
     * @param {string} text Text.
     * @param {number} strokeWidth Stroke width.
     * @return {Uint8ClampedArray} Unpremultiplied cell pixels.
     */
    const rasterize = (text, strokeWidth) => {
      const context = createCanvasContext2D(1, 1);
      const cell = measureCell(
        context,
        '24px sans-serif',
        text,
        strokeWidth,
        1,
      );
      context.canvas.width = cell.width;
      context.canvas.height = cell.height;
      drawCell(context, text, cell, 0, 0);
      return context.getImageData(0, 0, cell.width, cell.height).data;
    };
    const data = rasterize('O', 3);
    let haloOnly = 0;
    let fill = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 100 && data[i + 1] < 20 && data[i + 3] > 100) {
        ++haloOnly;
      }
      if (data[i + 1] > 200 && data[i + 3] > 200) {
        ++fill;
      }
    }
    assert.isAbove(haloOnly, 0);
    assert.isAbove(fill, 0);

    const fillData = rasterize('A', 0);
    let maxHalo = 0;
    let maxFill = 0;
    for (let i = 0; i < fillData.length; i += 4) {
      maxHalo = Math.max(maxHalo, fillData[i]);
      maxFill = Math.max(maxFill, fillData[i + 1]);
    }
    assert.strictEqual(maxHalo, 0);
    assert.isAbove(maxFill, 200);
  });

  it('rasterizes more texels at a higher device pixel ratio', () => {
    const atlas = new FontAtlas();
    const css = atlas.getGlyph('12px sans-serif', 'A', 0, 1);
    const retina = atlas.getGlyph('12px sans-serif', 'A', 0, 2);
    assert.closeTo(retina.width, css.width, 2);
    assert.closeTo(retina.height, css.height, 2);
    const cssTexels = css.texX1 - css.texX0;
    const retinaTexels = retina.texX1 - retina.texX0;
    assert.isAbove(retinaTexels, cssTexels * 1.5);
  });
});
