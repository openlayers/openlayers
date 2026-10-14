import {assert} from 'chai';
import {
  measureTextBaseline,
  measureTextHeight,
} from '../../../../../../src/ol/render/canvas.js';
import {
  GLYPH_INSTANCE_STRIDE,
  layoutLineLabel,
  layoutPointLabel,
  packGlyphInstances,
} from '../../../../../../src/ol/render/webgpu/glyphLayout.js';
import Fill from '../../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../../src/ol/style/Stroke.js';
import Text from '../../../../../../src/ol/style/Text.js';
import FontAtlas from '../../../../../../src/ol/webgpu/FontAtlas.js';

describe('ol/render/webgpu/glyphLayout', () => {
  it('layouts a point label around the anchor', () => {
    const atlas = new FontAtlas();
    const glyphs = [];
    const text = new Text({
      text: 'Hi',
      font: '12px sans-serif',
      fill: new Fill({color: '#000'}),
      stroke: new Stroke({color: '#fff', width: 3}),
    });
    const box = layoutPointLabel(glyphs, text, [10, 20], atlas, [1, 0, 0, 1]);
    assert.isNotNull(box);
    assert.isAbove(glyphs.length, 0);
    assert.strictEqual(glyphs[0].x, 10);
    assert.strictEqual(glyphs[0].y, 20);
    assert.strictEqual(glyphs[0].r, 0);
    assert.strictEqual(glyphs[0].strokeR, 1);
    assert.strictEqual(glyphs[0].strokeA, 1);
    assert.isTrue(glyphs[0].hasHalo);
    const packed = packGlyphInstances(glyphs);
    assert.strictEqual(packed.length, glyphs.length * GLYPH_INSTANCE_STRIDE);
    const relative = packGlyphInstances(glyphs, undefined, 1000, 2000);
    assert.strictEqual(glyphs[0].x, 10);
    assert.strictEqual(glyphs[0].y, 20);
    assert.strictEqual(relative[0], 10 - 1000);
    assert.strictEqual(relative[1], 20 - 2000);
  });

  it('keeps packed atlas texels valid after the atlas grows', () => {
    const atlas = new FontAtlas();
    const glyphs = [];
    const font = '48px sans-serif';
    layoutPointLabel(
      glyphs,
      new Text({
        text: 'A',
        font,
        fill: new Fill({color: '#000'}),
      }),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );
    const packed = packGlyphInstances(glyphs);
    const initialSize = atlas.getCanvas().width;
    for (let i = 0; atlas.getCanvas().width === initialSize; ++i) {
      assert.isBelow(i, 100);
      atlas.getGlyph(`${48 + i}px sans-serif`, String(i));
    }

    const metrics = atlas.getGlyph(font, 'A');
    assert.deepEqual(Array.from(packed.slice(6, 10)), [
      metrics.texX0,
      metrics.texY0,
      metrics.texX1,
      metrics.texY1,
    ]);
  });

  it('spaces glyphs by the advance of their own font', () => {
    const atlas = new FontAtlas();
    /**
     * @param {string} font Font.
     * @return {Array<number>} Glyph offsets.
     */
    const layout = (font) => {
      const glyphs = [];
      layoutPointLabel(
        glyphs,
        new Text({text: 'Berlin', font, textAlign: 'left'}),
        [0, 0],
        atlas,
        [1, 0, 0, 1],
      );
      return glyphs.map((glyph) => glyph.offsetX);
    };
    const small = layout('10px sans-serif');
    const large = layout('30px sans-serif');
    for (let i = 1; i < small.length; ++i) {
      const smallAdvance = small[i] - small[i - 1];
      const largeAdvance = large[i] - large[i - 1];
      assert.closeTo(largeAdvance, smallAdvance * 3, 1.5);
    }
  });

  it('sizes the declutter box from glyph quads and padding', () => {
    const atlas = new FontAtlas();
    const glyphs = [];
    const box = layoutPointLabel(
      glyphs,
      new Text({
        text: 'Hi',
        font: '24px sans-serif',
        fill: new Fill({color: '#000'}),
        padding: [1, 2, 3, 4],
      }),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );
    assert.isNotNull(box);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const glyph of glyphs) {
      minX = Math.min(minX, glyph.offsetX);
      minY = Math.min(minY, glyph.offsetY);
      maxX = Math.max(maxX, glyph.offsetX + glyph.width);
      maxY = Math.max(maxY, glyph.offsetY + glyph.height);
    }
    assert.strictEqual(box.minX, minX - 4);
    assert.strictEqual(box.minY, minY - 1);
    assert.strictEqual(box.maxX, maxX + 2);
    assert.strictEqual(box.maxY, maxY + 3);
  });

  it('aligns mixed-case glyphs on the alphabetic baseline', () => {
    const atlas = new FontAtlas();
    const glyphs = [];
    const font = '24px sans-serif';
    layoutPointLabel(
      glyphs,
      new Text({
        text: 'Aa',
        font,
        fill: new Fill({color: '#000'}),
      }),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );
    assert.strictEqual(glyphs.length, 2);
    const metricsA = atlas.getGlyph(font, 'A');
    const metricsa = atlas.getGlyph(font, 'a');
    assert.isAbove(metricsA.ascent, metricsa.ascent);
    assert.isAbove(glyphs[1].offsetY, glyphs[0].offsetY);
    assert.approximately(
      glyphs[0].offsetY + metricsA.ascent,
      glyphs[1].offsetY + metricsa.ascent,
      0.01,
    );
  });

  it('spaces wrapped lines by the canvas line height', () => {
    const atlas = new FontAtlas();
    const font = '16px/1.2 sans-serif';
    const glyphs = [];
    layoutPointLabel(
      glyphs,
      new Text({
        text: 'Occidental\nAvenue\nSouth',
        font,
        fill: new Fill({color: '#000'}),
        stroke: new Stroke({color: '#fff', width: 4}),
        textBaseline: 'middle',
      }),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );

    const lineHeight = measureTextHeight(font);
    const baselineOffset = measureTextBaseline(font);
    const lines = ['Occidental', 'Avenue', 'South'];
    assert.strictEqual(glyphs.length, lines.join('').length);
    let index = 0;
    const alphabetic = [];
    for (const line of lines) {
      const metrics = atlas.getGlyph(font, line[0], 4);
      alphabetic.push(glyphs[index].offsetY + metrics.ascent);
      index += line.length;
    }
    assert.approximately(alphabetic[0], -lineHeight + baselineOffset, 0.01);
    assert.approximately(alphabetic[1], baselineOffset, 0.01);
    assert.approximately(alphabetic[2], lineHeight + baselineOffset, 0.01);
    assert.approximately(alphabetic[1] - alphabetic[0], lineHeight, 0.01);
    assert.approximately(alphabetic[2] - alphabetic[1], lineHeight, 0.01);
    // The halo padding makes the atlas cell taller than the line box.
    const cell = atlas.getGlyph(font, 'O', 4);
    assert.isAbove(cell.height, lineHeight);
  });

  it('wraps point labels at word boundaries and preserves newlines', () => {
    const atlas = new FontAtlas();
    const glyphs = [];
    layoutPointLabel(
      glyphs,
      new Text({
        text: 'aa aa\nbb bb',
        font: '20px sans-serif',
        maxWidth: 30,
      }),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );

    assert.strictEqual(glyphs.length, 8);
    assert.isBelow(glyphs[0].offsetY, glyphs[2].offsetY);
    assert.isBelow(glyphs[2].offsetY, glyphs[4].offsetY);
    assert.isBelow(glyphs[4].offsetY, glyphs[6].offsetY);
  });

  it('wraps scripts without spaces at word or ideographic boundaries', () => {
    const atlas = new FontAtlas();
    const glyphs = [];
    layoutPointLabel(
      glyphs,
      new Text({
        text: '日本日本',
        font: '20px sans-serif',
        maxWidth: 25,
      }),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );

    assert.strictEqual(glyphs.length, 4);
    assert.isBelow(glyphs[0].offsetY, glyphs[1].offsetY);
    assert.isBelow(glyphs[1].offsetY, glyphs[2].offsetY);
    assert.isBelow(glyphs[2].offsetY, glyphs[3].offsetY);
  });

  it('leaves an unbreakable word on one line', () => {
    const atlas = new FontAtlas();
    const glyphs = [];
    layoutPointLabel(
      glyphs,
      new Text({
        text: 'aaaaaaaa',
        font: '20px sans-serif',
        maxWidth: 10,
      }),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );

    assert.strictEqual(glyphs.length, 8);
    for (let i = 1; i < glyphs.length; ++i) {
      assert.strictEqual(glyphs[i].offsetY, glyphs[0].offsetY);
    }
  });

  it('applies maximum width after horizontal scale', () => {
    const atlas = new FontAtlas();
    const unscaled = [];
    const scaled = [];
    layoutPointLabel(
      unscaled,
      new Text({
        text: 'aa aa',
        font: '12px sans-serif',
        maxWidth: 60,
      }),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );
    layoutPointLabel(
      scaled,
      new Text({
        text: 'aa aa',
        font: '12px sans-serif',
        maxWidth: 60,
        scale: [2, 1],
      }),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );

    assert.strictEqual(unscaled.length, 5);
    assert.strictEqual(scaled.length, 4);
    assert.isBelow(scaled[0].offsetY, scaled[2].offsetY);
  });

  it('centers line-label chunks on the path so adjacent chunks meet', () => {
    const atlas = new FontAtlas();
    const font = '16px sans-serif';
    const text = new Text({
      text: 'Hällesches Ufer',
      font,
      placement: 'line',
      fill: new Fill({color: '#000'}),
    });
    const straight = [];
    layoutLineLabel(straight, text, [0, 0, 1000, 0], 1, atlas, [1, 0, 0, 1]);
    assert.strictEqual(straight.length, 1);
    const whole = straight[0];
    assert.closeTo(whole.x, 500, 1);
    assert.closeTo(whole.offsetX + whole.width / 2, 0, 2);

    const split = [];
    layoutLineLabel(
      split,
      text,
      [0, 0, 100, 0, 200, 0, 400, 0],
      1,
      atlas,
      [1, 0, 0, 1],
    );
    assert.isAbove(split.length, 1);
    for (const glyph of split) {
      // One shared anchor keeps the label rigid when the view zooms.
      assert.strictEqual(glyph.x, split[0].x);
      assert.strictEqual(glyph.y, split[0].y);
    }
    for (let i = 1; i < split.length; ++i) {
      const previous = split[i - 1];
      const next = split[i];
      const previousRight = previous.x + previous.offsetX + previous.width;
      const nextLeft = next.x + next.offsetX;
      // Each cell keeps one pixel of padding past the advance, so the quads
      // overlap by about two pixels where the advances meet.
      assert.closeTo(nextLeft - previousRight, -2, 6);
    }
  });

  it('keeps rotated line-label chunks on a bent path', () => {
    const atlas = new FontAtlas();
    const text = new Text({
      text: 'Hallesches Ufer',
      font: '16px sans-serif',
      placement: 'line',
      maxAngle: Math.PI / 2,
      fill: new Fill({color: '#000'}),
    });
    const flat = [0, 0, 60, 0, 120, -20, 180, -40, 240, -40];
    const glyphs = [];
    const box = layoutLineLabel(glyphs, text, flat, 1, atlas, [1, 0, 0, 1]);
    assert.isNotNull(box);
    assert.isAbove(glyphs.length, 1);
    const anchor = glyphs[0];
    for (const glyph of glyphs) {
      // Undo the shader rotation to recover the baseline point of each chunk,
      // then check it lies on the path, in Y-down pixels.
      const c = Math.cos(glyph.angle);
      const s = Math.sin(glyph.angle);
      const lx = glyph.offsetX + glyph.width / 2;
      const ly = glyph.offsetY + glyph.height / 2;
      const px = anchor.x + c * lx - s * ly;
      const py = -anchor.y + s * lx + c * ly;
      let distance = Infinity;
      for (let i = 0; i < flat.length - 2; i += 2) {
        const ax = flat[i];
        const ay = -flat[i + 1];
        const bx = flat[i + 2];
        const by = -flat[i + 3];
        const t = Math.max(
          0,
          Math.min(
            1,
            ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) /
              ((bx - ax) ** 2 + (by - ay) ** 2),
          ),
        );
        distance = Math.min(
          distance,
          Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay))),
        );
      }
      assert.isBelow(distance, glyph.height);
    }
  });

  it('does not wrap line-placement text', () => {
    const atlas = new FontAtlas();
    const glyphs = [];
    layoutPointLabel(
      glyphs,
      new Text({
        text: 'aa aa',
        font: '20px sans-serif',
        maxWidth: 10,
        placement: 'line',
      }),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );

    assert.strictEqual(glyphs.length, 5);
    assert.strictEqual(glyphs[1].offsetY, glyphs[0].offsetY);
    assert.strictEqual(glyphs[3].offsetY, glyphs[0].offsetY);
    assert.strictEqual(glyphs[4].offsetY, glyphs[0].offsetY);
  });

  it('justifies wrapped lines within the text block', () => {
    const atlas = new FontAtlas();
    const left = [];
    const right = [];
    const options = {
      text: 'aaaa aa',
      font: '20px sans-serif',
      maxWidth: 50,
      textAlign: 'center',
    };
    layoutPointLabel(
      left,
      new Text({...options, justify: 'left'}),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );
    layoutPointLabel(
      right,
      new Text({...options, justify: 'right'}),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );

    assert.approximately(left[0].offsetX, left[4].offsetX, 0.01);
    assert.isAbove(right[4].offsetX, right[0].offsetX);
  });

  it('segments graphemes and shapes right-to-left lines', () => {
    const atlas = new FontAtlas();
    const font = '24px sans-serif';
    const acute = 'e\u0301';
    const acuteGlyphs = [];
    layoutPointLabel(
      acuteGlyphs,
      new Text({text: acute, font, textAlign: 'left'}),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );
    assert.strictEqual(acute.length, 2);
    assert.strictEqual(acuteGlyphs.length, 1);
    const acuteMetrics = atlas.getGlyph(font, acute);
    assert.strictEqual(acuteGlyphs[0].texX0, acuteMetrics.texX0);
    assert.strictEqual(acuteGlyphs[0].texY0, acuteMetrics.texY0);

    const tifinagh = 'ⵍⵣⵣⴰⵢⴻⵔ';
    const tifinaghGlyphs = [];
    layoutPointLabel(
      tifinaghGlyphs,
      new Text({text: tifinagh, font, textAlign: 'left'}),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );
    assert.strictEqual(tifinaghGlyphs.length, 7);
    const first = atlas.getGlyph(font, 'ⵍ');
    assert.strictEqual(tifinaghGlyphs[0].texX0, first.texX0);
    assert.strictEqual(tifinaghGlyphs[0].texY0, first.texY0);

    const arabic = 'الجزائر';
    const arabicGlyphs = [];
    layoutPointLabel(
      arabicGlyphs,
      new Text({text: arabic, font, textAlign: 'left'}),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );
    assert.strictEqual(arabicGlyphs.length, 1);
    const context = document.createElement('canvas').getContext('2d');
    context.font = font;
    const shapedWidth = context.measureText(arabic).width;
    let isolatedWidth = 0;
    for (const {segment} of new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    }).segment(arabic)) {
      isolatedWidth += context.measureText(segment).width;
    }
    const arabicMetrics = atlas.getGlyph(font, arabic);
    assert.closeTo(arabicMetrics.advance, shapedWidth, 0.5);
    assert.isAbove(Math.abs(arabicMetrics.advance - isolatedWidth), 1);
    assert.strictEqual(arabicGlyphs[0].texX0, arabicMetrics.texX0);
    assert.strictEqual(arabicGlyphs[0].texY0, arabicMetrics.texY0);

    const mixed = 'ⵍⵣⵣⴰⵢⴻⵔ الجزائر';
    const mixedGlyphs = [];
    layoutPointLabel(
      mixedGlyphs,
      new Text({text: mixed, font, textAlign: 'left'}),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );
    assert.strictEqual(mixedGlyphs.length, 1);
    const shaped = atlas.getGlyph(font, mixed);
    assert.strictEqual(mixedGlyphs[0].texX0, shaped.texX0);
    assert.strictEqual(mixedGlyphs[0].texY0, shaped.texY0);
    assert.strictEqual(mixedGlyphs[0].texX1, shaped.texX1);
    assert.strictEqual(mixedGlyphs[0].texY1, shaped.texY1);
  });
});
