import ImageSource from '../../../../../src/ol/source/Image.js';

describe('ol/source/Image', function () {
  describe('constructor', function () {
    it('does not set the static_ flag when no loader is configured', function () {
      const source = new ImageSource({});
      expect(source.static_).to.be(false);
    });
    it('does not set the static_ flag when loader accepts arguments', function () {
      const source = new ImageSource({
        loader: function (extent, resolution, projection) {},
      });
      expect(source.static_).to.be(false);
    });
    it('sets the static_ flag when loader accepts no arguments', function () {
      const source = new ImageSource({
        loader: function () {},
      });
      expect(source.static_).to.be(true);
    });
  });
});
