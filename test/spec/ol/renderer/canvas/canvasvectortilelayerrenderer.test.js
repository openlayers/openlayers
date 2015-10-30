goog.provide('ol.test.renderer.canvas.VectorTileLayer');

describe('ol.renderer.canvas.VectorTileLayer', function() {

  describe('constructor', function() {

    it('creates a new instance', function() {
      var layer = new ol.layer.VectorTile({
        source: new ol.source.VectorTile({})
      });
      var renderer = new ol.renderer.canvas.VectorTileLayer(layer);
      expect(renderer).to.be.a(ol.renderer.canvas.VectorTileLayer);
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
      var TileClass = function() {
        ol.VectorTile.apply(this, arguments);
        this.setState('loaded');
        this.setFeatures([feature1, feature2]);
        this.setProjection(ol.proj.get('EPSG:3857'));
      };
      ol.inherits(TileClass, ol.VectorTile);
      var source = new ol.source.VectorTile({
        format: new ol.format.MVT(),
        tileClass: TileClass,
        tileGrid: ol.tilegrid.createXYZ()
      });
      var layer = new ol.layer.VectorTile({
        source: source,
        style: layerStyle
      });
      map.addLayer(layer);
      var spy = sinon.spy(map.getRenderer().getLayerRenderer(layer),
          'renderFeature');
      map.renderSync();
      expect(spy.getCall(0).args[2]).to.be(layerStyle);
      expect(spy.getCall(1).args[2]).to.be(featureStyle);
      document.body.removeChild(target);
    });

  });

  describe('#forEachFeatureAtCoordinate', function() {
    var layer, renderer, replayGroup;
    var TileClass = function() {
      ol.VectorTile.apply(this, arguments);
      this.setState('loaded');
      this.setProjection(ol.proj.get('EPSG:3857'));
      this.replayState_.replayGroup = replayGroup;
    };
    ol.inherits(TileClass, ol.VectorTile);

    beforeEach(function() {
      replayGroup = {};
      layer = new ol.layer.VectorTile({
        source: new ol.source.VectorTile({
          tileClass: TileClass,
          tileGrid: ol.tilegrid.createXYZ()
        })
      });
      renderer = new ol.renderer.canvas.VectorTileLayer(layer);
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
      frameState.layerStates[goog.getUid(layer)] = {};
      renderer.renderedTiles_ = [new TileClass([0, 0, -1])];
      renderer.forEachFeatureAtCoordinate(
          coordinate, frameState, spy, undefined);
      expect(spy.callCount).to.be(1);
      expect(spy.getCall(0).args[1]).to.equal(layer);
    });
  });

});


goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.VectorTile');
goog.require('ol.View');
goog.require('ol.format.MVT');
goog.require('ol.geom.Point');
goog.require('ol.layer.VectorTile');
goog.require('ol.proj');
goog.require('ol.renderer.canvas.VectorTileLayer');
goog.require('ol.source.VectorTile');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
