import {assert} from 'chai';
import events from 'events';
import fse from 'fs-extra';
import path from 'path';
import {fileURLToPath} from 'url';
import {setLevel as setLogLevel} from '../../../../src/ol/console.js';
import {overrideXHR, restoreXHR} from '../../../../src/ol/net.js';
import {get as getProjection} from '../../../../src/ol/proj.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import {
  appendCollectionsQueryParam,
  getMapTileUrlTemplate,
  getTileSetInfo,
  getVectorTileUrlTemplate,
  parseTileMatrixSet,
} from '../../../../src/ol/source/ogcTileUtil.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';

function getDataDir() {
  const modulePath = fileURLToPath(import.meta.url);
  return path.join(path.dirname(modulePath), 'data');
}

let baseUrl;

class MockXHR extends events.EventEmitter {
  addEventListener(type, listener) {
    this.addListener(type, listener);
  }

  open(method, url) {
    if (url.startsWith(baseUrl)) {
      url = url.slice(baseUrl.length);
    }
    this.url = url;
  }

  setRequestHeader(key, value) {
    // no-op
  }

  send() {
    let url = path.resolve(getDataDir(), this.url);
    if (!url.endsWith('.json')) {
      url = url + '.json';
    }
    fse.readJSON(url).then(
      (data) => {
        this.status = 200;
        this.responseText = JSON.stringify(data);
        this.emit('load', {target: this});
      },
      (err) => {
        console.error(err); // eslint-disable-line no-console
        this.emit('error', {target: this});
      },
    );
  }
}

