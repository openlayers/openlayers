import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import ImageLayer from '../../../../../src/ol/layer/Image.js';
import Projection from '../../../../../src/ol/proj/Projection.js';
import Static from '../../../../../src/ol/source/ImageStatic.js';


describe('ol.renderer.canvas.ImageLayer', function() {

  describe('#forEachLayerAtCoordinate', function() {

    let map, target, source;
    beforeEach(function(done) {
      const projection = new Projection({
        code: 'custom-image',
        units: 'pixels',
        extent: [0, 0, 200, 200]
      });
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      source = new Static({
        url: 'spec/ol/data/dot.png',
        projection: projection,
        imageExtent: [0, 0, 20, 20]
      });
      map = new Map({
        pixelRatio: 1,
        target: target,
        layers: [new ImageLayer({
          source: source
        })],
        view: new View({
          projection: projection,
          center: [10, 10],
          zoom: 2,
          maxZoom: 8
        })
      });
      source.on('imageloadend', function() {
        done();
      });
    });

    afterEach(function() {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('properly detects pixels', function() {
      map.renderSync();
      let has = false;
      function hasLayer() {
        has = true;
      }
      map.forEachLayerAtPixel([20, 80], hasLayer);
      expect(has).to.be(true);
      has = false;
      map.forEachLayerAtPixel([10, 90], hasLayer);
      expect(has).to.be(false);
    });
  });

});
