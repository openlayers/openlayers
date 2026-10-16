import {assert} from 'chai';
import {
  measureTextBaseline,
  measureTextHeight,
  measureWrappedLineHeight,
} from '../../../../../../src/ol/render/canvas.js';
import {
  extendGlyphBounds,
  GLYPH_INSTANCE_STRIDE,
  isGlyphDrawn,
  layoutLineLabel,
  layoutPointLabel,
  packGlyphInstances,
} from '../../../../../../src/ol/render/webgpu/glyphLayout.js';
import Fill from '../../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../../src/ol/style/Stroke.js';
import Text from '../../../../../../src/ol/style/Text.js';
import FontAtlas from '../../../../../../src/ol/webgpu/FontAtlas.js';

describe('ol/render/webgpu/glyphLayout', () => {
  it('reuses one atlas cell for font sizes that round to the same pixel', () => {
    const atlas = new FontAtlas();
    const low = [];
    const high = [];
    const other = [];
    const hit = [0, 0, 0, 1];
    layoutPointLabel(
      low,
      new Text({text: 'A', font: '11.6px sans-serif'}),
      [0, 0],
      atlas,
      hit,
    );
    layoutPointLabel(
      high,
      new Text({text: 'A', font: '12.4px sans-serif'}),
      [0, 0],
      atlas,
      hit,
    );
    layoutPointLabel(
      other,
      new Text({text: 'A', font: '12.6px sans-serif'}),
      [0, 0],
      atlas,
      hit,
    );
    assert.deepEqual(
      [low[0].texX0, low[0].texY0, low[0].texX1, low[0].texY1, low[0].page],
      [
        high[0].texX0,
        high[0].texY0,
        high[0].texX1,
        high[0].texY1,
        high[0].page,
      ],
    );
    assert.notDeepEqual(
      [low[0].texX0, low[0].texY0, low[0].texX1, low[0].texY1],
      [other[0].texX0, other[0].texY0, other[0].texX1, other[0].texY1],
    );

    const thin = [];
    const thick = [];
    const heavier = [];
    layoutPointLabel(
      thin,
      new Text({
        text: 'A',
        font: '16px sans-serif',
        stroke: new Stroke({color: '#fff', width: 0.6}),
      }),
      [0, 0],
      atlas,
      hit,
    );
    layoutPointLabel(
      thick,
      new Text({
        text: 'A',
        font: '16px sans-serif',
        stroke: new Stroke({color: '#fff', width: 1.4}),
      }),
      [0, 0],
      atlas,
      hit,
    );
    layoutPointLabel(
      heavier,
      new Text({
        text: 'A',
        font: '16px sans-serif',
        stroke: new Stroke({color: '#fff', width: 2.2}),
      }),
      [0, 0],
      atlas,
      hit,
    );
    assert.deepEqual(
      [thin[0].texX0, thin[0].texY0, thin[0].page],
      [thick[0].texX0, thick[0].texY0, thick[0].page],
    );
    assert.notDeepEqual(
      [thin[0].texX0, thin[0].texY0, thin[0].texX1, thin[0].texY1],
      [heavier[0].texX0, heavier[0].texY0, heavier[0].texX1, heavier[0].texY1],
    );

    const line = [];
    const box = layoutLineLabel(
      line,
      new Text({text: 'A', font: '12.4px sans-serif', placement: 'line'}),
      [0, 0, 100, 0],
      1,
      atlas,
      hit,
    );
    assert.isNotNull(box);
    assert.strictEqual(line[0].texX0, low[0].texX0);
    assert.strictEqual(line[0].page, low[0].page);
  });

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

    const lineHeight = measureWrappedLineHeight(font);
    assert.strictEqual(lineHeight, measureTextHeight(font));
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

  it('spaces a normal line-height by the font ink, not its CSS line box', () => {
    const atlas = new FontAtlas();
    const font = 'bold 12px sans-serif';
    const lineHeight = measureWrappedLineHeight(font);
    assert.isAtMost(lineHeight, measureTextHeight(font));
    const glyphs = [];
    layoutPointLabel(
      glyphs,
      new Text({
        text: 'Hg\npy',
        font,
        fill: new Fill({color: '#000'}),
      }),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );
    const lines = ['Hg', 'py'];
    let index = 0;
    const alphabetic = [];
    for (const line of lines) {
      const metrics = atlas.getGlyph(font, line[0]);
      alphabetic.push(glyphs[index].offsetY + metrics.ascent);
      index += line.length;
    }
    assert.approximately(alphabetic[1] - alphabetic[0], lineHeight, 0.01);
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

  it('centers line-label graphemes on the path so adjacent cells meet', () => {
    const atlas = new FontAtlas();
    const font = '16px sans-serif';
    const text = new Text({
      text: 'Hällesches Ufer',
      font,
      placement: 'line',
      fill: new Fill({color: '#000'}),
    });
    const straightAll = [];
    layoutLineLabel(straightAll, text, [0, 0, 1000, 0], 1, atlas, [1, 0, 0, 1]);
    const straight = straightAll.filter((glyph) => isGlyphDrawn(glyph, 0));
    assert.strictEqual(straight.length, text.getText().length);
    const first = straight[0];
    const last = straight[straight.length - 1];
    assert.closeTo(first.x, 500, 1);
    assert.closeTo(first.offsetX + last.offsetX + last.width, 0, 2);
    assert.closeTo(
      first.offsetY + atlas.getGlyph(font, 'H').ascent,
      measureTextBaseline(font),
      0.01,
    );

    const splitAll = [];
    layoutLineLabel(
      splitAll,
      text,
      [0, 0, 100, 0, 200, 0, 400, 0],
      1,
      atlas,
      [1, 0, 0, 1],
    );
    const split = splitAll.filter((glyph) => isGlyphDrawn(glyph, 0));
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

  it('rotates line labels with the view and keeps them upright', () => {
    const atlas = new FontAtlas();
    const text = new Text({
      text: 'Hallesches Ufer',
      font: '16px sans-serif',
      placement: 'line',
      fill: new Fill({color: '#000'}),
    });
    const glyphs = [];
    layoutLineLabel(glyphs, text, [0, 0, 1000, 0], 1, atlas, [1, 0, 0, 1]);
    assert.strictEqual(glyphs.length, 2 * text.getText().length);
    for (const glyph of glyphs) {
      assert.isTrue(glyph.rotateWithView);
    }
    const forward = glyphs[0];
    const reversed = glyphs[glyphs.length / 2];
    assert.isTrue(isGlyphDrawn(forward, 0));
    assert.isFalse(isGlyphDrawn(reversed, 0));
    assert.isTrue(isGlyphDrawn(forward, 1.5));
    assert.isFalse(isGlyphDrawn(reversed, 1.5));
    assert.isFalse(isGlyphDrawn(forward, 2));
    assert.isTrue(isGlyphDrawn(reversed, 2));
    assert.isFalse(isGlyphDrawn(forward, -Math.PI));
    assert.isTrue(isGlyphDrawn(reversed, -Math.PI));

    // A horizontal label turned a quarter by the view stands vertically.
    const bounds = [Infinity, Infinity, -Infinity, -Infinity];
    for (const glyph of glyphs) {
      extendGlyphBounds(bounds, glyph, 0, 0, Math.PI / 2);
    }
    assert.isAbove(bounds[3] - bounds[1], bounds[2] - bounds[0]);

    const packed = packGlyphInstances(glyphs);
    assert.strictEqual(packed[23], 1);
    assert.strictEqual(packed[24], forward.uprightX);
    assert.strictEqual(packed[25], forward.uprightY);
  });

  it('draws a line label in one direction when keepUpright is false', () => {
    const atlas = new FontAtlas();
    const glyphs = [];
    layoutLineLabel(
      glyphs,
      new Text({
        text: 'Hallesches Ufer',
        font: '16px sans-serif',
        placement: 'line',
        keepUpright: false,
        fill: new Fill({color: '#000'}),
      }),
      [1000, 0, 0, 0],
      1,
      atlas,
      [1, 0, 0, 1],
    );
    assert.strictEqual(glyphs.length, 'Hallesches Ufer'.length);
    assert.isTrue(isGlyphDrawn(glyphs[0], 0));
    assert.isTrue(isGlyphDrawn(glyphs[0], Math.PI));
    assert.closeTo(Math.abs(glyphs[0].angle), Math.PI, 1e-9);
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

    const lineGlyphs = [];
    layoutLineLabel(
      lineGlyphs,
      new Text({text: arabic, font, placement: 'line'}),
      [0, 0, 1000, 0],
      1,
      atlas,
      [1, 0, 0, 1],
    );
    const drawn = lineGlyphs.filter((glyph) => isGlyphDrawn(glyph, 0));
    assert.strictEqual(drawn.length, 1);
    assert.strictEqual(drawn[0].texX0, arabicMetrics.texX0);
    assert.strictEqual(drawn[0].texY0, arabicMetrics.texY0);
  });

  it('draws bent line labels that need shaping from slices of one cell', () => {
    const font = '24px sans-serif';
    // Also with digits, which read left to right within right-to-left text.
    for (const text of ['شارع الخليفة المأمون', 'شارع 26 يوليو الجديد']) {
      const atlas = new FontAtlas();
      const glyphs = [];
      layoutLineLabel(
        glyphs,
        new Text({text, font, placement: 'line', keepUpright: false}),
        [0, 0, 90, 0, 180, -30, 270, -30, 360, 0],
        1,
        atlas,
        [1, 0, 0, 1],
      );
      // No cells for chunks, only the one for the whole label.
      assert.lengthOf(Object.keys(atlas.glyphs_), 1);
      const whole = atlas.getGlyph(font, text);
      assert.isAbove(glyphs.length, 1);
      assert.strictEqual(glyphs[0].texX0, whole.texX0);
      assert.strictEqual(glyphs[glyphs.length - 1].texX1, whole.texX1);
      for (let i = 1; i < glyphs.length; ++i) {
        assert.strictEqual(glyphs[i].texY0, whole.texY0);
        // Slices follow the path in the order of the shaped text, so a
        // number cannot read backwards.
        assert.strictEqual(glyphs[i].texX0, glyphs[i - 1].texX1);
      }
    }
  });

  it('keeps left-to-right scripts that need shaping in one cell', () => {
    const atlas = new FontAtlas();
    const font = '24px sans-serif';
    // A conjunct (क्ष) and a vowel sign drawn before its consonant (ि).
    const devanagari = 'क्षितिज';
    const pointGlyphs = [];
    layoutPointLabel(
      pointGlyphs,
      new Text({text: devanagari, font}),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );
    assert.strictEqual(pointGlyphs.length, 1);

    const lineGlyphs = [];
    layoutLineLabel(
      lineGlyphs,
      new Text({text: devanagari, font, placement: 'line'}),
      [0, 0, 1000, 0],
      1,
      atlas,
      [1, 0, 0, 1],
    );
    const drawn = lineGlyphs.filter((glyph) => isGlyphDrawn(glyph, 0));
    assert.strictEqual(drawn.length, 1);
    const shaped = atlas.getGlyph(font, devanagari);
    assert.strictEqual(drawn[0].texX0, shaped.texX0);
    assert.strictEqual(drawn[0].texY0, shaped.texY0);

    // Yogyakarta, with stacked consonants (pasangan).
    const javanese = 'ꦪꦺꦴꦒꦾꦏꦂꦠ';
    const javaneseGlyphs = [];
    layoutPointLabel(
      javaneseGlyphs,
      new Text({text: javanese, font}),
      [0, 0],
      atlas,
      [1, 0, 0, 1],
    );
    assert.strictEqual(javaneseGlyphs.length, 1);
  });
});
