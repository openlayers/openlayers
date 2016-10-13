goog.provide('ol.test.rendering.reproj.Image');

goog.require('ol.events');
goog.require('ol.proj');
goog.require('ol.proj.EPSG3857');
goog.require('ol.reproj.Image');
goog.require('ol.source.ImageStatic');
goog.require('ol.tilegrid');


describe('ol.rendering.reproj.Image', function() {

  function testSingleImage(source, targetProj,
      targetExtent, targetResolution, pixelRatio, expectedUrl, done) {
    var sourceProj = source.getProjection();

    var imagesRequested = 0;

    var image = new ol.reproj.Image(sourceProj, ol.proj.get(targetProj),
        targetExtent, targetResolution, pixelRatio,
        function(extent, resolution, pixelRatio) {
          imagesRequested++;
          return source.getImage(extent, resolution, pixelRatio, sourceProj);
        });
    if (image.getState() == 0) { // IDLE
      ol.events.listen(image, 'change', function(e) {
        if (image.getState() == 2) { // LOADED
          expect(imagesRequested).to.be(1);
          resembleCanvas(image.getImage(), expectedUrl, IMAGE_TOLERANCE, done);
        }
      });
      image.load();
    }
  }

  var source;

  describe('image reprojections from EPSG:3857', function() {
    beforeEach(function() {
      source = new ol.source.ImageStatic({
        url: 'spec/ol/data/tiles/osm/5/5/12.png',
        imageExtent: ol.tilegrid.createXYZ().getTileCoordExtent([5, 5, -13]),
        projection: ol.proj.get('EPSG:3857')
      });
    });

    it('works for identity reprojection', function(done) {
      testSingleImage(source, 'EPSG:3857',
          ol.tilegrid.createXYZ().getTileCoordExtent([5, 5, -13]),
          2 * ol.proj.EPSG3857.HALF_SIZE / (256 * (1 << 5)), 1,
          'spec/ol/data/tiles/osm/5/5/12.png', done);
    });

    it('to EPSG:4326', function(done) {
      testSingleImage(source, 'EPSG:4326',
          ol.tilegrid.createForProjection('EPSG:4326').
              getTileCoordExtent([6, 10, -10]),
          360 / (256 * (1 << 4)), 1,
          'spec/ol/reproj/expected/image-3857-to-4326.png', done);
    });
  });
});
