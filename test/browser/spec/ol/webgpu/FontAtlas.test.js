import {assert} from 'chai';
import FontAtlas from '../../../../../src/ol/webgpu/FontAtlas.js';

describe('ol/webgpu/FontAtlas', () => {
  it('keeps existing glyph texels stable when the atlas grows', () => {
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
    const beforePixels = atlas
      .getCanvas()
      .getContext('2d')
      .getImageData(
        a.texX0,
        a.texY0,
        a.texX1 - a.texX0,
        a.texY1 - a.texY0,
      ).data;
    const initialSize = atlas.getCanvas().width;
    for (let i = 0; atlas.getCanvas().width === initialSize; ++i) {
      assert.isBelow(i, 100);
      atlas.getGlyph(`${48 + i}px sans-serif`, String(i));
    }

    assert.strictEqual(atlas.getCanvas().width, initialSize * 2);
    assert.deepEqual([a.texX0, a.texY0, a.texX1, a.texY1], before);
    const afterPixels = atlas
      .getCanvas()
      .getContext('2d')
      .getImageData(
        a.texX0,
        a.texY0,
        a.texX1 - a.texX0,
        a.texY1 - a.texY0,
      ).data;
    assert.deepEqual(afterPixels, beforePixels);
    assert.instanceOf(atlas.getCanvas(), HTMLCanvasElement);
  });

  it('opens another page instead of growing past 4096', () => {
    const atlas = new FontAtlas();
    const first = atlas.getGlyph('48px sans-serif', 'A');
    const width = first.texX1 - first.texX0;
    const height = first.texY1 - first.texY0;
    const before = atlas
      .getCanvas(0)
      .getContext('2d')
      .getImageData(first.texX0, first.texY0, width, height).data;
    let moved;
    for (let i = 0; atlas.getPageCount() < 2; ++i) {
      assert.isBelow(i, 30);
      moved = atlas.getGlyph('1800px sans-serif', String(i));
    }
    assert.strictEqual(atlas.getPageCount(), 2);
    assert.strictEqual(first.page, 0);
    assert.strictEqual(moved.page, 1);
    assert.strictEqual(atlas.getCanvas(0).width, 4096);
    assert.strictEqual(atlas.getCanvas(1).width, 4096);
    assert.isAtMost(atlas.getCanvas(0).width, 4096);
    assert.isAtMost(atlas.getCanvas(1).width, 4096);
    const after = atlas
      .getCanvas(0)
      .getContext('2d')
      .getImageData(first.texX0, first.texY0, width, height).data;
    assert.deepEqual(after, before);
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
    assert.strictEqual(atlas.getCanvas(0).width, 512);
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
    const atlas = new FontAtlas();
    const glyph = atlas.getGlyph('24px sans-serif', 'O', 3);
    const canvas = atlas.getCanvas();
    const context = canvas.getContext('2d');
    const x = glyph.texX0;
    const y = glyph.texY0;
    const tw = glyph.texX1 - glyph.texX0;
    const th = glyph.texY1 - glyph.texY0;
    const data = context.getImageData(x, y, tw, th).data;
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

    const withoutHalo = atlas.getGlyph('24px sans-serif', 'A');
    const fillData = context.getImageData(
      withoutHalo.texX0,
      withoutHalo.texY0,
      withoutHalo.texX1 - withoutHalo.texX0,
      withoutHalo.texY1 - withoutHalo.texY0,
    ).data;
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
