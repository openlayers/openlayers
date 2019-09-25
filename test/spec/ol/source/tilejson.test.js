import Source from '../../../../src/ol/source/Source.js';
import TileJSON from '../../../../src/ol/source/TileJSON.js';
import {unByKey} from '../../../../src/ol/Observable.js';


describe('ol.source.TileJSON', () => {

  describe('constructor', () => {

    test('returns a tileJSON source', () => {
      const source = new TileJSON({
        url: 'spec/ol/data/tilejson.json'
      });
      expect(source).toBeInstanceOf(Source);
      expect(source).toBeInstanceOf(TileJSON);
    });
  });

  describe('#getTileJSON', () => {

    test('parses the tilejson file', () => {
      const source = new TileJSON({
        url: 'spec/ol/data/tilejson.json'
      });
      source.on('change', function() {
        if (source.getState() === 'ready') {
          const tileJSON = source.getTileJSON();
          expect(tileJSON.name).toEqual('Geography Class');
          expect(tileJSON.version).toEqual('1.0.0');
        }
      });
    });

    test('parses inline TileJSON', () => {
      const tileJSON = {
        bounds: [
          -180,
          -85.05112877980659,
          180,
          85.05112877980659
        ],
        center: [
          0,
          0,
          4
        ],
        created: 1322764050886,
        description: 'One of the example maps that comes with TileMill - a bright & colorful world map that blends retro and high-tech with its folded paper texture and interactive flag tooltips. ',
        download: 'https://a.tiles.mapbox.com/v3/mapbox.geography-class.mbtiles',
        embed: 'https://a.tiles.mapbox.com/v3/mapbox.geography-class.html',
        id: 'mapbox.geography-class',
        mapbox_logo: true,
        maxzoom: 8,
        minzoom: 0,
        name: 'Geography Class',
        private: false,
        scheme: 'xyz',
        tilejson: '2.2.0',
        tiles: [
          'https://a.tiles.mapbox.com/v3/mapbox.geography-class/{z}/{x}/{y}.png',
          'https://b.tiles.mapbox.com/v3/mapbox.geography-class/{z}/{x}/{y}.png',
          'https://c.tiles.mapbox.com/v3/mapbox.geography-class/{z}/{x}/{y}.png',
          'https://d.tiles.mapbox.com/v3/mapbox.geography-class/{z}/{x}/{y}.png'
        ],
        version: '1.0.0',
        webpage: 'https://a.tiles.mapbox.com/v3/mapbox.geography-class/page.html'
      };
      const source = new TileJSON({
        tileJSON: tileJSON
      });
      expect(source.getState()).toBe('ready');
      expect(source.getTileUrlFunction()([0, 0, 0])).toBe('https://a.tiles.mapbox.com/v3/mapbox.geography-class/0/0/0.png');
      expect(source.getTileUrlFunction()([1, 0, 0])).toBe('https://a.tiles.mapbox.com/v3/mapbox.geography-class/1/0/0.png');
      expect(source.getTileUrlFunction()([1, 0, 1])).toBe('https://b.tiles.mapbox.com/v3/mapbox.geography-class/1/0/1.png');
      expect(source.getTileUrlFunction()([1, 1, 0])).toBe('https://c.tiles.mapbox.com/v3/mapbox.geography-class/1/1/0.png');
      expect(source.getTileUrlFunction()([1, 1, 1])).toBe('https://d.tiles.mapbox.com/v3/mapbox.geography-class/1/1/1.png');
    });
  });

  describe('#getState', () => {

    test('returns error on HTTP 404', () => {
      const source = new TileJSON({
        url: 'invalid.jsonp'
      });
      source.on('change', function() {
        expect(source.getState()).toEqual('error');
        expect(source.getTileJSON()).toEqual(null);
      });
    });

    test('returns error on CORS issues', () => {
      const source = new TileJSON({
        url: 'http://example.com'
      });
      source.on('change', function() {
        expect(source.getState()).toEqual('error');
        expect(source.getTileJSON()).toEqual(null);
      });
    });

    test('returns error on JSON parsing issues', () => {
      const source = new TileJSON({
        url: '/'
      });
      source.on('change', function() {
        expect(source.getState()).toEqual('error');
        expect(source.getTileJSON()).toEqual(null);
      });
    });

  });

  describe('tileUrlFunction', () => {

    let source, tileGrid;

    beforeEach(done => {
      source = new TileJSON({
        url: 'spec/ol/data/tilejson.json'
      });
      const key = source.on('change', function() {
        if (source.getState() === 'ready') {
          unByKey(key);
          tileGrid = source.getTileGrid();
          done();
        }
      });
    });

    test('uses the correct tile coordinates', () => {

      const coordinate = [829330.2064098881, 5933916.615134273];
      const regex = /\/([0-9]*\/[0-9]*\/[0-9]*)\.png$/;
      let tileUrl;

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 0));
      expect(tileUrl.match(regex)[1]).toEqual('0/0/0');

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 1));
      expect(tileUrl.match(regex)[1]).toEqual('1/1/0');

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 2));
      expect(tileUrl.match(regex)[1]).toEqual('2/2/1');

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 3));
      expect(tileUrl.match(regex)[1]).toEqual('3/4/2');

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 4));
      expect(tileUrl.match(regex)[1]).toEqual('4/8/5');

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 5));
      expect(tileUrl.match(regex)[1]).toEqual('5/16/11');

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 6));
      expect(tileUrl.match(regex)[1]).toEqual('6/33/22');

    });

  });

});
