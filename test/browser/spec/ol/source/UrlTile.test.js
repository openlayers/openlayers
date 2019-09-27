import {assert} from 'chai';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import UrlTile from '../../../../../src/ol/source/UrlTile.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';

describe('ol/source/UrlTile', function () {
  describe('#setUrl()', function () {
    it('sets the URL for the source', function () {
      const source = new UrlTile({});

      const url = 'https://example.com/';
      source.setUrl(url);

      assert.deepEqual(source.getUrls(), [url]);
    });

    it('updates the key for the source', function () {
      const source = new UrlTile({});

      const url = 'https://example.com/';
      source.setUrl(url);

      assert.deepEqual(source.getKey(), url);
    });
  });

  describe('#getInterpolate()', function () {
    it('is false by default', function () {
      const source = new UrlTile({});
      assert.strictEqual(source.getInterpolate(), false);
    });

    it('is true if constructed with interpolate: true', function () {
      const source = new UrlTile({interpolate: true});
      assert.strictEqual(source.getInterpolate(), true);
    });
  });

  describe('#setUrls()', function () {
    it('sets the URL for the source', function () {
      const source = new UrlTile({});

      const urls = [
        'https://a.example.com/',
        'https://b.example.com/',
        'https://c.example.com/',
      ];
      source.setUrls(urls);

      assert.deepEqual(source.getUrls(), urls);
    });

    it('updates the key for the source', function () {
      const source = new UrlTile({});

      const urls = [
        'https://a.example.com/',
        'https://b.example.com/',
        'https://c.example.com/',
      ];
      source.setUrls(urls);

      assert.deepEqual(source.getKey(), urls.join('\n'));
    });
  });

  describe('url option', function () {
    it('expands url template', function () {
      const tileSource = new UrlTile({
        url: '{1-3}',
      });

      const urls = tileSource.getUrls();
      assert.deepEqual(urls, ['1', '2', '3']);
    });
  });

  describe('tileUrlFunction', function () {
    let tileSource, tileGrid;

    beforeEach(function () {
      tileSource = new UrlTile({
        projection: 'EPSG:3857',
        tileGrid: createXYZ({maxZoom: 6}),
        url: '{z}/{x}/{y}',
        wrapX: true,
      });
      tileGrid = tileSource.getTileGrid();
    });

    it('returns the expected URL', function () {
      const coordinate = [829330.2064098881, 5933916.615134273];
      let tileUrl;

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 0),
      );
      assert.deepEqual(tileUrl, '0/0/0');

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 1),
      );
      assert.deepEqual(tileUrl, '1/1/0');

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 2),
      );
      assert.deepEqual(tileUrl, '2/2/1');

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 3),
      );
      assert.deepEqual(tileUrl, '3/4/2');

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 4),
      );
      assert.deepEqual(tileUrl, '4/8/5');

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 5),
      );
      assert.deepEqual(tileUrl, '5/16/11');

      tileUrl = tileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 6),
      );
      assert.deepEqual(tileUrl, '6/33/22');
    });

    describe('wrap x', function () {
      it('returns the expected URL', function () {
        const projection = tileSource.getProjection();
        let tileUrl = tileSource.tileUrlFunction(
          tileSource.getTileCoordForTileUrlFunction([6, -31, 22], projection),
        );
        assert.deepEqual(tileUrl, '6/33/22');

        tileUrl = tileSource.tileUrlFunction(
          tileSource.getTileCoordForTileUrlFunction([6, 33, 22], projection),
        );
        assert.deepEqual(tileUrl, '6/33/22');

        tileUrl = tileSource.tileUrlFunction(
          tileSource.getTileCoordForTileUrlFunction([6, 97, 22], projection),
        );
        assert.deepEqual(tileUrl, '6/33/22');
      });
    });

    describe('crop y', function () {
      it('returns the expected URL', function () {
        const projection = tileSource.getProjection();
        let tileUrl = tileSource.tileUrlFunction(
          tileSource.getTileCoordForTileUrlFunction([6, 33, -1], projection),
        );
        assert.strictEqual(tileUrl, undefined);

        tileUrl = tileSource.tileUrlFunction(
          tileSource.getTileCoordForTileUrlFunction([6, 33, 22], projection),
        );
        assert.deepEqual(tileUrl, '6/33/22');

        tileUrl = tileSource.tileUrlFunction(
          tileSource.getTileCoordForTileUrlFunction([6, 33, 64], projection),
        );
        assert.strictEqual(tileUrl, undefined);
      });
    });
  });

  describe('#getUrls', function () {
    let sourceOptions;
    let source;
    const url = 'http://geo.nls.uk/maps/towns/glasgow1857/{z}/{x}/{-y}.png';

    beforeEach(function () {
      sourceOptions = {
        tileGrid: createXYZ({
          extent: getProjection('EPSG:4326').getExtent(),
        }),
      };
    });

    describe('using a "url" option', function () {
      beforeEach(function () {
        sourceOptions.url = url;
        source = new UrlTile(sourceOptions);
      });

      it('returns the XYZ URL', function () {
        const urls = source.getUrls();
        assert.deepEqual(urls, [url]);
      });
    });

    describe('using a "urls" option', function () {
      beforeEach(function () {
        sourceOptions.urls = ['some_xyz_url1', 'some_xyz_url2'];
        source = new UrlTile(sourceOptions);
      });

      it('returns the XYZ URLs', function () {
        const urls = source.getUrls();
        assert.deepEqual(urls, ['some_xyz_url1', 'some_xyz_url2']);
      });
    });

    describe('using a "tileUrlFunction"', function () {
      beforeEach(function () {
        sourceOptions.tileUrlFunction = function () {
          return 'some_xyz_url';
        };
        source = new UrlTile(sourceOptions);
      });

      it('returns null', function () {
        const urls = source.getUrls();
        assert.strictEqual(urls, null);
      });
    });
  });
});