describe('ol/source/ogcTileUtil.js', () => {
  describe('getTileSetInfo()', () => {
    beforeEach(() => {
      overrideXHR(MockXHR);
    });

    afterEach(() => {
      baseUrl = '';
      restoreXHR();
    });

    it('fetches and parses map tile info', async () => {
      baseUrl = 'https://maps.ecere.com/';
      const sourceInfo = {
        url: 'https://maps.ecere.com/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad',
      };
      const tileInfo = await getTileSetInfo(sourceInfo);
      assert.instanceOf(tileInfo, Object);
      assert.strictEqual(
        tileInfo.urlTemplate,
        '/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}.jpg',
      );
      assert.instanceOf(tileInfo.projection, Projection);
      assert.strictEqual(
        tileInfo.projection.getCode(),
        'http://www.opengis.net/def/crs/EPSG/0/3857',
      );
      assert.instanceOf(tileInfo.grid, TileGrid);
      assert.deepEqual(tileInfo.grid.getTileSize(0), [256, 256]);
      assert.lengthOf(tileInfo.grid.getResolutions(), 10);
      assert.instanceOf(tileInfo.urlFunction, Function);
      assert.strictEqual(
        tileInfo.urlFunction([3, 2, 1]),
        'https://maps.ecere.com/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad/3/1/2.jpg',
      );
      assert.strictEqual(tileInfo.urlFunction([3, -1, 0]), undefined);
      assert.strictEqual(tileInfo.urlFunction([3, 8, 0]), undefined);
      assert.strictEqual(tileInfo.urlFunction([3, 0, -1]), undefined);
      assert.strictEqual(tileInfo.urlFunction([3, 0, 8]), undefined);
    });

    it('allows preferred media type to be configured', async () => {
      baseUrl = 'https://maps.ecere.com/';
      const sourceInfo = {
        url: 'https://maps.ecere.com/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad',
        mediaType: 'image/png',
      };
      const tileInfo = await getTileSetInfo(sourceInfo);
      assert.instanceOf(tileInfo, Object);
      assert.strictEqual(
        tileInfo.urlTemplate,
        '/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}.png',
      );
      assert.instanceOf(tileInfo.urlFunction, Function);
      assert.strictEqual(
        tileInfo.urlFunction([3, 2, 1]),
        'https://maps.ecere.com/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad/3/1/2.png',
      );
    });

    it('fetches and parses vector tile info', async () => {
      baseUrl = 'https://maps.ecere.com/';
      const sourceInfo = {
        url: 'https://maps.ecere.com/ogcapi/collections/ne_10m_admin_0_countries/tiles/WebMercatorQuad',
      };
      const tileInfo = await getTileSetInfo(sourceInfo);
      assert.instanceOf(tileInfo, Object);
      assert.strictEqual(
        tileInfo.urlTemplate,
        '/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}.json',
      );
      assert.instanceOf(tileInfo.grid, TileGrid);
      assert.deepEqual(tileInfo.grid.getTileSize(0), [256, 256]);
      assert.lengthOf(tileInfo.grid.getResolutions(), 8);
      assert.instanceOf(tileInfo.urlFunction, Function);
      assert.strictEqual(
        tileInfo.urlFunction([3, 2, 1]),
        'https://maps.ecere.com/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WebMercatorQuad/3/1/2.json',
      );
      assert.strictEqual(tileInfo.urlFunction([2, -1, 0]), undefined);
      assert.strictEqual(tileInfo.urlFunction([2, 4, 0]), undefined);
      assert.strictEqual(tileInfo.urlFunction([2, 0, -1]), undefined);
      assert.strictEqual(tileInfo.urlFunction([2, 0, 4]), undefined);
    });

    it('orderedAxes overrides the projection axis orientation', async () => {
      baseUrl = 'https://maps.ecere.com/';
      const sourceInfo = {
        url: 'https://maps.ecere.com/ogcapi/collections/ne_10m_admin_0_countries/tiles/WorldCRS84Quad',
      };
      const tileInfo = await getTileSetInfo(sourceInfo);
      assert.instanceOf(tileInfo, Object);
      assert.instanceOf(tileInfo.projection, Projection);
      assert.strictEqual(
        tileInfo.projection.getCode(),
        'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
      );
      assert.strictEqual(
        tileInfo.urlTemplate,
        '/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WorldCRS84Quad/{tileMatrix}/{tileRow}/{tileCol}.json',
      );
      assert.instanceOf(tileInfo.grid, TileGrid);
      assert.deepEqual(tileInfo.grid.getExtent(), [-180, -90, 180, 90]);
      assert.deepEqual(tileInfo.grid.getTileSize(0), [256, 256]);
      assert.lengthOf(tileInfo.grid.getResolutions(), 7);
      assert.instanceOf(tileInfo.urlFunction, Function);
      assert.strictEqual(
        tileInfo.urlFunction([3, 2, 1]),
        'https://maps.ecere.com/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WorldCRS84Quad/3/1/2.json',
      );
      assert.strictEqual(tileInfo.urlFunction([2, -1, 0]), undefined);
      assert.notEqual(tileInfo.urlFunction([2, 4, 0]), undefined);
      assert.strictEqual(tileInfo.urlFunction([2, 8, 0]), undefined);
      assert.strictEqual(tileInfo.urlFunction([2, 0, -1]), undefined);
      assert.strictEqual(tileInfo.urlFunction([2, 0, 4]), undefined);
    });

    it('allows projection to be overridden', async () => {
      baseUrl = 'https://maps.ecere.com/';
      const sourceInfo = {
        url: 'https://maps.ecere.com/ogcapi/collections/ne_10m_admin_0_countries/tiles/WorldCRS84Quad',
        projection: getProjection('EPSG:4326'),
      };
      const tileInfo = await getTileSetInfo(sourceInfo);
      assert.instanceOf(tileInfo, Object);
      assert.instanceOf(tileInfo.projection, Projection);
      assert.strictEqual(tileInfo.projection.getCode(), 'EPSG:4326');
    });

    it('allows preferred media type to be configured', async () => {
      baseUrl = 'https://maps.ecere.com/';
      const sourceInfo = {
        url: 'https://maps.ecere.com/ogcapi/collections/ne_10m_admin_0_countries/tiles/WebMercatorQuad',
        mediaType: 'application/vnd.mapbox-vector-tile',
      };
      const tileInfo = await getTileSetInfo(sourceInfo);
      assert.instanceOf(tileInfo, Object);
      assert.strictEqual(
        tileInfo.urlTemplate,
        '/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}.mvt',
      );
      assert.instanceOf(tileInfo.urlFunction, Function);
      assert.strictEqual(
        tileInfo.urlFunction([3, 2, 1]),
        'https://maps.ecere.com/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WebMercatorQuad/3/1/2.mvt',
      );
    });

    it('uses supported media types if available', async () => {
      baseUrl = 'https://maps.ecere.com/';
      const sourceInfo = {
        url: 'https://maps.ecere.com/ogcapi/collections/ne_10m_admin_0_countries/tiles/WebMercatorQuad',
        supportedMediaTypes: [
          'bogus-media-type',
          'application/vnd.mapbox-vector-tile',
          'application/geo+json', // should not be used
        ],
      };
      const tileInfo = await getTileSetInfo(sourceInfo);
      assert.instanceOf(tileInfo, Object);
      assert.strictEqual(
        tileInfo.urlTemplate,
        '/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}.mvt',
      );
      assert.instanceOf(tileInfo.urlFunction, Function);
      assert.strictEqual(
        tileInfo.urlFunction([3, 2, 1]),
        'https://maps.ecere.com/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WebMercatorQuad/3/1/2.mvt',
      );
    });

    it('treats supported media types in descending order of priority', async () => {
      baseUrl = 'https://maps.ecere.com/';
      const sourceInfo = {
        url: 'https://maps.ecere.com/ogcapi/collections/ne_10m_admin_0_countries/tiles/WebMercatorQuad',
        supportedMediaTypes: [
          'bogus-media-type',
          'application/geo+json', // should be preferred
          'application/vnd.mapbox-vector-tile',
        ],
      };
      const tileInfo = await getTileSetInfo(sourceInfo);
      assert.instanceOf(tileInfo, Object);
      assert.strictEqual(
        tileInfo.urlTemplate,
        '/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}.json',
      );
      assert.instanceOf(tileInfo.urlFunction, Function);
      assert.strictEqual(
        tileInfo.urlFunction([3, 2, 1]),
        'https://maps.ecere.com/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WebMercatorQuad/3/1/2.json',
      );
    });

    it('works with a tile matrix set that uses a crs object with uri string', async () => {
      baseUrl = 'https://maps.ecere.com/';
      const sourceInfo = {
        url: 'https://maps.ecere.com/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuadObjectCRS',
      };
      const tileInfo = await getTileSetInfo(sourceInfo);
      assert.instanceOf(tileInfo, Object);
      assert.instanceOf(tileInfo.projection, Projection);
      assert.strictEqual(
        tileInfo.projection.getCode(),
        'http://www.opengis.net/def/crs/EPSG/0/3857',
      );
    });

    it('fails with a tile matrix set that uses a crs object with a wkt object', async () => {
      baseUrl = 'https://maps.ecere.com/';
      const sourceInfo = {
        url: 'https://maps.ecere.com/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuadObjectWKT',
      };

      let error;
      try {
        await getTileSetInfo(sourceInfo);
      } catch (err) {
        error = err;
      }
      assert.instanceOf(error, Error);
      assert.strictEqual(
        error.message,
        'Unsupported CRS: {"wkt":{"supported":false}}',
      );
    });
  });

  describe('getVectorTileUrlTemplate()', () => {
    let collectionLinks;
    let links;
    before(async () => {
      const collectionUrl = path.join(
        getDataDir(),
        'ogcapi/collections/ne_10m_admin_0_countries/tiles/WebMercatorQuad.json',
      );
      const collectionTileSet = await fse.readJSON(collectionUrl);
      collectionLinks = collectionTileSet.links;
      const url = path.join(getDataDir(), 'ogcapi/tiles/WebMercatorQuad.json');
      const tileSet = await fse.readJSON(url);
      links = tileSet.links;
    });

    it('gets the last known vector type if the preferred media type is absent', () => {
      const urlTemplate = getVectorTileUrlTemplate(collectionLinks);
      assert.strictEqual(
        urlTemplate,
        '/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}.json',
      );
    });

    it('gets the preferred media type if given', () => {
      const urlTemplate = getVectorTileUrlTemplate(
        collectionLinks,
        'application/vnd.mapbox-vector-tile',
      );
      assert.strictEqual(
        urlTemplate,
        '/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}.mvt',
      );
    });

    it('uses supported media types is preferred media type is not given', () => {
      const urlTemplate = getVectorTileUrlTemplate(collectionLinks, undefined, [
        'application/vnd.mapbox-vector-tile',
      ]);
      assert.strictEqual(
        urlTemplate,
        '/ogcapi/collections/NaturalEarth:cultural:ne_10m_admin_0_countries/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}.mvt',
      );
    });

    it('throws if it cannot find preferred media type or a known fallback', () => {
      function call() {
        getVectorTileUrlTemplate([], 'application/vnd.mapbox-vector-tile');
      }
      assert.throws(call, 'Could not find "item" link');
    });

    it('appends the collections query parameter if given', () => {
      const urlTemplate = getVectorTileUrlTemplate(
        links,
        'application/vnd.mapbox-vector-tile',
        undefined,
        ['AeronauticCrv', 'CulturePnt'],
      );
      assert.strictEqual(
        urlTemplate,
        '/ogcapi/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}?f=mvt&collections=AeronauticCrv,CulturePnt',
      );
    });
  });

  describe('getMapTileUrlTemplate()', () => {
    let links;
    before(async () => {
      const url = path.join(
        getDataDir(),
        'ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad.json',
      );
      const tileSet = await fse.readJSON(url);
      links = tileSet.links;
    });

    it('gets the last known image type if the preferred media type is absent', () => {
      const urlTemplate = getMapTileUrlTemplate(links);
      assert.strictEqual(
        urlTemplate,
        '/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}.jpg',
      );
    });

    it('gets the preferred media type if given', () => {
      const urlTemplate = getMapTileUrlTemplate(links, 'image/png');
      assert.strictEqual(
        urlTemplate,
        '/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}.png',
      );
    });

    it('throws if it cannot find preferred media type or a known fallback', () => {
      function call() {
        getMapTileUrlTemplate([], 'image/png');
      }
      assert.throws(call, 'Could not find "item" link');
    });
  });

  describe('appendCollectionsQueryParam()', () => {
    beforeEach(() => {
      setLogLevel('none');
    });

    afterEach(() => {
      setLogLevel('info');
    });

    const collectionUrl =
      '/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad.json';
    const url = '/ogcapi/tiles/WebMercatorQuad.json';
    it('appends the collections parameter to the url', () => {
      const collections = ['foo', 'bar'];
      const appendedUrl = appendCollectionsQueryParam(url, collections);
      assert.strictEqual(
        appendedUrl,
        '/ogcapi/tiles/WebMercatorQuad.json?collections=foo,bar',
      );
    });

    it('returns the original url, if collections is empty', () => {
      const collections = [];
      const appendedUrl = appendCollectionsQueryParam(url, collections);
      assert.strictEqual(appendedUrl, '/ogcapi/tiles/WebMercatorQuad.json');
    });

    it('returns the original url, if it points to a collection tileset', () => {
      const collections = ['foo'];
      const appendedUrl = appendCollectionsQueryParam(
        collectionUrl,
        collections,
      );
      assert.strictEqual(
        appendedUrl,
        '/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad.json',
      );
    });

    it('urlencodes a comma in the collection identifier', () => {
      const collections = ['foo,bar', 'baz'];
      const appendedUrl = appendCollectionsQueryParam(url, collections);
      assert.strictEqual(
        appendedUrl,
        '/ogcapi/tiles/WebMercatorQuad.json?collections=foo%2Cbar,baz',
      );
    });
  });

  describe('parseTileMatrixSet()', () => {
    it('handles minZoom correctly', async () => {
      const tileSet = await fse.readJSON(
        path.join(getDataDir(), 'ogcapi/tiles/WebMercatorQuad.json'),
      );
      const tileMatrixSet = await fse.readJSON(
        path.join(getDataDir(), 'ogcapi/tileMatrixSets/WebMercatorQuad.json'),
      );
      const tileInfo = parseTileMatrixSet(
        {},
        tileMatrixSet,
        undefined,
        tileSet.tileMatrixSetLimits,
      );
      assert.strictEqual(tileInfo.grid.getMinZoom(), 6);
    });
  });
});
