import {listen} from '../../../../src/ol/events.js';
import {get as getProjection} from '../../../../src/ol/proj.js';
import {HALF_SIZE} from '../../../../src/ol/proj/epsg3857.js';
import ReprojImage from '../../../../src/ol/reproj/Image.js';
import Static from '../../../../src/ol/source/ImageStatic.js';
import {createXYZ, createForProjection} from '../../../../src/ol/tilegrid.js';


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
      listen(image, 'change', function(e) {
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
        imageExtent: createXYZ().getTileCoordExtent([5, 5, -13]),
        projection: getProjection('EPSG:3857')
      });
    });

    it('works for identity reprojection', function(done) {
      testSingleImage(source, 'EPSG:3857',
        createXYZ().getTileCoordExtent([5, 5, -13]),
        2 * HALF_SIZE / (256 * (1 << 5)), 1,
        'rendering/ol/data/tiles/osm/5/5/12.png', done);
    });

    it('to EPSG:4326', function(done) {
      testSingleImage(source, 'EPSG:4326',
        createForProjection('EPSG:4326').
          getTileCoordExtent([6, 10, -10]),
        360 / (256 * (1 << 4)), 1,
        'rendering/ol/reproj/expected/image-3857-to-4326.png', done);
    });
  });
});
