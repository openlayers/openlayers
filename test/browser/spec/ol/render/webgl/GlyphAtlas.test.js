import GlyphAtlas from '../../../../../../src/ol/render/webgl/GlyphAtlas.js';

describe('ol/render/webgl/GlyphAtlas', function () {
  it('starts dirty so the first upload happens', function () {
    const atlas = new GlyphAtlas('sans-serif');
    expect(atlas.isDirty()).to.be(true);
  });

  it('markUploaded clears the dirty flag', function () {
    const atlas = new GlyphAtlas('sans-serif');
    atlas.markUploaded();
    expect(atlas.isDirty()).to.be(false);
  });

  it('adding a new glyph sets dirty', function () {
    const atlas = new GlyphAtlas('sans-serif');
    atlas.markUploaded();
    atlas.addChar('A');
    expect(atlas.isDirty()).to.be(true);
  });

  it('adding an already-present glyph does not set dirty', function () {
    const atlas = new GlyphAtlas('sans-serif');
    atlas.addChar('A');
    atlas.markUploaded();
    atlas.addChar('A');
    expect(atlas.isDirty()).to.be(false);
  });
});
