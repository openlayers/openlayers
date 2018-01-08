import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import TileLayer from '../../../../../src/ol/layer/Tile.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import _ol_renderer_Map_ from '../../../../../src/ol/renderer/Map.js';
import CanvasTileLayerRenderer from '../../../../../src/ol/renderer/canvas/TileLayer.js';
import _ol_source_TileWMS_ from '../../../../../src/ol/source/TileWMS.js';
import _ol_source_XYZ_ from '../../../../../src/ol/source/XYZ.js';
import _ol_transform_ from '../../../../../src/ol/transform.js';


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
      map = new Map({
        target: target,
        layers: [new TileLayer({
          source: source
        })],
        view: new View({
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
      var layer = new TileLayer({
        source: new _ol_source_XYZ_({
          tileSize: 1
        })
      });
      var renderer = new CanvasTileLayerRenderer(layer);
      renderer.renderedTiles = [];
      var frameState = {
        viewHints: [],
        time: Date.now(),
        viewState: {
          center: [10, 5],
          projection: getProjection('EPSG:3857'),
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
