goog.provide('ol.test.renderer.canvas.TileLayer');

goog.require('ol.transform');
goog.require('ol.layer.Tile');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.canvas.TileLayer');
goog.require('ol.source.XYZ');


describe('ol.renderer.canvas.TileLayer', function() {

  describe('#composeFrame()', function() {
    it('uses correct draw scale when rotating (HiDPI)', function() {
      var layer = new ol.layer.Tile({
        source: new ol.source.XYZ()
      });
      var renderer = new ol.renderer.canvas.TileLayer(layer);
      renderer.renderedTiles = [];
      var frameState = {
        viewState: {
          center: [2, 3],
          projection: ol.proj.get('EPSG:3857'),
          resolution: 1,
          rotation: Math.PI
        },
        size: [10, 10],
        pixelRatio: 2,
        coordinateToPixelTransform: ol.transform.create(),
        pixelToCoordinateTransform: ol.transform.create()
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
      renderer.composeFrame(frameState, layerState, context);
      expect(context.drawImage.firstCall.args[0].width).to.be(112);
    });
  });

});
