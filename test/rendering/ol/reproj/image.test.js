import _ol_events_ from '../../../../src/ol/events.js';
import {get as getProjection} from '../../../../src/ol/proj.js';
import _ol_proj_EPSG3857_ from '../../../../src/ol/proj/EPSG3857.js';
import ReprojImage from '../../../../src/ol/reproj/Image.js';
import Static from '../../../../src/ol/source/ImageStatic.js';
import _ol_tilegrid_ from '../../../../src/ol/tilegrid.js';


describe('ol.rendering.reproj.Image', function() {

  function testSingleImage(source, targetProj,
    targetExtent, targetResolution, pixelRatio, expectedUrl, done) {
    const sourceProj = source.getProjection();

    let imagesRequested = 0;

    const image = new ReprojImage(sourceProj, getProjection(targetProj),
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

  let source;

  describe('image reprojections from EPSG:3857', function() {
    beforeEach(function() {
      source = new Static({
        url: 'rendering/ol/data/tiles/osm/5/5/12.png',
        imageExtent: _ol_tilegrid_.createXYZ().getTileCoordExtent([5, 5, -13]),
        projection: getProjection('EPSG:3857')
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
