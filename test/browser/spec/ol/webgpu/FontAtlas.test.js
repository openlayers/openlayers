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

  it('measures glyph advances per font', () => {
    const atlas = new FontAtlas();
    const small = atlas.getGlyph('10px sans-serif', 'B');
    const large = atlas.getGlyph('30px sans-serif', 'B');
    assert.closeTo(large.advance, small.advance * 3, 1);
  });

  it('encodes fill as white and stroke as black', () => {
    const atlas = new FontAtlas();
    const glyph = atlas.getGlyph('24px sans-serif', 'O', 3);
    const canvas = atlas.getCanvas();
    const context = canvas.getContext('2d');
    const x = glyph.texX0;
    const y = glyph.texY0;
    const tw = glyph.texX1 - glyph.texX0;
    const th = glyph.texY1 - glyph.texY0;
    const data = context.getImageData(x, y, tw, th).data;
    let maxR = 0;
    let minOpaqueR = 255;
    let opaque = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 200) {
        opaque += 1;
        maxR = Math.max(maxR, data[i]);
        minOpaqueR = Math.min(minOpaqueR, data[i]);
      }
    }
    assert.isAbove(opaque, 0);
    assert.isAbove(maxR, 200);
    assert.isBelow(minOpaqueR, 40);
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
