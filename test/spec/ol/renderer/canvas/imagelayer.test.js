goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.proj.Projection');
goog.require('ol.source.ImageStatic');


describe('ol.renderer.canvas.ImageLayer', function() {

  describe('#forEachLayerAtCoordinate', function() {

    var map, target, source;
    beforeEach(function(done) {
      var projection = new ol.proj.Projection({
        code: 'custom-image',
        units: 'pixels',
        extent: [0, 0, 200, 200]
      });
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      source = new ol.source.ImageStatic({
        url: 'spec/ol/data/dot.png',
        projection: projection,
        imageExtent: [0, 0, 20, 20]
      });
      map = new ol.Map({
        pixelRatio: 1,
        target: target,
        layers: [new ol.layer.Image({
          source: source
        })],
        view: new ol.View({
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
