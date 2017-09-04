

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.canvas.TileLayer');
goog.require('ol.source.TileWMS');
goog.require('ol.source.XYZ');
goog.require('ol.transform');


describe('ol.renderer.canvas.TileLayer', function() {

  describe('#prepareFrame', function() {

    var map, target, source, tile;
    beforeEach(function(done) {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      source = new ol.source.TileWMS({
        url: 'spec/ol/data/osm-0-0-0.png',
        params: {LAYERS: 'foo', TIME: '0'}
      });
      source.once('tileloadend', function(e) {
        tile = e.tile;
        done();
      });
      map = new ol.Map({
        target: target,
        layers: [new ol.layer.Tile({
          source: source
        })],
        view: new ol.View({
          zoom: 0,
          center: [0, 0]
        })
      });
    });

    afterEach(function() {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('properly handles interim tiles', function() {
      var layer = map.getLayers().item(0);
      source.updateParams({TIME: '1'});
      map.renderSync();
      var tiles = map.getRenderer().getLayerRenderer(layer).renderedTiles;
      expect(tiles.length).to.be(1);
      expect(tiles[0]).to.equal(tile);
    });
  });

  describe('#composeFrame()', function() {

    var img = null;
    beforeEach(function(done) {
      img = new Image(1, 1);
      img.onload = function() {
        done();
      };
      img.src = 'data:image/gif;base64,' +
        'R0lGODlhAQABAPAAAP8AAP///yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
    });
    afterEach(function() {
      img = null;
    });

    it('uses correct draw scale when rotating (HiDPI)', function() {
      var layer = new ol.layer.Tile({
        source: new ol.source.XYZ({
          tileSize: 1
        })
      });
      var renderer = new ol.renderer.canvas.TileLayer(layer);
      renderer.renderedTiles = [];
      var frameState = {
        viewHints: [],
        time: Date.now(),
        viewState: {
          center: [10, 5],
          projection: ol.proj.get('EPSG:3857'),
          resolution: 1,
          rotation: Math.PI
        },
        extent: [0, 0, 20, 10],
        size: [20, 10],
        pixelRatio: 2,
        coordinateToPixelTransform: ol.transform.create(),
        pixelToCoordinateTransform: ol.transform.create(),
        usedTiles: {},
        wantedTiles: {}
      };
      renderer.getImageTransform = function() {
        return ol.transform.create();
      };
      ol.renderer.Map.prototype.calculateMatrices2D(frameState);
      var layerState = layer.getLayerState();
      var canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      var context = {
        canvas: canvas,
        drawImage: sinon.spy()
      };
      renderer.renderedTiles = [{
        getTileCoord: function() {
          return [0, 0, 0];
        },
        getImage: function() {
          return img;
        }
      }];
      renderer.prepareFrame(frameState, layerState);
      renderer.composeFrame(frameState, layerState, context);
      expect(context.drawImage.firstCall.args[0].width).to.be(17);
    });
  });

});
