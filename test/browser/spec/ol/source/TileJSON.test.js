import Source from '../../../../../src/ol/source/Source.js';
import TileJSON from '../../../../../src/ol/source/TileJSON.js';
import {transformExtent} from '../../../../../src/ol/proj.js';
import {unByKey} from '../../../../../src/ol/Observable.js';

describe('ol/source/TileJSON', function () {
  describe('constructor', function () {
    it('returns a tileJSON source', function () {
      const source = new TileJSON({
        url: 'spec/ol/data/tilejson.json',
      });
      expect(source).to.be.a(Source);
      expect(source).to.be.a(TileJSON);
    });
  });

  describe('#getInterpolate()', function () {
    it('is true by default', function () {
      const source = new TileJSON({url: 'spec/ol/data/tilejson.json'});
      expect(source.getInterpolate()).to.be(true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new TileJSON({
        interpolate: false,
        url: 'spec/ol/data/tilejson.json',
      });
      expect(source.getInterpolate()).to.be(false);
    });
  });

  describe('#getTileJSON', function () {
    it('parses the tilejson file', function () {
      const source = new TileJSON({
        url: 'spec/ol/data/tilejson.json',
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          const tileJSON = source.getTileJSON();
          expect(tileJSON.name).to.eql('Geography Class');
          expect(tileJSON.version).to.eql('1.0.0');
        }
      });
    });

    const tileJSON = {
      attribution: 'TileMill',
      bounds: [-180, -85.05112877980659, 180, 85.05112877980659],
      center: [0, 0, 4],
      created: 1322764050886,
      description:
        'One of the example maps that comes with TileMill - a bright & colorful world map that blends retro and high-tech with its folded paper texture and interactive flag tooltips. ',
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
        'https://d.tiles.mapbox.com/v3/mapbox.geography-class/{z}/{x}/{y}.png',
      ],
      version: '1.0.0',
      webpage: 'https://a.tiles.mapbox.com/v3/mapbox.geography-class/page.html',
    };

    it('parses inline TileJSON', function () {
      const source = new TileJSON({
        tileJSON: tileJSON,
      });
      expect(source.getState()).to.be('ready');
      expect(source.getTileUrlFunction()([0, 0, 0])).to.be(
        'https://a.tiles.mapbox.com/v3/mapbox.geography-class/0/0/0.png'
      );
      expect(source.getTileUrlFunction()([1, 0, 0])).to.be(
        'https://a.tiles.mapbox.com/v3/mapbox.geography-class/1/0/0.png'
      );
      expect(source.getTileUrlFunction()([1, 0, 1])).to.be(
        'https://b.tiles.mapbox.com/v3/mapbox.geography-class/1/0/1.png'
      );
      expect(source.getTileUrlFunction()([1, 1, 0])).to.be(
        'https://c.tiles.mapbox.com/v3/mapbox.geography-class/1/1/0.png'
      );
      expect(source.getTileUrlFunction()([1, 1, 1])).to.be(
        'https://d.tiles.mapbox.com/v3/mapbox.geography-class/1/1/1.png'
      );
    });

    it('returns attributions, but not when outside bounds', function () {
      tileJSON.bounds = [
        -10.764179999935878, 49.528423000201656, 1.9134115551745678,
        61.3311509999582,
      ];
      const source = new TileJSON({
        tileJSON: tileJSON,
      });
      expect(source.getState()).to.be('ready');
      const attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      const frameState = {};
      frameState.extent = transformExtent(
        [1, 51, 2, 52],
        'EPSG:4326',
        'EPSG:3857'
      );
      expect(attributions(frameState)).to.eql(['TileMill']);
      frameState.extent = transformExtent(
        [2, 51, 3, 52],
        'EPSG:4326',
        'EPSG:3857'
      );
      expect(attributions(frameState)).to.be(null);
    });

    it('attributions bounds default to the tilegrid extent', function () {
      delete tileJSON.bounds;
      const source = new TileJSON({
        tileJSON: tileJSON,
      });
      expect(source.getState()).to.be('ready');
      const attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      const frameState = {};
      frameState.extent = transformExtent(
        [1, 51, 2, 52],
        'EPSG:4326',
        'EPSG:3857'
      );
      expect(attributions(frameState)).to.eql(['TileMill']);
      frameState.extent = transformExtent(
        [2, 51, 3, 52],
        'EPSG:4326',
        'EPSG:3857'
      );
      expect(attributions(frameState)).to.eql(['TileMill']);
    });
  });

  describe('#getState', function () {
    it('returns error on HTTP 404', function () {
      const source = new TileJSON({
        url: 'invalid.jsonp',
      });
      source.on('change', function () {
        expect(source.getState()).to.eql('error');
        expect(source.getTileJSON()).to.eql(null);
      });
    });

    it('returns error on CORS issues', function () {
      const source = new TileJSON({
        url: 'http://example.com',
      });
      source.on('change', function () {
        expect(source.getState()).to.eql('error');
        expect(source.getTileJSON()).to.eql(null);
      });
    });

    it('returns error on JSON parsing issues', function () {
      const source = new TileJSON({
        url: '/',
      });
      source.on('change', function () {
        expect(source.getState()).to.eql('error');
        expect(source.getTileJSON()).to.eql(null);
      });
    });
  });

  describe('tileUrlFunction', function () {
    let source, tileGrid;

    beforeEach(function (done) {
      source = new TileJSON({
        url: 'spec/ol/data/tilejson.json',
      });
      const key = source.on('change', function () {
        if (source.getState() === 'ready') {
          unByKey(key);
          tileGrid = source.getTileGrid();
          done();
        }
      });
    });

    it('uses the correct tile coordinates', function () {
      const coordinate = [829330.2064098881, 5933916.615134273];
      const regex = /\/([0-9]*\/[0-9]*\/[0-9]*)\.png$/;
      let tileUrl;

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 0)
      );
      expect(tileUrl.match(regex)[1]).to.eql('0/0/0');

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 1)
      );
      expect(tileUrl.match(regex)[1]).to.eql('1/1/0');

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 2)
      );
      expect(tileUrl.match(regex)[1]).to.eql('2/2/1');

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 3)
      );
      expect(tileUrl.match(regex)[1]).to.eql('3/4/2');

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 4)
      );
      expect(tileUrl.match(regex)[1]).to.eql('4/8/5');

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 5)
      );
      expect(tileUrl.match(regex)[1]).to.eql('5/16/11');

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 6)
      );
      expect(tileUrl.match(regex)[1]).to.eql('6/33/22');
    });
  });
});
