goog.provide('ol.test.rendering.reproj.Image');

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
    if (image.getState() == ol.ImageState.IDLE) {
      image.listen('change', function(e) {
        if (image.getState() == ol.ImageState.LOADED) {
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

  describe('dateline wrapping', function() {
    beforeEach(function() {
      source = new ol.source.ImageStatic({
        url: 'spec/ol/data/tiles/4326/0/0/0.png',
        imageExtent: [-180, -270, 180, 90],
        projection: ol.proj.get('EPSG:4326')
      });
    });

    it('wraps X when prime meridian is shifted', function(done) {
      proj4.defs('merc_180', '+proj=merc +lon_0=180 +units=m +no_defs');
      var projExtent = [-20026376.39, -20048966.10, 20026376.39, 20048966.10];

      testSingleImage(source, 'merc_180', projExtent,
          ol.extent.getWidth(projExtent) / 64, 1,
          'spec/ol/reproj/expected/image-dateline-merc-180.png', done);
    });

    it('displays north pole correctly (EPSG:3413)', function(done) {
      proj4.defs('EPSG:3413', '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 ' +
          '+k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');

      var projExtent = [-4194304, -4194304, 4194304, 4194304];

      testSingleImage(source, 'EPSG:3413', projExtent,
          ol.extent.getWidth(projExtent) / 64, 1,
          'spec/ol/reproj/expected/image-dateline-pole.png', done);
    });
  });
});

goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.proj.EPSG3857');
goog.require('ol.reproj.Image');
goog.require('ol.source.ImageStatic');
goog.require('ol.ImageState');
