import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import TileLayer from '../../../../../src/ol/layer/Tile.js';
import TileWMS from '../../../../../src/ol/source/TileWMS.js';


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

});
