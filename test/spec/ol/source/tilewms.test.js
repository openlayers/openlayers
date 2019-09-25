import ImageTile from '../../../../src/ol/ImageTile.js';
import {get as getProjection} from '../../../../src/ol/proj.js';
import TileWMS from '../../../../src/ol/source/TileWMS.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';


describe('ol.source.TileWMS', () => {

  let options, optionsReproj;
  beforeEach(() => {
    options = {
      params: {
        'LAYERS': 'layer'
      },
      url: 'http://example.com/wms'
    };
    optionsReproj = {
      params: {
        'LAYERS': 'layer'
      },
      url: 'http://example.com/wms',
      projection: 'EPSG:4326'
    };
  });

  describe('constructor', () => {
    test('can be constructed without url or urls params', () => {
      const source = new TileWMS({
        projection: 'EPSG:3857',
        tileGrid: createXYZ({maxZoom: 6})
      });
      expect(source).toBeInstanceOf(TileWMS);
    });
  });

  describe('#getTile', () => {

    test('returns a tile with the expected URL', () => {
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      expect(tile).toBeInstanceOf(ImageTile);
      const uri = new URL(tile.src_);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/wms');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      expect(bbox[0]).roughlyEqual(-10018754.171394622, 1e-9);
      expect(bbox[1]).roughlyEqual(-15028131.257091936, 1e-9);
      expect(bbox[2]).roughlyEqual(-5009377.085697311, 1e-9);
      expect(bbox[3]).roughlyEqual(-10018754.171394624, 1e-9);
      expect(queryData.get('CRS')).toBe('EPSG:3857');
      expect(queryData.get('FORMAT')).toBe('image/png');
      expect(queryData.get('HEIGHT')).toBe('256');
      expect(queryData.get('LAYERS')).toBe('layer');
      expect(queryData.get('REQUEST')).toBe('GetMap');
      expect(queryData.get('SERVICE')).toBe('WMS');
      expect(queryData.get('SRS')).toBe(null);
      expect(queryData.get('STYLES')).toBe('');
      expect(queryData.get('TRANSPARENT')).toBe('true');
      expect(queryData.get('VERSION')).toBe('1.3.0');
      expect(queryData.get('WIDTH')).toBe('256');
      expect(uri.hash.replace('#', '')).toHaveLength(0);
    });

    test('returns a larger tile when a gutter is specified', () => {
      options.gutter = 16;
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      expect(tile).toBeInstanceOf(ImageTile);
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',');
      const expected = [-10331840.239250705, -15341217.324948018,
        -4696291.017841229, -9705668.103538541];
      for (let i = 0, ii = bbox.length; i < ii; ++i) {
        expect(parseFloat(bbox[i])).to.roughlyEqual(expected[i], 1e-9);
      }
      expect(queryData.get('HEIGHT')).toBe('288');
      expect(queryData.get('WIDTH')).toBe('288');
    });

    test('sets the SRS query value instead of CRS if version < 1.3', () => {
      options.params.VERSION = '1.2';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('CRS')).toBe(null);
      expect(queryData.get('SRS')).toBe('EPSG:4326');
    });

    test('allows various parameters to be overridden', () => {
      options.params.FORMAT = 'image/jpeg';
      options.params.TRANSPARENT = false;
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).toBe('image/jpeg');
      expect(queryData.get('TRANSPARENT')).toBe('false');
    });

    test('does not add a STYLES= option if one is specified', () => {
      options.params.STYLES = 'foo';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('STYLES')).toBe('foo');
    });

    test('changes the BBOX order for EN axis orientations', () => {
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).toBe('-45,-90,0,-45');
    });

    test('uses EN BBOX order if version < 1.3', () => {
      options.params.VERSION = '1.1.0';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('CRS:84'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).toBe('-90,-45,-45,0');
    });

    test('sets FORMAT_OPTIONS when the server is GeoServer', () => {
      options.serverType = 'geoserver';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 2, getProjection('CRS:84'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT_OPTIONS')).toBe('dpi:180');
    });

    test('extends FORMAT_OPTIONS if it is already present', () => {
      options.serverType = 'geoserver';
      const source = new TileWMS(options);
      options.params.FORMAT_OPTIONS = 'param1:value1';
      const tile = source.getTile(3, 2, 2, 2, getProjection('CRS:84'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT_OPTIONS')).toBe('param1:value1;dpi:180');
    });

    test(
      'rounds FORMAT_OPTIONS to an integer when the server is GeoServer',
      () => {
        options.serverType = 'geoserver';
        const source = new TileWMS(options);
        const tile = source.getTile(3, 2, 2, 1.325, getProjection('CRS:84'));
        const uri = new URL(tile.src_);
        const queryData = uri.searchParams;
        expect(queryData.get('FORMAT_OPTIONS')).toBe('dpi:119');
      }
    );

  });

  describe('#tileUrlFunction', () => {

    test('returns a tile if it is contained within layers extent', () => {
      options.extent = [-80, -40, -50, -10];
      const source = new TileWMS(options);
      const tileCoord = [3, 2, 2];
      const url = source.tileUrlFunction(tileCoord, 1, getProjection('EPSG:4326'));
      const uri = new URL(url);
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).toBe('-45,-90,0,-45');
    });

    test('returns a tile if it intersects layers extent', () => {
      options.extent = [-80, -40, -40, -10];
      const source = new TileWMS(options);
      const tileCoord = [3, 3, 2];
      const url = source.tileUrlFunction(tileCoord, 1, getProjection('EPSG:4326'));
      const uri = new URL(url);
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).toBe('-45,-45,0,0');
    });

    test('works with non-square tiles', () => {
      options.tileGrid = new TileGrid({
        tileSize: [640, 320],
        resolutions: [1.40625, 0.703125, 0.3515625, 0.17578125],
        origin: [-180, -90]
      });
      const source = new TileWMS(options);
      const tileCoord = [3, 3, 2];
      const url = source.tileUrlFunction(tileCoord, 1, getProjection('EPSG:4326'));
      const uri = new URL(url);
      const queryData = uri.searchParams;
      expect(queryData.get('WIDTH')).toBe('640');
      expect(queryData.get('HEIGHT')).toBe('320');
    });

  });

  describe('#getFeatureInfoUrl', () => {

    test('returns the expected GetFeatureInfo URL', () => {
      const source = new TileWMS(options);
      source.pixelRatio_ = 1;
      const url = source.getFeatureInfoUrl(
        [-7000000, -12000000],
        19567.87924100512, getProjection('EPSG:3857'),
        {INFO_FORMAT: 'text/plain'});
      const uri = new URL(url);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/wms');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      expect(bbox[0]).roughlyEqual(-10018754.171394622, 1e-9);
      expect(bbox[1]).roughlyEqual(-15028131.257091936, 1e-9);
      expect(bbox[2]).roughlyEqual(-5009377.085697311, 1e-9);
      expect(bbox[3]).roughlyEqual(-10018754.171394624, 1e-9);
      expect(queryData.get('CRS')).toBe('EPSG:3857');
      expect(queryData.get('FORMAT')).toBe('image/png');
      expect(queryData.get('HEIGHT')).toBe('256');
      expect(queryData.get('I')).toBe('154');
      expect(queryData.get('J')).toBe('101');
      expect(queryData.get('LAYERS')).toBe('layer');
      expect(queryData.get('QUERY_LAYERS')).toBe('layer');
      expect(queryData.get('REQUEST')).toBe('GetFeatureInfo');
      expect(queryData.get('SERVICE')).toBe('WMS');
      expect(queryData.get('SRS')).toBe(null);
      expect(queryData.get('STYLES')).toBe('');
      expect(queryData.get('TRANSPARENT')).toBe('true');
      expect(queryData.get('VERSION')).toBe('1.3.0');
      expect(queryData.get('WIDTH')).toBe('256');
      expect(uri.hash.replace('#', '')).toHaveLength(0);
    });

    test(
      'returns the expected GetFeatureInfo URL when source\'s projection is different from the parameter',
      () => {
        const source = new TileWMS(optionsReproj);
        source.pixelRatio_ = 1;
        const url = source.getFeatureInfoUrl(
          [-7000000, -12000000],
          19567.87924100512, getProjection('EPSG:3857'),
          {INFO_FORMAT: 'text/plain'});
        const uri = new URL(url);
        expect(uri.protocol).toBe('http:');
        expect(uri.hostname).toBe('example.com');
        expect(uri.pathname).toBe('/wms');
        const queryData = uri.searchParams;
        expect(queryData.get('BBOX')).toBe('-79.17133464081945,-90,-66.51326044311186,-45');
        expect(queryData.get('CRS')).toBe('EPSG:4326');
        expect(queryData.get('FORMAT')).toBe('image/png');
        expect(queryData.get('HEIGHT')).toBe('256');
        expect(queryData.get('I')).toBe('517');
        expect(queryData.get('J')).toBe('117');
        expect(queryData.get('LAYERS')).toBe('layer');
        expect(queryData.get('QUERY_LAYERS')).toBe('layer');
        expect(queryData.get('REQUEST')).toBe('GetFeatureInfo');
        expect(queryData.get('SERVICE')).toBe('WMS');
        expect(queryData.get('SRS')).toBe(null);
        expect(queryData.get('STYLES')).toBe('');
        expect(queryData.get('TRANSPARENT')).toBe('true');
        expect(queryData.get('VERSION')).toBe('1.3.0');
        expect(queryData.get('WIDTH')).toBe('256');
        expect(uri.hash.replace('#', '')).toHaveLength(0);
      }
    );

    test('sets the QUERY_LAYERS param as expected', () => {
      const source = new TileWMS(options);
      source.pixelRatio_ = 1;
      const url = source.getFeatureInfoUrl(
        [-7000000, -12000000],
        19567.87924100512, getProjection('EPSG:3857'),
        {INFO_FORMAT: 'text/plain', QUERY_LAYERS: 'foo,bar'});
      const uri = new URL(url);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/wms');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      expect(bbox[0]).roughlyEqual(-10018754.171394622, 1e-9);
      expect(bbox[1]).roughlyEqual(-15028131.257091936, 1e-9);
      expect(bbox[2]).roughlyEqual(-5009377.085697311, 1e-9);
      expect(bbox[3]).roughlyEqual(-10018754.171394624, 1e-9);
      expect(queryData.get('CRS')).toBe('EPSG:3857');
      expect(queryData.get('FORMAT')).toBe('image/png');
      expect(queryData.get('HEIGHT')).toBe('256');
      expect(queryData.get('I')).toBe('154');
      expect(queryData.get('J')).toBe('101');
      expect(queryData.get('LAYERS')).toBe('layer');
      expect(queryData.get('QUERY_LAYERS')).toBe('foo,bar');
      expect(queryData.get('REQUEST')).toBe('GetFeatureInfo');
      expect(queryData.get('SERVICE')).toBe('WMS');
      expect(queryData.get('SRS')).toBe(null);
      expect(queryData.get('STYLES')).toBe('');
      expect(queryData.get('TRANSPARENT')).toBe('true');
      expect(queryData.get('VERSION')).toBe('1.3.0');
      expect(queryData.get('WIDTH')).toBe('256');
      expect(uri.hash.replace('#', '')).toHaveLength(0);
    });
  });

  describe('#getLegendGraphicUrl', () => {

    test('returns the getLegenGraphic url as expected', () => {
      const source = new TileWMS(options);
      const url = source.getLegendUrl(0.1);
      const uri = new URL(url);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).toBe('image/png');
      expect(queryData.get('LAYER')).toBe('layer');
      expect(queryData.get('REQUEST')).toBe('GetLegendGraphic');
      expect(queryData.get('SERVICE')).toBe('WMS');
      expect(queryData.get('VERSION')).toBe('1.3.0');
      expect(queryData.get('SCALE')).toBe('357.14214285714274');
    });

    test('does not include SCALE if no resolution was provided', () => {
      const source = new TileWMS(options);
      const url = source.getLegendUrl();
      const uri = new URL(url);
      const queryData = uri.searchParams;
      expect(queryData.get('SCALE')).toBe(null);
    });

    test('adds additional params as expected', () => {
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
        LAYER: 'LAYER_VALUE'
      });
      const uri = new URL(url);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).toBe('FORMAT_VALUE');
      expect(queryData.get('LAYER')).toBe('LAYER_VALUE');
      expect(queryData.get('REQUEST')).toBe('GetLegendGraphic');
      expect(queryData.get('SERVICE')).toBe('WMS');
      expect(queryData.get('VERSION')).toBe('1.3.0');
      expect(queryData.get('SCALE')).toBe('357.14214285714274');
      expect(queryData.get('STYLE')).toBe('STYLE_VALUE');
      expect(queryData.get('FEATURETYPE')).toBe('FEATURETYPE_VALUE');
      expect(queryData.get('RULE')).toBe('RULE_VALUE');
      expect(queryData.get('SLD')).toBe('SLD_VALUE');
      expect(queryData.get('SLD_BODY')).toBe('SLD_BODY_VALUE');
      expect(queryData.get('FORMAT')).toBe('FORMAT_VALUE');
      expect(queryData.get('WIDTH')).toBe('WIDTH_VALUE');
      expect(queryData.get('HEIGHT')).toBe('HEIGHT_VALUE');
      expect(queryData.get('EXCEPTIONS')).toBe('EXCEPTIONS_VALUE');
      expect(queryData.get('LANGUAGE')).toBe('LANGUAGE_VALUE');
    });

  });

  describe('#setUrl()', () => {
    test('sets the correct url', () => {
      const source = new TileWMS(options);
      const url = 'http://foo/';
      source.setUrl(url);
      const tileUrl = source.tileUrlFunction([0, 0, 0], 1, getProjection('EPSG:4326'));
      expect(tileUrl.indexOf(url)).toBe(0);
    });
  });

  describe('#setUrls()', () => {
    test('updates the source key', () => {
      const source = new TileWMS({
        urls: ['u1', 'u2']
      });
      const originalKey = source.getKey();
      source.setUrls(['u3', 'u4']);
      expect(source.getKey() !== originalKey).toBe(true);
    });
  });
});
