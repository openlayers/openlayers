goog.provide('ol.test.renderer.canvas.Map');

goog.require('ol');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.canvas.Map');
goog.require('ol.source.Vector');


describe('ol.renderer.canvas.Map', function() {

  describe('constructor', function() {

    it('creates a new instance', function() {
      var map = new ol.Map({
        target: document.createElement('div')
      });
      var renderer = new ol.renderer.canvas.Map(map.viewport_, map);
      expect(renderer).to.be.a(ol.renderer.canvas.Map);
    });

  });

  describe('#forEachFeatureAtCoordinate', function() {

    var layer, map, target;

    beforeEach(function() {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new ol.Map({
        target: target,
        view: new ol.View({
          center: [0, 0],
          zoom: 0
        })
      });
      layer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: [
            new ol.Feature({
              geometry: new ol.geom.Point([0, 0])
            })
          ]
        })
      });
    });

    afterEach(function() {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('calls callback with layer for managed layers', function() {
      map.addLayer(layer);
      map.renderSync();
      var cb = sinon.spy();
      map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]), cb);
      expect(cb).to.be.called();
      expect(cb.firstCall.args[1]).to.be(layer);
    });

    it('calls callback with null for unmanaged layers', function() {
      layer.setMap(map);
      map.renderSync();
      var cb = sinon.spy();
      map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]), cb);
      expect(cb).to.be.called();
      expect(cb.firstCall.args[1]).to.be(null);
    });

    it('calls callback with main layer when skipped feature on unmanaged layer', function() {
      var feature = layer.getSource().getFeatures()[0];
      var managedLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: [feature]
        })
      });
      map.addLayer(managedLayer);
      map.skipFeature(feature);
      layer.setMap(map);
      map.renderSync();
      var cb = sinon.spy();
      map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]), cb);
      expect(cb.callCount).to.be(1);
      expect(cb.firstCall.args[1]).to.be(managedLayer);
    });

    it('filters managed layers', function() {
      map.addLayer(layer);
      map.renderSync();
      var cb = sinon.spy();
      map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]), cb, null,
          function() {
            return false;
          });
      expect(cb).to.not.be.called();
    });

    it('doesn\'t fail with layer with no source', function() {
      map.addLayer(new ol.layer.Tile());
      map.renderSync();
      expect(function() {
        map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]),
            function() {});
      }).to.not.throwException();
    });

  });

  describe('#renderFrame()', function() {
    var layer, map, renderer;

    beforeEach(function() {
      map = new ol.Map({});
      map.on('postcompose', function() {});
      layer = new ol.layer.Vector({
        source: new ol.source.Vector({wrapX: true})
      });
      renderer = map.getRenderer();
      renderer.layerRenderers_ = {};
      var layerRenderer = new ol.renderer.canvas.Layer(layer);
      layerRenderer.prepareFrame = function() {
        return true;
      };
      layerRenderer.getImage = function() {
        return null;
      };
      renderer.layerRenderers_[ol.getUid(layer)] = layerRenderer;
    });

  });

});
