goog.provide('ol.test.renderer.canvas.VectorTileLayer');

goog.require('ol');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.VectorTile');
goog.require('ol.View');
goog.require('ol.format.MVT');
goog.require('ol.geom.Point');
goog.require('ol.layer.VectorTile');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.renderer.canvas.VectorTileLayer');
goog.require('ol.source.VectorTile');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
goog.require('ol.tilegrid');


describe('ol.renderer.canvas.VectorTileLayer', function() {

  describe('constructor', function() {

    var map, layer, feature1, feature2, target, tileCallback;

    beforeEach(function() {
      tileCallback = function() {};
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
      map = new ol.Map({
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
      feature1 = new ol.Feature(new ol.geom.Point([1, -1]));
      feature2 = new ol.Feature(new ol.geom.Point([0, 0]));
      feature2.setStyle(featureStyle);
      var TileClass = function() {
        ol.VectorTile.apply(this, arguments);
        this.setState('loaded');
        this.setFeatures([feature1, feature2]);
        this.setProjection(ol.proj.get('EPSG:4326'));
        tileCallback(this);
      };
      ol.inherits(TileClass, ol.VectorTile);
      var source = new ol.source.VectorTile({
        format: new ol.format.MVT(),
        tileClass: TileClass,
        tileGrid: ol.tilegrid.createXYZ()
      });
      layer = new ol.layer.VectorTile({
        source: source,
        style: layerStyle
      });
      map.addLayer(layer);
    });

    afterEach(function() {
      document.body.removeChild(target);
      map.dispose();
    });

    it('creates a new instance', function() {
      var renderer = new ol.renderer.canvas.VectorTileLayer(layer);
      expect(renderer).to.be.a(ol.renderer.canvas.VectorTileLayer);
      expect(renderer.zDirection).to.be(0);
    });

    it('uses lower resolution for pure vector rendering', function() {
      layer.renderMode_ = 'vector';
      var renderer = new ol.renderer.canvas.VectorTileLayer(layer);
      expect(renderer.zDirection).to.be(1);
    });

    it('does not render images for pure vector rendering', function() {
      layer.renderMode_ = 'vector';
      var spy = sinon.spy(ol.renderer.canvas.VectorTileLayer.prototype,
          'renderTileImages');
      map.renderSync();
      expect(spy.callCount).to.be(0);
      spy.restore();
    });

    it('does not render replays for pure image rendering', function() {
      layer.renderMode_ = 'image';
      var spy = sinon.spy(ol.renderer.canvas.VectorTileLayer.prototype,
          'renderTileReplays_');
      map.renderSync();
      expect(spy.callCount).to.be(0);
      spy.restore();
    });

    it('renders both replays and images for hybrid rendering', function() {
      var spy1 = sinon.spy(ol.renderer.canvas.VectorTileLayer.prototype,
          'renderTileReplays_');
      var spy2 = sinon.spy(ol.renderer.canvas.VectorTileLayer.prototype,
          'renderTileImages');
      map.renderSync();
      expect(spy1.callCount).to.be(1);
      expect(spy2.callCount).to.be(1);
      spy1.restore();
      spy2.restore();
    });

    it('gives precedence to feature styles over layer styles', function() {
      var spy = sinon.spy(map.getRenderer().getLayerRenderer(layer),
          'renderFeature');
      map.renderSync();
      expect(spy.getCall(0).args[2]).to.be(layer.getStyle());
      expect(spy.getCall(1).args[2]).to.be(feature2.getStyle());
    });

    it('transforms geometries when tile and view projection are different', function() {
      var tile;
      tileCallback = function(t) {
        tile = t;
      };
      map.renderSync();
      expect(tile.getProjection()).to.equal(ol.proj.get('EPSG:3857'));
      expect(feature1.getGeometry().getCoordinates()).to.eql(
          ol.proj.fromLonLat([1, -1]));
    });

    it('leaves geometries untouched when units are tile-pixels', function() {
      var proj = new ol.proj.Projection({code: '', units: 'tile-pixels'});
      var tile;
      tileCallback = function(t) {
        t.setProjection(proj);
        tile = t;
      };
      map.renderSync();
      expect(tile.getProjection()).to.equal(proj);
      expect(feature1.getGeometry().getCoordinates()).to.eql([1, -1]);
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
      frameState.layerStates[ol.getUid(layer)] = {};
      renderer.renderedTiles = [new TileClass([0, 0, -1])];
      renderer.forEachFeatureAtCoordinate(
          coordinate, frameState, spy, undefined);
      expect(spy.callCount).to.be(1);
      expect(spy.getCall(0).args[1]).to.equal(layer);
    });
  });

});
