goog.provide('ol.test.source.ImageStatic');

goog.require('ol.source.ImageStatic');
goog.require('ol.proj');


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

    it('scales image to fit imageExtent', function(done) {
      var source = new ol.source.ImageStatic({
        url: 'spec/ol/source/images/12-655-1583.png',
        imageExtent: [
          -13629027.891360067, 4539747.983913189,
          -13619243.951739565, 4559315.863154193],
        projection: projection
      });

      var image = source.getImage(extent, resolution, pixelRatio, projection);

      source.on('imageloadend', function(event) {
        expect(image.getImage().width).to.be(128);
        expect(image.getImage().height).to.be(256);
        done();
      });

      image.load();
    });

    it('respects imageSize', function(done) {
      var source = new ol.source.ImageStatic({
        url: 'spec/ol/source/images/12-655-1583.png',
        imageExtent: [
          -13629027.891360067, 4539747.983913189,
          -13619243.951739565, 4559315.863154193],
        imageSize: [254, 254],
        projection: projection
      });

      var image = source.getImage(extent, resolution, pixelRatio, projection);

      source.on('imageloadend', function(event) {
        expect(image.getImage().width).to.be(127);
        expect(image.getImage().height).to.be(254);
        done();
      });

      image.load();
    });

    it('triggers image load events', function(done) {
      var source = new ol.source.ImageStatic({
        url: 'spec/ol/source/images/12-655-1583.png',
        imageExtent: [
          -13629027.891360067, 4539747.983913189,
          -13619243.951739565, 4549531.923533691],
        projection: projection
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
