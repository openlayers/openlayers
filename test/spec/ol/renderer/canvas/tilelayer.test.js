

import _ol_Map_ from '../../../../../src/ol/map';
import _ol_View_ from '../../../../../src/ol/view';
import _ol_layer_Tile_ from '../../../../../src/ol/layer/tile';
import _ol_proj_ from '../../../../../src/ol/proj';
import _ol_renderer_Map_ from '../../../../../src/ol/renderer/map';
import _ol_renderer_canvas_TileLayer_ from '../../../../../src/ol/renderer/canvas/tilelayer';
import _ol_source_TileWMS_ from '../../../../../src/ol/source/tilewms';
import _ol_source_XYZ_ from '../../../../../src/ol/source/xyz';
import _ol_transform_ from '../../../../../src/ol/transform';


describe('ol.renderer.canvas.TileLayer', function() {

  describe('#prepareFrame', function() {

    var map, target, source, tile;
    beforeEach(function(done) {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      source = new _ol_source_TileWMS_({
        url: 'spec/ol/data/osm-0-0-0.png',
        params: {LAYERS: 'foo', TIME: '0'}
      });
      source.once('tileloadend', function(e) {
        tile = e.tile;
        done();
      });
      map = new _ol_Map_({
        target: target,
        layers: [new _ol_layer_Tile_({
          source: source
        })],
        view: new _ol_View_({
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
      var layer = new _ol_layer_Tile_({
        source: new _ol_source_XYZ_({
          tileSize: 1
        })
      });
      var renderer = new _ol_renderer_canvas_TileLayer_(layer);
      renderer.renderedTiles = [];
      var frameState = {
        viewHints: [],
        time: Date.now(),
        viewState: {
          center: [10, 5],
          projection: _ol_proj_.get('EPSG:3857'),
          resolution: 1,
          rotation: Math.PI
        },
        extent: [0, 0, 20, 10],
        size: [20, 10],
        pixelRatio: 2,
        coordinateToPixelTransform: _ol_transform_.create(),
        pixelToCoordinateTransform: _ol_transform_.create(),
        usedTiles: {},
        wantedTiles: {}
      };
      renderer.getImageTransform = function() {
        return _ol_transform_.create();
      };
      _ol_renderer_Map_.prototype.calculateMatrices2D(frameState);
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
