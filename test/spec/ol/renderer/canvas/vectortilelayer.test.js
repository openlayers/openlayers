goog.require('ol');
goog.require('ol.obj');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.TileState');
goog.require('ol.VectorImageTile');
goog.require('ol.VectorTile');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.format.MVT');
goog.require('ol.geom.Point');
goog.require('ol.layer.VectorTile');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.render.canvas');
goog.require('ol.render.Feature');
goog.require('ol.renderer.canvas.VectorTileLayer');
goog.require('ol.source.VectorTile');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
goog.require('ol.tilegrid');


describe('ol.renderer.canvas.VectorTileLayer', function() {

  describe('constructor', function() {

    var head = document.getElementsByTagName('head')[0];
    var font = document.createElement('link');
    font.href = 'https://fonts.googleapis.com/css?family=Dancing+Script';
    font.rel = 'stylesheet';

    var map, layer, layerStyle, source, feature1, feature2, feature3, target, tileCallback;

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
      layerStyle = [new ol.style.Style({
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
      feature3 = new ol.render.Feature('Point', [1, -1], []);
      feature2.setStyle(featureStyle);
      var TileClass = function() {
        ol.VectorTile.apply(this, arguments);
        this.setState('loaded');
        this.setFeatures([feature1, feature2, feature3]);
        this.setProjection(ol.proj.get('EPSG:4326'));
        tileCallback(this);
      };
      ol.inherits(TileClass, ol.VectorTile);
      source = new ol.source.VectorTile({
        format: new ol.format.MVT(),
        tileClass: TileClass,
        tileGrid: ol.tilegrid.createXYZ()
      });
      source.getTile = function() {
        var tile = ol.source.VectorTile.prototype.getTile.apply(source, arguments);
        tile.setState(ol.TileState.LOADED);
        return tile;
      };
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
          'renderTileImage_');
      map.renderSync();
      expect(spy.callCount).to.be(0);
      spy.restore();
    });

    it('does not render replays for pure image rendering', function() {
      layer.renderMode_ = 'image';
      var spy = sinon.spy(ol.renderer.canvas.VectorTileLayer.prototype,
          'getTransform');
      map.renderSync();
      expect(spy.callCount).to.be(0);
      spy.restore();
    });

    it('renders both replays and images for hybrid rendering', function() {
      var spy1 = sinon.spy(ol.renderer.canvas.VectorTileLayer.prototype,
          'getTransform');
      var spy2 = sinon.spy(ol.renderer.canvas.VectorTileLayer.prototype,
          'renderTileImage_');
      map.renderSync();
      expect(spy1.callCount).to.be(1);
      expect(spy2.callCount).to.be(1);
      spy1.restore();
      spy2.restore();
    });

    it('renders replays with custom renderers as direct replays', function() {
      layer.renderMode_ = 'image';
      layer.setStyle(new ol.style.Style({
        renderer: function() {}
      }));
      var spy = sinon.spy(ol.renderer.canvas.VectorTileLayer.prototype,
          'getTransform');
      map.renderSync();
      expect(spy.callCount).to.be(1);
      spy.restore();
    });

    it('gives precedence to feature styles over layer styles', function() {
      var spy = sinon.spy(map.getRenderer().getLayerRenderer(layer),
          'renderFeature');
      map.renderSync();
      expect(spy.getCall(0).args[2]).to.be(layer.getStyle());
      expect(spy.getCall(1).args[2]).to.be(feature2.getStyle());
      spy.restore();
    });

    it('does not re-render for unavailable fonts', function(done) {
      map.renderSync();
      ol.obj.clear(ol.render.canvas.checkedFonts_);
      layerStyle[0].getText().setFont('12px "Unavailable font",sans-serif');
      layer.changed();
      var revision = layer.getRevision();
      setTimeout(function() {
        expect(layer.getRevision()).to.be(revision);
        done();
      }, 800);
    });

    it('does not re-render for available fonts', function(done) {
      map.renderSync();
      ol.obj.clear(ol.render.canvas.checkedFonts_);
      layerStyle[0].getText().setFont('12px sans-serif');
      layer.changed();
      var revision = layer.getRevision();
      setTimeout(function() {
        expect(layer.getRevision()).to.be(revision);
        done();
      }, 800);
    });

    it('re-renders for fonts that become available', function(done) {
      map.renderSync();
      ol.obj.clear(ol.render.canvas.checkedFonts_);
      head.appendChild(font);
      layerStyle[0].getText().setFont('12px "Dancing Script",sans-serif');
      layer.changed();
      var revision = layer.getRevision();
      setTimeout(function() {
        head.removeChild(font);
        expect(layer.getRevision()).to.be(revision + 1);
        done();
      }, 1600);
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

    it('Geometries are transformed from tile-pixels', function() {
      var proj = new ol.proj.Projection({code: 'EPSG:3857', units: 'tile-pixels'});
      var tile;
      tileCallback = function(t) {
        t.setProjection(proj);
        tile = t;
      };
      map.renderSync();
      expect(tile.getProjection()).to.equal(ol.proj.get('EPSG:3857'));
      expect(feature1.getGeometry().getCoordinates()).to.eql([-20027724.40316874, 20047292.282409746]);
      expect(feature3.flatCoordinates_).to.eql([-20027724.40316874, 20047292.282409746]);
    });

    it('works for multiple layers that use the same source', function() {
      var layer2 = new ol.layer.VectorTile({
        source: source,
        style: new ol.style.Style({
          text: new ol.style.Text({
            text: 'layer2'
          })
        })
      });
      map.addLayer(layer2);

      var spy1 = sinon.spy(ol.VectorTile.prototype,
          'getReplayGroup');
      var spy2 = sinon.spy(ol.VectorTile.prototype,
          'setReplayGroup');
      map.renderSync();
      expect(spy1.callCount).to.be(4);
      expect(spy2.callCount).to.be(2);
      spy1.restore();
      spy2.restore();
    });

  });

  describe('#prepareFrame', function() {
    it('re-renders when layer changed', function() {
      var layer = new ol.layer.VectorTile({
        source: new ol.source.VectorTile({
          tileGrid: ol.tilegrid.createXYZ(),
          transition: 0
        })
      });
      var sourceTile = new ol.VectorTile([0, 0, 0], 2);
      sourceTile.setProjection(ol.proj.get('EPSG:3857'));
      sourceTile.features_ = [];
      sourceTile.getImage = function() {
        return document.createElement('canvas');
      };
      var tile = new ol.VectorImageTile([0, 0, 0]);
      tile.transition_ = 0;
      tile.wrappedTileCoord = [0, 0, 0];
      tile.setState(ol.TileState.LOADED);
      tile.getSourceTile = function() {
        return sourceTile;
      };
      layer.getSource().getTile = function() {
        return tile;
      };
      var renderer = new ol.renderer.canvas.VectorTileLayer(layer);
      renderer.renderTileImage_ = sinon.spy();
      var proj = ol.proj.get('EPSG:3857');
      var frameState = {
        extent: proj.getExtent(),
        pixelRatio: 1,
        time: Date.now(),
        viewHints: [],
        viewState: {
          center: [0, 0],
          resolution: 156543.03392804097,
          projection: proj
        },
        size: [256, 256],
        usedTiles: {},
        wantedTiles: {}
      };
      renderer.prepareFrame(frameState, {});
      expect(renderer.renderTileImage_.getCalls().length).to.be(1);
      renderer.prepareFrame(frameState, {});
      expect(renderer.renderTileImage_.getCalls().length).to.be(1);
      layer.changed();
      renderer.prepareFrame(frameState, {});
      expect(renderer.renderTileImage_.getCalls().length).to.be(2);
    });
  });

  describe('#forEachFeatureAtCoordinate', function() {
    var layer, renderer, replayGroup;
    var TileClass = function() {
      ol.VectorImageTile.apply(this, arguments);
      this.setState('loaded');
      var sourceTile = new ol.VectorTile([0, 0, 0]);
      sourceTile.setProjection(ol.proj.get('EPSG:3857'));
      sourceTile.getReplayGroup = function() {
        return replayGroup;
      };
      var key = sourceTile.tileCoord.toString();
      this.tileKeys = [key];
      this.sourceTiles_ = {};
      this.sourceTiles_[key] = sourceTile;
      this.wrappedTileCoord = arguments[0];
    };
    ol.inherits(TileClass, ol.VectorImageTile);

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
          resolution, rotation, hitTolerance, skippedFeaturesUids, callback) {
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
          projection: ol.proj.get('EPSG:3857'),
          resolution: 1,
          rotation: 0
        }
      };
      frameState.layerStates[ol.getUid(layer)] = {};
      renderer.renderedTiles = [new TileClass([0, 0, -1])];
      renderer.forEachFeatureAtCoordinate(
          coordinate, frameState, 0, spy, undefined);
      expect(spy.callCount).to.be(1);
      expect(spy.getCall(0).args[1]).to.equal(layer);
    });

    it('does not give false positives when overzoomed', function(done) {
      var target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      var extent = [1824704.739223726, 6141868.096770482, 1827150.7241288517, 6144314.081675608];
      var source = new ol.source.VectorTile({
        format: new ol.format.MVT(),
        url: 'spec/ol/data/14-8938-5680.vector.pbf',
        minZoom: 14,
        maxZoom: 14
      });
      var map = new ol.Map({
        target: target,
        layers: [
          new ol.layer.VectorTile({
            extent: extent,
            source: source
          })
        ],
        view: new ol.View({
          center: ol.extent.getCenter(extent),
          zoom: 19
        })
      });
      source.on('tileloadend', function() {
        setTimeout(function() {
          var features = map.getFeaturesAtPixel([96, 96]);
          document.body.removeChild(target);
          map.dispose();
          expect(features).to.be(null);
          done();
        }, 200);
      });
    });

  });
});
