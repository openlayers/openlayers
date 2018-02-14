import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import TileLayer from '../../../../../src/ol/layer/Tile.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import MapRenderer from '../../../../../src/ol/renderer/Map.js';
import CanvasTileLayerRenderer from '../../../../../src/ol/renderer/canvas/TileLayer.js';
import TileWMS from '../../../../../src/ol/source/TileWMS.js';
import XYZ from '../../../../../src/ol/source/XYZ.js';
import {create as createTransform} from '../../../../../src/ol/transform.js';


describe('ol.renderer.canvas.TileLayer', function() {

  describe('#prepareFrame', function() {

    let map, target, source, tile;
    beforeEach(function(done) {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      source = new TileWMS({
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
      const layer = map.getLayers().item(0);
      source.updateParams({TIME: '1'});
      map.renderSync();
      const tiles = map.getRenderer().getLayerRenderer(layer).renderedTiles;
      expect(tiles.length).to.be(1);
      expect(tiles[0]).to.equal(tile);
    });
  });

  describe('#composeFrame()', function() {

    let img = null;
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
      const layer = new TileLayer({
        source: new XYZ({
          tileSize: 1
        })
      });
      const renderer = new CanvasTileLayerRenderer(layer);
      renderer.renderedTiles = [];
      const frameState = {
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
        coordinateToPixelTransform: createTransform(),
        pixelToCoordinateTransform: createTransform(),
        usedTiles: {},
        wantedTiles: {}
      };
      renderer.getImageTransform = function() {
        return createTransform();
      };
      MapRenderer.prototype.calculateMatrices2D(frameState);
      const layerState = layer.getLayerState();
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const context = {
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
