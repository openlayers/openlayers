import _ol_Map_ from '../../../../../src/ol/Map.js';
import _ol_View_ from '../../../../../src/ol/View.js';
import _ol_layer_Image_ from '../../../../../src/ol/layer/Image.js';
import _ol_proj_Projection_ from '../../../../../src/ol/proj/Projection.js';
import _ol_source_ImageStatic_ from '../../../../../src/ol/source/ImageStatic.js';


describe('ol.renderer.canvas.ImageLayer', function() {

  describe('#forEachLayerAtCoordinate', function() {

    var map, target, source;
    beforeEach(function(done) {
      var projection = new _ol_proj_Projection_({
        code: 'custom-image',
        units: 'pixels',
        extent: [0, 0, 200, 200]
      });
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      source = new _ol_source_ImageStatic_({
        url: 'spec/ol/data/dot.png',
        projection: projection,
        imageExtent: [0, 0, 20, 20]
      });
      map = new _ol_Map_({
        pixelRatio: 1,
        target: target,
        layers: [new _ol_layer_Image_({
          source: source
        })],
        view: new _ol_View_({
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
      var has = false;
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
