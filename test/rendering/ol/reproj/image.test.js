

import _ol_events_ from '../../../../src/ol/events';
import _ol_proj_ from '../../../../src/ol/proj';
import _ol_proj_EPSG3857_ from '../../../../src/ol/proj/epsg3857';
import _ol_reproj_Image_ from '../../../../src/ol/reproj/image';
import _ol_source_ImageStatic_ from '../../../../src/ol/source/imagestatic';
import _ol_tilegrid_ from '../../../../src/ol/tilegrid';


describe('ol.rendering.reproj.Image', function() {

  function testSingleImage(source, targetProj,
      targetExtent, targetResolution, pixelRatio, expectedUrl, done) {
    var sourceProj = source.getProjection();

    var imagesRequested = 0;

    var image = new _ol_reproj_Image_(sourceProj, _ol_proj_.get(targetProj),
        targetExtent, targetResolution, pixelRatio,
        function(extent, resolution, pixelRatio) {
          imagesRequested++;
          return source.getImage(extent, resolution, pixelRatio, sourceProj);
        });
    if (image.getState() == 0) { // IDLE
      _ol_events_.listen(image, 'change', function(e) {
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
      source = new _ol_source_ImageStatic_({
        url: 'rendering/ol/data/tiles/osm/5/5/12.png',
        imageExtent: _ol_tilegrid_.createXYZ().getTileCoordExtent([5, 5, -13]),
        projection: _ol_proj_.get('EPSG:3857')
      });
    });

    it('works for identity reprojection', function(done) {
      testSingleImage(source, 'EPSG:3857',
          _ol_tilegrid_.createXYZ().getTileCoordExtent([5, 5, -13]),
          2 * _ol_proj_EPSG3857_.HALF_SIZE / (256 * (1 << 5)), 1,
          'rendering/ol/data/tiles/osm/5/5/12.png', done);
    });

    it('to EPSG:4326', function(done) {
      testSingleImage(source, 'EPSG:4326',
          _ol_tilegrid_.createForProjection('EPSG:4326').
              getTileCoordExtent([6, 10, -10]),
          360 / (256 * (1 << 4)), 1,
          'rendering/ol/reproj/expected/image-3857-to-4326.png', done);
    });
  });
});
