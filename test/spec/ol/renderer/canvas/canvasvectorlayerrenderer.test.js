goog.provide('ol.test.renderer.canvas.VectorLayer');

describe('ol.renderer.canvas.VectorLayer', function() {

  describe('constructor', function() {

    it('creates a new instance', function() {
      var map = new ol.Map({
        target: document.createElement('div')
      });
      var layer = new ol.layer.Vector({
        source: new ol.source.Vector()
      });
      var renderer = new ol.renderer.canvas.VectorLayer(map.getRenderer(),
          layer);
      expect(renderer).to.be.a(ol.renderer.canvas.VectorLayer);
    });

    it('gives precedence to feature styles over layer styles', function() {
      var target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
      var map = new ol.Map({
        view: new ol.View({
          center: [0, 0],
          zoom: 0
        }),
        target: target
      });
      var layerStyle = [new ol.style.Style({
        text: new ol.style.Text({
          text: 'layer'
        })
      })];
      var featureStyle = [new ol.style.Style({
        text: new ol.style.Text({
          text: 'feature'
        })
      })];
      var feature1 = new ol.Feature(new ol.geom.Point([0, 0]));
      var feature2 = new ol.Feature(new ol.geom.Point([0, 0]));
      feature2.setStyle(featureStyle);
      var layer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: [feature1, feature2]
        }),
        style: layerStyle
      });
      map.addLayer(layer);
      var spy = sinon.spy(map.getRenderer().getLayerRenderer(layer),
          'renderFeature');
      map.renderSync();
      expect(spy.getCall(0).args[3]).to.be(layerStyle);
      expect(spy.getCall(1).args[3]).to.be(featureStyle);
      document.body.removeChild(target);
    });

  });

  describe('#forEachFeatureAtPixel', function() {
    var renderer;

    beforeEach(function() {
      var map = new ol.Map({});
      var layer = new ol.layer.Vector({
        source: new ol.source.Vector()
      });
      renderer = new ol.renderer.canvas.VectorLayer(
          map.getRenderer(), layer);
      var replayGroup = {};
      renderer.replayGroup_ = replayGroup;
      replayGroup.forEachGeometryAtPixel = function(extent, resolution,
          rotation, coordinate, skippedFeaturesUids, callback) {
        var geometry = new ol.geom.Point([0, 0]);
        var feature = new ol.Feature();
        callback(geometry, feature);
        callback(geometry, feature);
      };
    });

    it('calls callback once per feature', function() {
      var spy = sinon.spy();
      var coordinate = [0, 0];
      var frameState = {
        extent: [1, 1, 10, 10],
        skippedFeatureUids: {},
        viewState: {
          resolution: 1,
          rotation: 0
        }
      };
      renderer.forEachFeatureAtPixel(
          coordinate, frameState, spy, undefined);
      expect(spy.callCount).to.be(1);
    });
  });

});


goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.layer.Vector');
goog.require('ol.renderer.canvas.VectorLayer');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
