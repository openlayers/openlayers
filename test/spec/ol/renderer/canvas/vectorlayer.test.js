goog.provide('ol.test.renderer.canvas.VectorLayer');

goog.require('ol');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.geom.Point');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.renderer.canvas.VectorLayer');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');
goog.require('ol.style.Text');


describe('ol.renderer.canvas.VectorLayer', function() {

  describe('constructor', function() {

    it('creates a new instance', function() {
      var layer = new ol.layer.Vector({
        source: new ol.source.Vector()
      });
      var renderer = new ol.renderer.canvas.VectorLayer(layer);
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

  describe('#forEachFeatureAtCoordinate', function() {
    var layer, renderer;

    beforeEach(function() {
      layer = new ol.layer.Vector({
        source: new ol.source.Vector()
      });
      renderer = new ol.renderer.canvas.VectorLayer(layer);
      var replayGroup = {};
      renderer.replayGroup_ = replayGroup;
      replayGroup.forEachFeatureAtCoordinate = function(coordinate,
          resolution, rotation, skippedFeaturesUids, callback) {
        var feature = new ol.Feature();
        callback(feature);
        callback(feature);
      };
    });

    it('calls callback once per feature with a layer as 2nd arg', function() {
      var spy = sinon.spy();
      var coordinate = [0, 0];
      var frameState = {
        layerStates: {},
        skippedFeatureUids: {},
        viewState: {
          resolution: 1,
          rotation: 0
        }
      };
      frameState.layerStates[ol.getUid(layer)] = {};
      renderer.forEachFeatureAtCoordinate(
          coordinate, frameState, spy, undefined);
      expect(spy.callCount).to.be(1);
      expect(spy.getCall(0).args[1]).to.equal(layer);
    });
  });

  describe('#prepareFrame', function() {
    var frameState, projExtent, renderer, worldWidth, buffer;

    beforeEach(function() {
      var layer = new ol.layer.Vector({
        source: new ol.source.Vector({wrapX: true})
      });
      renderer = new ol.renderer.canvas.VectorLayer(layer);
      var projection = ol.proj.get('EPSG:3857');
      projExtent = projection.getExtent();
      worldWidth = ol.extent.getWidth(projExtent);
      buffer = layer.getRenderBuffer();
      frameState = {
        skippedFeatureUids: {},
        viewHints: [],
        viewState: {
          projection: projection,
          resolution: 1,
          rotation: 0
        }
      };
    });

    it('sets correct extent for small viewport near dateline', function() {

      frameState.extent =
          [projExtent[0] - 10000, -10000, projExtent[0] + 10000, 10000];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroup_.maxExtent_).to.eql(ol.extent.buffer([
        projExtent[0] - worldWidth + buffer,
        -10000, projExtent[2] + worldWidth - buffer, 10000
      ], buffer));

    });

    it('sets correct extent for viewport less than 1 world wide', function() {

      frameState.extent =
          [projExtent[0] - 10000, -10000, projExtent[1] - 10000, 10000];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroup_.maxExtent_).to.eql(ol.extent.buffer([
        projExtent[0] - worldWidth + buffer,
        -10000, projExtent[2] + worldWidth - buffer, 10000
      ], buffer));
    });

    it('sets correct extent for viewport more than 1 world wide', function() {

      frameState.extent =
          [2 * projExtent[0] - 10000, -10000, 2 * projExtent[1] + 10000, 10000];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroup_.maxExtent_).to.eql(ol.extent.buffer([
        projExtent[0] - worldWidth + buffer,
        -10000, projExtent[2] + worldWidth - buffer, 10000
      ], buffer));
    });

    it('sets correct extent for viewport more than 2 worlds wide', function() {

      frameState.extent = [
        projExtent[0] - 2 * worldWidth - 10000,
        -10000, projExtent[1] + 2 * worldWidth + 10000, 10000
      ];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroup_.maxExtent_).to.eql(ol.extent.buffer([
        projExtent[0] - 2 * worldWidth - 10000,
        -10000, projExtent[2] + 2 * worldWidth + 10000, 10000
      ], buffer));
    });

  });

});
