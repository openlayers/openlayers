goog.provide('ol.test.renderer.canvas.TileLayer');

goog.require('ol.transform');
goog.require('ol.layer.Tile');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.canvas.TileLayer');
goog.require('ol.source.XYZ');


describe('ol.renderer.canvas.TileLayer', function() {
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

  describe('#composeFrame()', function() {
    it('uses correct draw scale when rotating (HiDPI)', function() {
      var layer = new ol.layer.Tile({
        source: new ol.source.XYZ()
      });
      layer.getSource().getTile = function(z, x, y) {
        var tile = new ol.Tile([z, x, y], 2);
        tile.getImage = function() {
          return {width: 256, height: 256};
        };
        return tile;
      };
      var renderer = new ol.renderer.canvas.TileLayer(layer);
      var frameState = {
        viewState: {
          center: [10, 5],
          projection: ol.proj.get('EPSG:3857'),
          resolution: layer.getSource().getTileGrid().getResolution(17),
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
      ol.renderer.Map.prototype.calculateMatrices2D(frameState);
      var layerState = layer.getLayerState();
      var canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      context = {
        canvas: canvas,
        drawImage: sinon.spy(),
        save: function() {},
        restore: function() {},
        setTransform: function() {}
      };
      renderer.prepareFrame(frameState, layerState);
      renderer.composeFrame(frameState, layerState, context);
      expect(context.drawImage.firstCall.args[7]).to.be(512);
    });
  });

});
