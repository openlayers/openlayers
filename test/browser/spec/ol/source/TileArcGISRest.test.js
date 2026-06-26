import {assert} from 'chai';
import ImageTile from '../../../../../src/ol/ImageTile.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import TileArcGISRest from '../../../../../src/ol/source/TileArcGISRest.js';

describe('ol/source/TileArcGISRest', function () {
  let options;
  beforeEach(function () {
    options = {
      params: {},
      url: 'http://example.com/MapServer',
    };
  });

  describe('#getTile', function () {
    it('returns a tile with the expected URL', function () {
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      assert.instanceOf(tile, ImageTile);
      const uri = new URL(tile.src_);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, 'example.com');
      assert.strictEqual(uri.pathname, '/MapServer/export');
      const queryData = uri.searchParams;
      const bbox = queryData.get('bbox').split(',').map(parseFloat);
      assert.approximately(bbox[0], -10018754.171394622, 1e-9);
      assert.approximately(bbox[1], -15028131.257091936, 1e-9);
      assert.approximately(bbox[2], -5009377.085697311, 1e-9);
      assert.approximately(bbox[3], -10018754.171394624, 1e-9);
      assert.strictEqual(queryData.get('format'), 'png32');
      assert.strictEqual(queryData.get('size'), '256,256');
      assert.strictEqual(queryData.get('imageSR'), '3857');
      assert.strictEqual(queryData.get('bboxSR'), '3857');
      assert.strictEqual(queryData.get('transparent'), 'true');
    });

    it('returns a non floating point dpi value', function () {
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 6, 1.12, getProjection('EPSG:3857'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('dpi'), '101');
    });

    it('takes dpi from params if specified', function () {
      options.params.dpi = 96;
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 6, 1.12, getProjection('EPSG:3857'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('dpi'), '108');
      delete options.params.dpi;
    });

    it('returns a tile with the expected URL with url list', function () {
      options.urls = [
        'http://test1.com/MapServer',
        'http://test2.com/MapServer',
      ];
      const source = new TileArcGISRest(options);

      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      assert.instanceOf(tile, ImageTile);
      const uri = new URL(tile.src_);
      assert.strictEqual(uri.protocol, 'http:');
      assert.match(uri.hostname, /test[12]\.com/);
      assert.strictEqual(uri.pathname, '/MapServer/export');
      const queryData = uri.searchParams;
      const bbox = queryData.get('bbox').split(',').map(parseFloat);
      assert.approximately(bbox[0], -10018754.171394622, 1e-9);
      assert.approximately(bbox[1], -15028131.257091936, 1e-9);
      assert.approximately(bbox[2], -5009377.085697311, 1e-9);
      assert.approximately(bbox[3], -10018754.171394624, 1e-9);
      assert.strictEqual(queryData.get('format'), 'png32');
      assert.strictEqual(queryData.get('size'), '256,256');
      assert.strictEqual(queryData.get('imageSR'), '3857');
      assert.strictEqual(queryData.get('bboxSR'), '3857');
      assert.strictEqual(queryData.get('transparent'), 'true');
    });

    it('returns a tile with the expected URL for ImageServer', function () {
      options.url = 'http://example.com/ImageServer';
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      assert.instanceOf(tile, ImageTile);
      const uri = new URL(tile.src_);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, 'example.com');
      assert.strictEqual(uri.pathname, '/ImageServer/exportImage');
      const queryData = uri.searchParams;
      const bbox = queryData.get('bbox').split(',').map(parseFloat);
      assert.approximately(bbox[0], -10018754.171394622, 1e-9);
      assert.approximately(bbox[1], -15028131.257091936, 1e-9);
      assert.approximately(bbox[2], -5009377.085697311, 1e-9);
      assert.approximately(bbox[3], -10018754.171394624, 1e-9);
      assert.strictEqual(queryData.get('format'), 'png32');
      assert.strictEqual(queryData.get('size'), '256,256');
      assert.strictEqual(queryData.get('imageSR'), '3857');
      assert.strictEqual(queryData.get('bboxSR'), '3857');
      assert.strictEqual(queryData.get('transparent'), 'true');
    });

    it('allows various parameters to be overridden', function () {
      options.params.format = 'png';
      options.params.transparent = false;
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('format'), 'png');
      assert.strictEqual(queryData.get('transparent'), 'false');
    });

    it('allows adding rest option', function () {
      options.params.layers = 'show:1,3,4';
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('layers'), 'show:1,3,4');
    });
  });

  describe('#setParams', function () {
    it('allows params to be set', function () {
      const before = {test: 'before', foo: 'bar'};
      const source = new TileArcGISRest({params: before});
      source.setParams({test: 'after'});

      const params = source.getParams();
      assert.deepEqual(params, {test: 'after'});

      assert.deepEqual(before, {test: 'before', foo: 'bar'});
    });
  });

  describe('#updateParams', function () {
    it('add a new param', function () {
      const source = new TileArcGISRest(options);
      source.updateParams({'TEST': 'value'});

      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('TEST'), 'value');
    });

    it('updates an existing param', function () {
      options.params.TEST = 'value';

      const source = new TileArcGISRest(options);
      source.updateParams({'TEST': 'newValue'});

      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('TEST'), 'newValue');
    });
  });

  describe('#getParams', function () {
    it('verify getting a param', function () {
      options.params.TEST = 'value';
      const source = new TileArcGISRest(options);
      const setParams = source.getParams();
      assert.deepEqual(setParams, {TEST: 'value'});
    });

    it('verify on adding a param', function () {
      options.params.TEST = 'value';
      const source = new TileArcGISRest(options);
      source.updateParams({'TEST2': 'newValue'});
      const setParams = source.getParams();
      assert.deepEqual(setParams, {TEST: 'value', TEST2: 'newValue'});
      assert.deepEqual(options.params, {TEST: 'value'});
    });

    it('verify on update a param', function () {
      options.params.TEST = 'value';
      const source = new TileArcGISRest(options);
      source.updateParams({'TEST': 'newValue'});
      const setParams = source.getParams();
      assert.deepEqual(setParams, {TEST: 'newValue'});
      assert.deepEqual(options.params, {TEST: 'value'});
    });
  });

  describe('#getUrls', function () {
    it('verify getting array of urls', function () {
      options.urls = [
        'http://test.com/MapServer',
        'http://test2.com/MapServer',
      ];

      const source = new TileArcGISRest(options);

      const urls = source.getUrls();

      assert.deepEqual(urls, [
        'http://test.com/MapServer',
        'http://test2.com/MapServer',
      ]);
    });
  });

  describe('#setUrls', function () {
    it('verify setting urls when not set yet', function () {
      const source = new TileArcGISRest(options);
      source.setUrls([
        'http://test.com/MapServer',
        'http://test2.com/MapServer',
      ]);

      const urls = source.getUrls();

      assert.deepEqual(urls, [
        'http://test.com/MapServer',
        'http://test2.com/MapServer',
      ]);
    });

    it('verify setting urls with existing list', function () {
      options.urls = [
        'http://test.com/MapServer',
        'http://test2.com/MapServer',
      ];

      const source = new TileArcGISRest(options);
      source.setUrls([
        'http://test3.com/MapServer',
        'http://test4.com/MapServer',
      ]);

      const urls = source.getUrls();

      assert.deepEqual(urls, [
        'http://test3.com/MapServer',
        'http://test4.com/MapServer',
      ]);
    });
  });

  describe('#setUrl', function () {
    it('verify setting url with no urls', function () {
      const source = new TileArcGISRest(options);
      source.setUrl('http://test.com/MapServer');

      const urls = source.getUrls();

      assert.deepEqual(urls, ['http://test.com/MapServer']);
    });

    it('verify setting url with list of urls', function () {
      options.urls = [
        'http://test.com/MapServer',
        'http://test2.com/MapServer',
      ];

      const source = new TileArcGISRest(options);
      source.setUrl('http://test3.com/MapServer');

      const urls = source.getUrls();

      assert.deepEqual(urls, ['http://test3.com/MapServer']);

      const tileUrl = source.tileUrlFunction(
        [0, 0, 0],
        1,
        getProjection('EPSG:4326'),
      );
      assert.strictEqual(tileUrl.indexOf(urls[0]), 0);
    });
  });
});
