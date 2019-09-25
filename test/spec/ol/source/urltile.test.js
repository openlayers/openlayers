import {get as getProjection} from '../../../../src/ol/proj.js';
import UrlTile from '../../../../src/ol/source/UrlTile.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';


describe('ol.source.UrlTile', () => {

  describe('#setUrl()', () => {
    test('sets the URL for the source', () => {
      const source = new UrlTile({});

      const url = 'https://example.com/';
      source.setUrl(url);

      expect(source.getUrls()).toEqual([url]);
    });

    test('updates the key for the source', () => {
      const source = new UrlTile({});

      const url = 'https://example.com/';
      source.setUrl(url);

      expect(source.getKey()).toEqual(url);
    });
  });

  describe('#setUrls()', () => {
    test('sets the URL for the source', () => {
      const source = new UrlTile({});

      const urls = [
        'https://a.example.com/',
        'https://b.example.com/',
        'https://c.example.com/'
      ];
      source.setUrls(urls);

      expect(source.getUrls()).toEqual(urls);
    });

    test('updates the key for the source', () => {
      const source = new UrlTile({});

      const urls = [
        'https://a.example.com/',
        'https://b.example.com/',
        'https://c.example.com/'
      ];
      source.setUrls(urls);

      expect(source.getKey()).toEqual(urls.join('\n'));
    });
  });

  describe('url option', () => {
    test('expands url template', () => {
      const tileSource = new UrlTile({
        url: '{1-3}'
      });

      const urls = tileSource.getUrls();
      expect(urls).toEqual(['1', '2', '3']);
    });
  });

  describe('tileUrlFunction', () => {

    let tileSource, tileGrid;

    beforeEach(() => {
      tileSource = new UrlTile({
        projection: 'EPSG:3857',
        tileGrid: createXYZ({maxZoom: 6}),
        url: '{z}/{x}/{y}',
        wrapX: true
      });
      tileGrid = tileSource.getTileGrid();
    });

    test('returns the expected URL', () => {

      const coordinate = [829330.2064098881, 5933916.615134273];
      let tileUrl;

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 0));
      expect(tileUrl).toEqual('0/0/0');

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 1));
      expect(tileUrl).toEqual('1/1/0');

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 2));
      expect(tileUrl).toEqual('2/2/1');

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 3));
      expect(tileUrl).toEqual('3/4/2');

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 4));
      expect(tileUrl).toEqual('4/8/5');

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 5));
      expect(tileUrl).toEqual('5/16/11');

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 6));
      expect(tileUrl).toEqual('6/33/22');

    });

    describe('wrap x', () => {

      test('returns the expected URL', () => {
        const projection = tileSource.getProjection();
        let tileUrl = tileSource.tileUrlFunction(
          tileSource.getTileCoordForTileUrlFunction([6, -31, 22], projection));
        expect(tileUrl).toEqual('6/33/22');

        tileUrl = tileSource.tileUrlFunction(
          tileSource.getTileCoordForTileUrlFunction([6, 33, 22], projection));
        expect(tileUrl).toEqual('6/33/22');

        tileUrl = tileSource.tileUrlFunction(
          tileSource.getTileCoordForTileUrlFunction([6, 97, 22], projection));
        expect(tileUrl).toEqual('6/33/22');
      });

    });

    describe('crop y', () => {

      test('returns the expected URL', () => {
        const projection = tileSource.getProjection();
        let tileUrl = tileSource.tileUrlFunction(
          tileSource.getTileCoordForTileUrlFunction([6, 33, -1], projection));
        expect(tileUrl).toBe(undefined);

        tileUrl = tileSource.tileUrlFunction(
          tileSource.getTileCoordForTileUrlFunction([6, 33, 22], projection));
        expect(tileUrl).toEqual('6/33/22');

        tileUrl = tileSource.tileUrlFunction(
          tileSource.getTileCoordForTileUrlFunction([6, 33, 64], projection));
        expect(tileUrl).toBe(undefined);
      });

    });

  });

  describe('#getUrls', () => {

    let sourceOptions;
    let source;
    const url = 'http://geo.nls.uk/maps/towns/glasgow1857/{z}/{x}/{-y}.png';

    beforeEach(() => {
      sourceOptions = {
        tileGrid: createXYZ({
          extent: getProjection('EPSG:4326').getExtent()
        })
      };
    });

    describe('using a "url" option', () => {
      beforeEach(() => {
        sourceOptions.url = url;
        source = new UrlTile(sourceOptions);
      });

      test('returns the XYZ URL', () => {
        const urls = source.getUrls();
        expect(urls).toEqual([url]);
      });

    });

    describe('using a "urls" option', () => {
      beforeEach(() => {
        sourceOptions.urls = ['some_xyz_url1', 'some_xyz_url2'];
        source = new UrlTile(sourceOptions);
      });

      test('returns the XYZ URLs', () => {
        const urls = source.getUrls();
        expect(urls).toEqual(['some_xyz_url1', 'some_xyz_url2']);
      });

    });

    describe('using a "tileUrlFunction"', () => {
      beforeEach(() => {
        sourceOptions.tileUrlFunction = function() {
          return 'some_xyz_url';
        };
        source = new UrlTile(sourceOptions);
      });

      test('returns null', () => {
        const urls = source.getUrls();
        expect(urls).toBe(null);
      });

    });

  });

});
