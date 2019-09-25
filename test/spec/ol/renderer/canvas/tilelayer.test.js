import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import TileLayer from '../../../../../src/ol/layer/Tile.js';
import TileWMS from '../../../../../src/ol/source/TileWMS.js';
import XYZ from '../../../../../src/ol/source/XYZ.js';
import {fromLonLat} from '../../../../../src/ol/proj.js';


describe('ol.renderer.canvas.TileLayer', () => {

  describe('#prepareFrame', () => {

    let map, target, source, tile;
    beforeEach(done => {
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

    afterEach(() => {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    test('properly handles interim tiles', done => {
      const layer = map.getLayers().item(0);
      source.once('tileloadend', function(e) {
        expect(e.tile.inTransition()).toBe(false);
        done();
      });
      source.updateParams({TIME: '1'});
      map.renderSync();
      const tiles = layer.getRenderer().renderedTiles;
      expect(tiles.length).toBe(1);
      expect(tiles[0]).toBe(tile);
      expect(tile.inTransition()).toBe(true);
    });
  });

  describe('#renderFrame', () => {
    let map, layer;
    beforeEach(() => {
      layer = new TileLayer({
        source: new XYZ({
          cacheSize: 1,
          url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png'
        })
      });
      map = new Map({
        target: createMapDiv(100, 100),
        layers: [layer],
        view: new View({
          center: fromLonLat([-122.416667, 37.783333]),
          zoom: 5
        })
      });
    });
    afterEach(() => {
      disposeMap(map);
    });

    test('increases the cache size if necessary', done => {
      const tileCache = layer.getSource().tileCache;
      expect(tileCache.highWaterMark).toBe(1);
      map.once('rendercomplete', function() {
        expect(tileCache.highWaterMark).toBe(2);
        done();
      });
    });

    test('respects the source\'s zDirection setting', done => {
      layer.getSource().zDirection = 1;
      map.getView().setZoom(5.8); // would lead to z6 tile request with the default zDirection
      map.once('rendercomplete', function() {
        const tileCache = layer.getSource().tileCache;
        const keys = tileCache.getKeys();
        expect(keys.some(key => key.startsWith('6/'))).toBe(false);
        done();
      });
    });
  });

});
