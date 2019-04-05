import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import TileLayer from '../../../../../src/ol/layer/Tile.js';
import TileWMS from '../../../../../src/ol/source/TileWMS.js';
import XYZ from '../../../../../src/ol/source/XYZ.js';
import {fromLonLat} from '../../../../../src/ol/proj.js';


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

    it('properly handles interim tiles', function(done) {
      const layer = map.getLayers().item(0);
      source.once('tileloadend', function(e) {
        expect(e.tile.inTransition()).to.be(false);
        done();
      });
      source.updateParams({TIME: '1'});
      map.renderSync();
      const tiles = map.getRenderer().getLayerRenderer(layer).renderedTiles;
      expect(tiles.length).to.be(1);
      expect(tiles[0]).to.equal(tile);
      expect(tile.inTransition()).to.be(true);
    });
  });

  describe('#renderFrame', function() {
    let map, layer;
    beforeEach(function() {
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
    afterEach(function() {
      disposeMap(map);
    });

    it('increases the cache size if necessary', function(done) {
      const tileCache = layer.getSource().tileCache;
      expect(tileCache.highWaterMark).to.be(1);
      map.once('rendercomplete', function() {
        expect(tileCache.highWaterMark).to.be(2);
        done();
      });
    });
  });

});
