import {assert} from 'chai';
import ImageTile from '../../../../../src/ol/ImageTile.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import TileWMS from '../../../../../src/ol/source/TileWMS.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';
import TileGrid from '../../../../../src/ol/tilegrid/TileGrid.js';

describe('ol/source/TileWMS', function () {
  let options, optionsReproj;
  beforeEach(function () {
    options = {
      params: {
        'LAYERS': 'layer',
      },
      url: 'http://example.com/wms',
    };
    optionsReproj = {
      params: {
        'LAYERS': 'layer',
      },
      url: 'http://example.com/wms',
      projection: 'EPSG:4326',
    };
  });

  describe('constructor', function () {
    it('can be constructed without url or urls params', function () {
      const source = new TileWMS({
        projection: 'EPSG:3857',
        tileGrid: createXYZ({maxZoom: 6}),
      });
      assert.instanceOf(source, TileWMS);
    });
  });

  describe('#getParams', function () {
    it('verify getting a param', function () {
      const source = new TileWMS(options);
      const setParams = source.getParams();
      assert.deepEqual(setParams, {'LAYERS': 'layer'});
    });

    it('verify on adding a param', function () {
      const source = new TileWMS(options);
      source.updateParams({'TEST': 'value'});
      const setParams = source.getParams();
      assert.deepEqual(setParams, {'LAYERS': 'layer', TEST: 'value'});
      assert.deepEqual(options.params, {'LAYERS': 'layer'});
    });

    it('verify on update a param', function () {
      const source = new TileWMS(options);
      source.updateParams({'LAYERS': 'newLayer'});
      const setParams = source.getParams();
      assert.deepEqual(setParams, {'LAYERS': 'newLayer'});
      assert.deepEqual(options.params, {'LAYERS': 'layer'});
    });
  });

  describe('updateParams()', function () {
    it('updates a subset of the params', function () {
      const source = new TileWMS({
        url: 'http://example.com/wms',
        params: {
          LAYERS: 'layer',
          test: 'before',
        },
      });

      const tileCoord = [1, 2, 3];
      const projection = getProjection('EPSG:4326');

      const urlBefore = new URL(
        source.tileUrlFunction(tileCoord, 1, projection),
      );
      const paramsBefore = urlBefore.searchParams;
      assert.strictEqual(paramsBefore.get('test'), 'before');
      assert.strictEqual(paramsBefore.get('LAYERS'), 'layer');
      assert.strictEqual(paramsBefore.get('foo'), null);

      source.updateParams({test: 'after', foo: 'bar'});

      const urlAfter = new URL(
        source.tileUrlFunction(tileCoord, 1, projection),
      );
      const paramsAfter = urlAfter.searchParams;
      assert.strictEqual(paramsAfter.get('test'), 'after');
      assert.strictEqual(paramsAfter.get('foo'), 'bar');
      assert.strictEqual(paramsAfter.get('LAYERS'), 'layer');
    });

    it('does not modify the object passed to the constructor', function () {
      const params = {LAYERS: 'layer'};
      const source = new TileWMS({
        url: 'http://example.com/wms',
        params,
      });

      source.updateParams({LAYERS: 'after'});
      assert.strictEqual(params.LAYERS, 'layer');
    });

    it('does not modify the object passed to setParams', function () {
      const params = {LAYERS: 'layer'};
      const source = new TileWMS({
        url: 'http://example.com/wms',
      });

      source.setParams({LAYERS: 'after'});
      assert.strictEqual(params.LAYERS, 'layer');
    });
  });

  describe('setParams()', function () {
    it('sets all of the params', function () {
      const source = new TileWMS({
        url: 'http://example.com/wms',
        params: {
          LAYERS: 'layer',
          test: 'before',
        },
      });

      const tileCoord = [1, 2, 3];
      const projection = getProjection('EPSG:4326');

      const urlBefore = new URL(
        source.tileUrlFunction(tileCoord, 1, projection),
      );
      const paramsBefore = urlBefore.searchParams;
      assert.strictEqual(paramsBefore.get('test'), 'before');
      assert.strictEqual(paramsBefore.get('LAYERS'), 'layer');
      assert.strictEqual(paramsBefore.get('foo'), null);

      source.setParams({test: 'after', foo: 'bar'});

      const urlAfter = new URL(
        source.tileUrlFunction(tileCoord, 1, projection),
      );
      const paramsAfter = urlAfter.searchParams;
      assert.strictEqual(paramsAfter.get('test'), 'after');
      assert.strictEqual(paramsAfter.get('foo'), 'bar');
      assert.strictEqual(paramsAfter.get('LAYERS'), null);
    });
  });

  describe('#getInterpolate()', function () {
    it('is true by default', function () {
      const source = new TileWMS();
      assert.strictEqual(source.getInterpolate(), true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new TileWMS({interpolate: false});
      assert.strictEqual(source.getInterpolate(), false);
    });
  });

  describe('#getTile', function () {
    it('returns a tile with the expected URL', function () {
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      assert.instanceOf(tile, ImageTile);
      const uri = new URL(tile.src_);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, 'example.com');
      assert.strictEqual(uri.pathname, '/wms');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      assert.approximately(bbox[0], -10018754.171394622, 1e-9);
      assert.approximately(bbox[1], -15028131.257091936, 1e-9);
      assert.approximately(bbox[2], -5009377.085697311, 1e-9);
      assert.approximately(bbox[3], -10018754.171394624, 1e-9);
      assert.strictEqual(queryData.get('CRS'), 'EPSG:3857');
      assert.strictEqual(queryData.get('FORMAT'), 'image/png');
      assert.strictEqual(queryData.get('HEIGHT'), '256');
      assert.strictEqual(queryData.get('LAYERS'), 'layer');
      assert.strictEqual(queryData.get('REQUEST'), 'GetMap');
      assert.strictEqual(queryData.get('SERVICE'), 'WMS');
      assert.strictEqual(queryData.get('SRS'), null);
      assert.strictEqual(queryData.get('STYLES'), '');
      assert.strictEqual(queryData.get('TRANSPARENT'), 'TRUE');
      assert.strictEqual(queryData.get('VERSION'), '1.3.0');
      assert.strictEqual(queryData.get('WIDTH'), '256');
      assert.isEmpty(uri.hash.replace('#', ''));
    });

    it('returns a larger tile when a gutter is specified', function () {
      options.gutter = 16;
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      assert.instanceOf(tile, ImageTile);
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',');
      const expected = [
        -10331840.239250705, -15341217.324948018, -4696291.017841229,
        -9705668.103538541,
      ];
      for (let i = 0, ii = bbox.length; i < ii; ++i) {
        assert.approximately(parseFloat(bbox[i]), expected[i], 1e-9);
      }
      assert.strictEqual(queryData.get('HEIGHT'), '288');
      assert.strictEqual(queryData.get('WIDTH'), '288');
    });

    it('sets the SRS query value instead of CRS if version < 1.3', function () {
      options.params.VERSION = '1.2';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('CRS'), null);
      assert.strictEqual(queryData.get('SRS'), 'EPSG:4326');
    });

    it('allows various parameters to be overridden', function () {
      options.params.FORMAT = 'image/jpeg';
      options.params.TRANSPARENT = false;
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('FORMAT'), 'image/jpeg');
      assert.strictEqual(queryData.get('TRANSPARENT'), 'false');
    });

    it('valid TRANSPARENT default value', function () {
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('TRANSPARENT'), 'TRUE');
    });

    it('valid TRANSPARENT override value', function () {
      options.params.TRANSPARENT = 'FALSE';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('TRANSPARENT'), 'FALSE');
    });

    it('does not add a STYLES= option if one is specified', function () {
      options.params.STYLES = 'foo';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('STYLES'), 'foo');
    });

    it('changes the BBOX order for EN axis orientations', function () {
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('BBOX'), '-45,-90,0,-45');
    });

    it('uses EN BBOX order if version < 1.3', function () {
      options.params.VERSION = '1.1.0';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('CRS:84'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('BBOX'), '-90,-45,-45,0');
    });

    it('sets FORMAT_OPTIONS when the server is GeoServer', function () {
      options.serverType = 'geoserver';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 2, getProjection('CRS:84'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('FORMAT_OPTIONS'), 'dpi:180');
    });

    it('extends FORMAT_OPTIONS if it is already present', function () {
      options.serverType = 'geoserver';
      options.params.FORMAT_OPTIONS = 'param1:value1';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 2, getProjection('CRS:84'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(
        queryData.get('FORMAT_OPTIONS'),
        'param1:value1;dpi:180',
      );
    });

    it('rounds FORMAT_OPTIONS to an integer when the server is GeoServer', function () {
      options.serverType = 'geoserver';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1.325, getProjection('CRS:84'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('FORMAT_OPTIONS'), 'dpi:119');
    });
  });

  describe('#tileUrlFunction', function () {
    it('can be used when obtained through #getTileUrlFunction', function () {
      options.extent = [-80, -40, -50, -10];
      const source = new TileWMS(options);
      const tileCoord = [3, 2, 2];
      assert.doesNotThrow(function () {
        source.getTileUrlFunction()(tileCoord, 1, getProjection('EPSG:4326'));
      });
    });

    it('returns a tile if it is contained within layers extent', function () {
      options.extent = [-80, -40, -50, -10];
      const source = new TileWMS(options);
      const tileCoord = [3, 2, 2];
      const url = source.tileUrlFunction(
        tileCoord,
        1,
        getProjection('EPSG:4326'),
      );
      const uri = new URL(url);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('BBOX'), '-45,-90,0,-45');
    });

    it('returns a tile if it intersects layers extent', function () {
      options.extent = [-80, -40, -40, -10];
      const source = new TileWMS(options);
      const tileCoord = [3, 3, 2];
      const url = source.tileUrlFunction(
        tileCoord,
        1,
        getProjection('EPSG:4326'),
      );
      const uri = new URL(url);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('BBOX'), '-45,-45,0,0');
    });

    it('works with non-square tiles', function () {
      options.tileGrid = new TileGrid({
        tileSize: [640, 320],
        resolutions: [1.40625, 0.703125, 0.3515625, 0.17578125],
        origin: [-180, -90],
      });
      const source = new TileWMS(options);
      const tileCoord = [3, 3, 2];
      const url = source.tileUrlFunction(
        tileCoord,
        1,
        getProjection('EPSG:4326'),
      );
      const uri = new URL(url);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('WIDTH'), '640');
      assert.strictEqual(queryData.get('HEIGHT'), '320');
    });
  });

  describe('#getFeatureInfoUrl', function () {
    it('returns the expected GetFeatureInfo URL', function () {
      const source = new TileWMS(options);
      source.pixelRatio_ = 1;
      const url = source.getFeatureInfoUrl(
        [-7000000, -12000000],
        19567.87924100512,
        getProjection('EPSG:3857'),
        {INFO_FORMAT: 'text/plain'},
      );
      const uri = new URL(url);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, 'example.com');
      assert.strictEqual(uri.pathname, '/wms');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      assert.approximately(bbox[0], -10018754.171394622, 1e-9);
      assert.approximately(bbox[1], -15028131.257091936, 1e-9);
      assert.approximately(bbox[2], -5009377.085697311, 1e-9);
      assert.approximately(bbox[3], -10018754.171394624, 1e-9);
      assert.strictEqual(queryData.get('CRS'), 'EPSG:3857');
      assert.strictEqual(queryData.get('FORMAT'), 'image/png');
      assert.strictEqual(queryData.get('HEIGHT'), '256');
      assert.strictEqual(queryData.get('I'), '154');
      assert.strictEqual(queryData.get('J'), '101');
      assert.strictEqual(queryData.get('LAYERS'), 'layer');
      assert.strictEqual(queryData.get('QUERY_LAYERS'), 'layer');
      assert.strictEqual(queryData.get('REQUEST'), 'GetFeatureInfo');
      assert.strictEqual(queryData.get('SERVICE'), 'WMS');
      assert.strictEqual(queryData.get('SRS'), null);
      assert.strictEqual(queryData.get('STYLES'), '');
      assert.strictEqual(queryData.get('TRANSPARENT'), 'TRUE');
      assert.strictEqual(queryData.get('VERSION'), '1.3.0');
      assert.strictEqual(queryData.get('WIDTH'), '256');
      assert.isEmpty(uri.hash.replace('#', ''));
    });

    it("returns the expected GetFeatureInfo URL when source's projection is different from the parameter", function () {
      const source = new TileWMS(optionsReproj);
      source.pixelRatio_ = 1;
      const url = source.getFeatureInfoUrl(
        [-7000000, -12000000],
        19567.87924100512,
        getProjection('EPSG:3857'),
        {INFO_FORMAT: 'text/plain'},
      );
      const uri = new URL(url);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, 'example.com');
      assert.strictEqual(uri.pathname, '/wms');
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('BBOX'), '-78.75,-67.5,-67.5,-56.25');
      assert.strictEqual(queryData.get('CRS'), 'EPSG:4326');
      assert.strictEqual(queryData.get('FORMAT'), 'image/png');
      assert.strictEqual(queryData.get('HEIGHT'), '256');
      assert.strictEqual(queryData.get('I'), '105');
      assert.strictEqual(queryData.get('J'), '117');
      assert.strictEqual(queryData.get('LAYERS'), 'layer');
      assert.strictEqual(queryData.get('QUERY_LAYERS'), 'layer');
      assert.strictEqual(queryData.get('REQUEST'), 'GetFeatureInfo');
      assert.strictEqual(queryData.get('SERVICE'), 'WMS');
      assert.strictEqual(queryData.get('SRS'), null);
      assert.strictEqual(queryData.get('STYLES'), '');
      assert.strictEqual(queryData.get('TRANSPARENT'), 'TRUE');
      assert.strictEqual(queryData.get('VERSION'), '1.3.0');
      assert.strictEqual(queryData.get('WIDTH'), '256');
      assert.isEmpty(uri.hash.replace('#', ''));
    });

    it('sets the QUERY_LAYERS param as expected', function () {
      const source = new TileWMS(options);
      source.pixelRatio_ = 1;
      const url = source.getFeatureInfoUrl(
        [-7000000, -12000000],
        19567.87924100512,
        getProjection('EPSG:3857'),
        {INFO_FORMAT: 'text/plain', QUERY_LAYERS: 'foo,bar'},
      );
      const uri = new URL(url);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, 'example.com');
      assert.strictEqual(uri.pathname, '/wms');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      assert.approximately(bbox[0], -10018754.171394622, 1e-9);
      assert.approximately(bbox[1], -15028131.257091936, 1e-9);
      assert.approximately(bbox[2], -5009377.085697311, 1e-9);
      assert.approximately(bbox[3], -10018754.171394624, 1e-9);
      assert.strictEqual(queryData.get('CRS'), 'EPSG:3857');
      assert.strictEqual(queryData.get('FORMAT'), 'image/png');
      assert.strictEqual(queryData.get('HEIGHT'), '256');
      assert.strictEqual(queryData.get('I'), '154');
      assert.strictEqual(queryData.get('J'), '101');
      assert.strictEqual(queryData.get('LAYERS'), 'layer');
      assert.strictEqual(queryData.get('QUERY_LAYERS'), 'foo,bar');
      assert.strictEqual(queryData.get('REQUEST'), 'GetFeatureInfo');
      assert.strictEqual(queryData.get('SERVICE'), 'WMS');
      assert.strictEqual(queryData.get('SRS'), null);
      assert.strictEqual(queryData.get('STYLES'), '');
      assert.strictEqual(queryData.get('TRANSPARENT'), 'TRUE');
      assert.strictEqual(queryData.get('VERSION'), '1.3.0');
      assert.strictEqual(queryData.get('WIDTH'), '256');
      assert.isEmpty(uri.hash.replace('#', ''));
    });
  });

  describe('#getLegendGraphicUrl', function () {
    it('returns the getLegenGraphic url as expected', function () {
      const source = new TileWMS(options);
      const url = source.getLegendUrl(0.1);
      const uri = new URL(url);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, 'example.com');
      assert.strictEqual(uri.pathname, '/wms');
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('FORMAT'), 'image/png');
      assert.strictEqual(queryData.get('LAYER'), 'layer');
      assert.strictEqual(queryData.get('REQUEST'), 'GetLegendGraphic');
      assert.strictEqual(queryData.get('SERVICE'), 'WMS');
      assert.strictEqual(queryData.get('VERSION'), '1.3.0');
      assert.strictEqual(queryData.get('SCALE'), '357.14285714285717');
    });

    it('does not include SCALE if no resolution was provided', function () {
      const source = new TileWMS(options);
      const url = source.getLegendUrl();
      const uri = new URL(url);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('SCALE'), null);
    });

    it('adds additional params as expected', function () {
      const source = new TileWMS(options);
      const url = source.getLegendUrl(0.1, {
        STYLE: 'STYLE_VALUE',
        FEATURETYPE: 'FEATURETYPE_VALUE',
        RULE: 'RULE_VALUE',
        SLD: 'SLD_VALUE',
        SLD_BODY: 'SLD_BODY_VALUE',
        FORMAT: 'FORMAT_VALUE',
        WIDTH: 'WIDTH_VALUE',
        HEIGHT: 'HEIGHT_VALUE',
        EXCEPTIONS: 'EXCEPTIONS_VALUE',
        LANGUAGE: 'LANGUAGE_VALUE',
        LAYER: 'LAYER_VALUE',
      });
      const uri = new URL(url);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, 'example.com');
      assert.strictEqual(uri.pathname, '/wms');
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('FORMAT'), 'FORMAT_VALUE');
      assert.strictEqual(queryData.get('LAYER'), 'LAYER_VALUE');
      assert.strictEqual(queryData.get('REQUEST'), 'GetLegendGraphic');
      assert.strictEqual(queryData.get('SERVICE'), 'WMS');
      assert.strictEqual(queryData.get('VERSION'), '1.3.0');
      assert.strictEqual(queryData.get('SCALE'), '357.14285714285717');
      assert.strictEqual(queryData.get('STYLE'), 'STYLE_VALUE');
      assert.strictEqual(queryData.get('FEATURETYPE'), 'FEATURETYPE_VALUE');
      assert.strictEqual(queryData.get('RULE'), 'RULE_VALUE');
      assert.strictEqual(queryData.get('SLD'), 'SLD_VALUE');
      assert.strictEqual(queryData.get('SLD_BODY'), 'SLD_BODY_VALUE');
      assert.strictEqual(queryData.get('FORMAT'), 'FORMAT_VALUE');
      assert.strictEqual(queryData.get('WIDTH'), 'WIDTH_VALUE');
      assert.strictEqual(queryData.get('HEIGHT'), 'HEIGHT_VALUE');
      assert.strictEqual(queryData.get('EXCEPTIONS'), 'EXCEPTIONS_VALUE');
      assert.strictEqual(queryData.get('LANGUAGE'), 'LANGUAGE_VALUE');
    });
  });

  describe('#setUrl()', function () {
    it('sets the correct url', function () {
      const source = new TileWMS(options);
      const url = 'http://foo/';
      source.setUrl(url);
      const tileUrl = source.tileUrlFunction(
        [0, 0, 0],
        1,
        getProjection('EPSG:4326'),
      );
      assert.strictEqual(tileUrl.indexOf(url), 0);
    });
  });

  describe('#setUrls()', function () {
    it('updates the source key', function () {
      const source = new TileWMS({
        urls: ['u1', 'u2'],
      });
      const originalKey = source.getKey();
      source.setUrls(['u3', 'u4']);
      assert.strictEqual(source.getKey() !== originalKey, true);
    });
  });
});
