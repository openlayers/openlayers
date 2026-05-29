import GlyphLayout from '../../../../../../src/ol/render/webgl/GlyphLayout.js';

/**
 * Stub atlas: each glyph is a fixed 10x20 box, advance 12, top 16, left 1,
 * atlas position derived from char code so UVs are deterministic.
 * @return {import('../../../../../../src/ol/render/webgl/GlyphLayout.js').GlyphSource} Stub atlas.
 */
function makeStubAtlas() {
  return {
    getWidth: () => 100,
    getHeight: () => 100,
    addChar: (char) => ({
      id: char.charCodeAt(0),
      x: char.charCodeAt(0) % 10,
      y: 0,
      width: 10,
      height: 20,
      advance: 12,
      top: 16,
      left: 1,
    }),
    getKerning: () => 0,
  };
}

describe('ol/render/webgl/GlyphLayout', function () {
  it('returns one glyph per character', function () {
    const result = GlyphLayout('ab', makeStubAtlas());
    expect(result.glyphs).to.have.length(2);
  });

  it('advances the pen by glyph.advance between glyphs', function () {
    const result = GlyphLayout('ab', makeStubAtlas());
    const dx = result.glyphs[1].offsetPx[0] - result.glyphs[0].offsetPx[0];
    expect(dx).to.be(12); // advance, kerning 0
  });

  it('centers the label horizontally around the anchor', function () {
    const result = GlyphLayout('ab', makeStubAtlas());
    const left = result.glyphs[0].offsetPx[0];
    const right = result.glyphs[1].offsetPx[0] + result.glyphs[1].sizePx[0];
    expect(Math.abs(left + right)).to.be.lessThan(1); // symmetric around 0
  });

  it('computes atlas UV rect normalized by atlas size', function () {
    const result = GlyphLayout('a', makeStubAtlas());
    const g = result.glyphs[0];
    const code = 'a'.charCodeAt(0);
    expect(g.atlasUv[0]).to.be((code % 10) / 100); // u0 = x / width
    expect(g.atlasUv[2]).to.be(((code % 10) + 10) / 100); // u1 = (x+w)/width
  });

  it('returns empty glyphs for empty string', function () {
    const result = GlyphLayout('', makeStubAtlas());
    expect(result.glyphs).to.have.length(0);
  });

  it('skips glyphs the atlas cannot place (addChar returns null)', function () {
    const atlas = makeStubAtlas();
    atlas.addChar = () => null;
    const result = GlyphLayout('ab', atlas);
    expect(result.glyphs).to.have.length(0);
  });
});
