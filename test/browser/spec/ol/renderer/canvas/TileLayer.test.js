import {spy as sinonSpy} from 'sinon';
import Map from '../../../../../../src/ol/Map.js';
import View from '../../../../../../src/ol/View.js';
import TileLayer from '../../../../../../src/ol/layer/Tile.js';
import {fromLonLat} from '../../../../../../src/ol/proj.js';
import ImageTile from '../../../../../../src/ol/source/ImageTile.js';
import TileDebug from '../../../../../../src/ol/source/TileDebug.js';
import XYZ from '../../../../../../src/ol/source/XYZ.js';

describe('ol/renderer/canvas/TileLayer', function () {
  describe('#renderFrame', function () {
    let map, layer;
    beforeEach(function () {
      layer = new TileLayer({
        source: new XYZ({
          cacheSize: 1,
          url: 'bogus-url/{z}/{x}/{y}.png',
        }),
      });
      map = new Map({
        target: createMapDiv(100, 100),
        layers: [layer],
        view: new View({
          center: fromLonLat([-122.416667, 37.783333]),
          zoom: 5,
        }),
      });
    });
    afterEach(function () {
      disposeMap(map);
    });

    it("respects the source's zDirection setting", function (done) {
      layer.getSource().zDirection = 1;
      map.getView().setZoom(5.8); // would lead to z6 tile request with the default zDirection
      map.once('rendercomplete', function () {
        const tileCache = layer.getRenderer().tileCache_;
        const keys = tileCache.getKeys();
        expect(keys.some((key) => key.startsWith('6/'))).to.be(false);
        done();
      });
    });

    it('image smoothing is re-enabled after rendering', function (done) {
      let context;
      layer.on('postrender', function (e) {
        context = e.context;
        context.imageSmoothingEnabled = false;
      });
      map.on('postrender', function () {
        expect(context.imageSmoothingEnabled).to.be(true);
        done();
      });
    });

    describe('caching', () => {
      it('updates the size of the tile cache ', (done) => {
        const source = new TileDebug();
        const layer = new TileLayer({source: source});
        const spy = sinonSpy(layer.getRenderer(), 'updateCacheSize');
        map.addLayer(layer);
        map.once('rendercomplete', () => {
          // rendercomplete triggers before the postrender functions with the cleanup are run,
          // so wait another cycle
          setTimeout(() => {
            expect(spy.called).to.be(true);
            done();
          }, 0);
        });
      });
      it('expires the tile cache, which disposes unused tiles', async () => {
        const source = new TileDebug();
        const layer = new TileLayer({source: source, cacheSize: 0});
        const tiles = [];
        layer.getSource().on('tileloadend', (event) => {
          tiles.push(event.tile);
        });
        map.addLayer(layer);
        await new Promise((resolve) => map.once('rendercomplete', resolve));
        expect(layer.getRenderer().tileCache_.highWaterMark).to.be(4);
        for (let i = 0; i < 4; ++i) {
          map.getView().setZoom(map.getView().getZoom() + 1);
          await new Promise((resolve) => map.once('rendercomplete', resolve));
        }
        expect(tiles.length).to.be(12);
        for (let i = 0; i < 4; ++i) {
          expect(tiles[i].disposed).to.be(true);
        }
      });

      it('caches tiles and clears the cache when the source is refreshed', async () => {
        const source = new TileDebug();
        const layer = new TileLayer({source: source});
        const tiles = [];
        source.on('tileloadend', (event) => {
          tiles.push(event.tile);
        });
        map.addLayer(layer);
        await new Promise((resolve) => map.once('rendercomplete', resolve));
        expect(tiles.length).to.be(2);
        map.render();
        await new Promise((resolve) => map.once('rendercomplete', resolve));
        expect(tiles.length).to.be(2);
        source.refresh();
        await new Promise((resolve) => map.once('rendercomplete', resolve));
        expect(tiles.length).to.be(4);
      });

      it('clears the cache when the layer has a new source with the same key', async () => {
        const tiles = [];
        let source = new TileDebug();
        source.on('tileloadend', (event) => {
          tiles.push(event.tile);
        });
        source.setKey('foo');
        const layer = new TileLayer({source: source});
        map.addLayer(layer);
        await new Promise((resolve) => map.once('rendercomplete', resolve));
        expect(tiles.length).to.be(2);
        source.dispose();
        source = new TileDebug();
        source.on('tileloadend', (event) => {
          tiles.push(event.tile);
        });
        source.setKey('foo');
        layer.setSource(source);
        await new Promise((resolve) => map.once('rendercomplete', resolve));
        expect(tiles.length).to.be(4);
      });

      it('does not mark alt/stale error tiles as newer', async () => {
        const source = new ImageTile({
          url: '#/{z}/{x}/{y}.png',
        });
        const layer = new TileLayer({source: source, cacheSize: 0});
        const tiles = [];
        layer.getSource().on('tileloadend', (event) => {
          tiles.push(event.tile);
        });
        map.addLayer(layer);
        await new Promise((resolve) => map.once('rendercomplete', resolve));
        expect(layer.getRenderer().tileCache_.highWaterMark).to.be(4);
        for (let i = 0; i < 4; ++i) {
          map.getView().setZoom(map.getView().getZoom() + 1);
          await new Promise((resolve) => map.once('rendercomplete', resolve));
        }
        expect(
          layer.getRenderer().tileCache_.newest_.value_.tileCoord[0],
        ).to.be(9);
      });

      it('caches source tiles when reprojecting', async () => {
        const source = new TileDebug();
        const layer = new TileLayer({
          source: source,
        });
        map.addLayer(layer);
        map.setView(
          new View({
            projection: 'EPSG:4326',
            center: [-122.416667, 37.783333],
            zoom: 5,
          }),
        );
        await new Promise((resolve) => map.once('rendercomplete', resolve));
        expect(
          layer.getRenderer().sourceTileCache_.getKeys().length,
        ).to.be.greaterThan(0);
      });

      it('does not cache source tiles when not reprojecting', async () => {
        const source = new TileDebug();
        const layer = new TileLayer({
          source: source,
        });
        map.addLayer(layer);
        await new Promise((resolve) => map.once('rendercomplete', resolve));
        expect(layer.getRenderer().sourceTileCache_).to.be(null);
      });
    });
  });
});
