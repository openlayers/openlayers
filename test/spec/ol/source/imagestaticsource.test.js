goog.provide('ol.test.source.ImageStatic');

describe('ol.source.ImageStatic', function() {

  var extent, pixelRatio, projection, resolution;
  beforeEach(function() {
    extent = [
      -13637278.73946974, 4543799.13271362,
      -13617443.330629736, 4553927.038961405];
    pixelRatio = 1;
    projection = ol.proj.get('EPSG:3857');
    resolution = 38;
  });

  describe('#getImage', function() {

    it('triggers image load events', function(done) {
      var source = new ol.source.ImageStatic({
        url: 'spec/ol/source/images/12-655-1583.png',
        imageExtent: [
          -13629027.891360067, 4539747.983913189,
          -13619243.951739565, 4549531.923533691],
        projection: projection,
        imageSize: [256, 256]
      });

      var imageloadstart = sinon.spy();
      var imageloaderror = sinon.spy();

      source.on('imageloadstart', imageloadstart);
      source.on('imageloaderror', imageloaderror);
      source.on('imageloadend', function(event) {
        expect(imageloadstart.callCount).to.be(1);
        expect(imageloaderror.callCount).to.be(0);
        done();
      });

      var image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
    });
  });
});

goog.require('ol.source.ImageStatic');
goog.require('ol.proj');
