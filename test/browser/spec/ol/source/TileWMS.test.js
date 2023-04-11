import ImageTile from '../../../../../src/ol/ImageTile.js';
import TileGrid from '../../../../../src/ol/tilegrid/TileGrid.js';
import TileWMS from '../../../../../src/ol/source/TileWMS.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';

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
      expect(source).to.be.an(TileWMS);
    });
  });

  describe('#getInterpolate()', function () {
    it('is true by default', function () {
      const source = new TileWMS();
      expect(source.getInterpolate()).to.be(true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new TileWMS({interpolate: false});
      expect(source.getInterpolate()).to.be(false);
    });
  });

  describe('#getTile', function () {
    it('returns a tile with the expected URL', function () {
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      expect(tile).to.be.an(ImageTile);
      const uri = new URL(tile.src_);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/wms');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      expect(bbox[0]).roughlyEqual(-10018754.171394622, 1e-9);
      expect(bbox[1]).roughlyEqual(-15028131.257091936, 1e-9);
      expect(bbox[2]).roughlyEqual(-5009377.085697311, 1e-9);
      expect(bbox[3]).roughlyEqual(-10018754.171394624, 1e-9);
      expect(queryData.get('CRS')).to.be('EPSG:3857');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('256');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('REQUEST')).to.be('GetMap');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(null);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('true');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('256');
      expect(uri.hash.replace('#', '')).to.be.empty();
    });

    it('returns a larger tile when a gutter is specified', function () {
      options.gutter = 16;
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      expect(tile).to.be.an(ImageTile);
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',');
      const expected = [
        -10331840.239250705, -15341217.324948018, -4696291.017841229,
        -9705668.103538541,
      ];
      for (let i = 0, ii = bbox.length; i < ii; ++i) {
        expect(parseFloat(bbox[i])).to.roughlyEqual(expected[i], 1e-9);
      }
      expect(queryData.get('HEIGHT')).to.be('288');
      expect(queryData.get('WIDTH')).to.be('288');
    });

    it('sets the SRS query value instead of CRS if version < 1.3', function () {
      options.params.VERSION = '1.2';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('CRS')).to.be(null);
      expect(queryData.get('SRS')).to.be('EPSG:4326');
    });

    it('allows various parameters to be overridden', function () {
      options.params.FORMAT = 'image/jpeg';
      options.params.TRANSPARENT = false;
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).to.be('image/jpeg');
      expect(queryData.get('TRANSPARENT')).to.be('false');
    });

    it('does not add a STYLES= option if one is specified', function () {
      options.params.STYLES = 'foo';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('STYLES')).to.be('foo');
    });

    it('changes the BBOX order for EN axis orientations', function () {
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('-45,-90,0,-45');
    });

    it('uses EN BBOX order if version < 1.3', function () {
      options.params.VERSION = '1.1.0';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('CRS:84'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('-90,-45,-45,0');
    });

    it('sets FORMAT_OPTIONS when the server is GeoServer', function () {
      options.serverType = 'geoserver';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 2, getProjection('CRS:84'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT_OPTIONS')).to.be('dpi:180');
    });

    it('extends FORMAT_OPTIONS if it is already present', function () {
      options.serverType = 'geoserver';
      options.params.FORMAT_OPTIONS = 'param1:value1';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 2, getProjection('CRS:84'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT_OPTIONS')).to.be('param1:value1;dpi:180');
    });

    it('rounds FORMAT_OPTIONS to an integer when the server is GeoServer', function () {
      options.serverType = 'geoserver';
      const source = new TileWMS(options);
      const tile = source.getTile(3, 2, 2, 1.325, getProjection('CRS:84'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT_OPTIONS')).to.be('dpi:119');
    });
  });

  describe('#tileUrlFunction', function () {
    it('can be used when obtained through #getTileUrlFunction', function () {
      options.extent = [-80, -40, -50, -10];
      const source = new TileWMS(options);
      const tileCoord = [3, 2, 2];
      expect(function () {
        source.getTileUrlFunction()(tileCoord, 1, getProjection('EPSG:4326'));
      }).to.not.throwException();
    });

    it('returns a tile if it is contained within layers extent', function () {
      options.extent = [-80, -40, -50, -10];
      const source = new TileWMS(options);
      const tileCoord = [3, 2, 2];
      const url = source.tileUrlFunction(
        tileCoord,
        1,
        getProjection('EPSG:4326')
      );
      const uri = new URL(url);
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('-45,-90,0,-45');
    });

    it('returns a tile if it intersects layers extent', function () {
      options.extent = [-80, -40, -40, -10];
      const source = new TileWMS(options);
      const tileCoord = [3, 3, 2];
      const url = source.tileUrlFunction(
        tileCoord,
        1,
        getProjection('EPSG:4326')
      );
      const uri = new URL(url);
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('-45,-45,0,0');
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
        getProjection('EPSG:4326')
      );
      const uri = new URL(url);
      const queryData = uri.searchParams;
      expect(queryData.get('WIDTH')).to.be('640');
      expect(queryData.get('HEIGHT')).to.be('320');
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
        {INFO_FORMAT: 'text/plain'}
      );
      const uri = new URL(url);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/wms');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      expect(bbox[0]).roughlyEqual(-10018754.171394622, 1e-9);
      expect(bbox[1]).roughlyEqual(-15028131.257091936, 1e-9);
      expect(bbox[2]).roughlyEqual(-5009377.085697311, 1e-9);
      expect(bbox[3]).roughlyEqual(-10018754.171394624, 1e-9);
      expect(queryData.get('CRS')).to.be('EPSG:3857');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('256');
      expect(queryData.get('I')).to.be('154');
      expect(queryData.get('J')).to.be('101');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('QUERY_LAYERS')).to.be('layer');
      expect(queryData.get('REQUEST')).to.be('GetFeatureInfo');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(null);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('true');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('256');
      expect(uri.hash.replace('#', '')).to.be.empty();
    });

    it("returns the expected GetFeatureInfo URL when source's projection is different from the parameter", function () {
      const source = new TileWMS(optionsReproj);
      source.pixelRatio_ = 1;
      const url = source.getFeatureInfoUrl(
        [-7000000, -12000000],
        19567.87924100512,
        getProjection('EPSG:3857'),
        {INFO_FORMAT: 'text/plain'}
      );
      const uri = new URL(url);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be(
        '-79.17133464081945,-90,-66.51326044311186,-45'
      );
      expect(queryData.get('CRS')).to.be('EPSG:4326');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('256');
      expect(queryData.get('I')).to.be('517');
      expect(queryData.get('J')).to.be('117');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('QUERY_LAYERS')).to.be('layer');
      expect(queryData.get('REQUEST')).to.be('GetFeatureInfo');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(null);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('true');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('256');
      expect(uri.hash.replace('#', '')).to.be.empty();
    });

    it('sets the QUERY_LAYERS param as expected', function () {
      const source = new TileWMS(options);
      source.pixelRatio_ = 1;
      const url = source.getFeatureInfoUrl(
        [-7000000, -12000000],
        19567.87924100512,
        getProjection('EPSG:3857'),
        {INFO_FORMAT: 'text/plain', QUERY_LAYERS: 'foo,bar'}
      );
      const uri = new URL(url);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/wms');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      expect(bbox[0]).roughlyEqual(-10018754.171394622, 1e-9);
      expect(bbox[1]).roughlyEqual(-15028131.257091936, 1e-9);
      expect(bbox[2]).roughlyEqual(-5009377.085697311, 1e-9);
      expect(bbox[3]).roughlyEqual(-10018754.171394624, 1e-9);
      expect(queryData.get('CRS')).to.be('EPSG:3857');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('256');
      expect(queryData.get('I')).to.be('154');
      expect(queryData.get('J')).to.be('101');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('QUERY_LAYERS')).to.be('foo,bar');
      expect(queryData.get('REQUEST')).to.be('GetFeatureInfo');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(null);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('true');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('256');
      expect(uri.hash.replace('#', '')).to.be.empty();
    });
  });

  describe('#getLegendGraphicUrl', function () {
    it('returns the getLegenGraphic url as expected', function () {
      const source = new TileWMS(options);
      const url = source.getLegendUrl(0.1);
      const uri = new URL(url);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('LAYER')).to.be('layer');
      expect(queryData.get('REQUEST')).to.be('GetLegendGraphic');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('SCALE')).to.be('357.14285714285717');
    });

    it('does not include SCALE if no resolution was provided', function () {
      const source = new TileWMS(options);
      const url = source.getLegendUrl();
      const uri = new URL(url);
      const queryData = uri.searchParams;
      expect(queryData.get('SCALE')).to.be(null);
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
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).to.be('FORMAT_VALUE');
      expect(queryData.get('LAYER')).to.be('LAYER_VALUE');
      expect(queryData.get('REQUEST')).to.be('GetLegendGraphic');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('SCALE')).to.be('357.14285714285717');
      expect(queryData.get('STYLE')).to.be('STYLE_VALUE');
      expect(queryData.get('FEATURETYPE')).to.be('FEATURETYPE_VALUE');
      expect(queryData.get('RULE')).to.be('RULE_VALUE');
      expect(queryData.get('SLD')).to.be('SLD_VALUE');
      expect(queryData.get('SLD_BODY')).to.be('SLD_BODY_VALUE');
      expect(queryData.get('FORMAT')).to.be('FORMAT_VALUE');
      expect(queryData.get('WIDTH')).to.be('WIDTH_VALUE');
      expect(queryData.get('HEIGHT')).to.be('HEIGHT_VALUE');
      expect(queryData.get('EXCEPTIONS')).to.be('EXCEPTIONS_VALUE');
      expect(queryData.get('LANGUAGE')).to.be('LANGUAGE_VALUE');
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
        getProjection('EPSG:4326')
      );
      expect(tileUrl.indexOf(url)).to.be(0);
    });
  });

  describe('#setUrls()', function () {
    it('updates the source key', function () {
      const source = new TileWMS({
        urls: ['u1', 'u2'],
      });
      const originalKey = source.getKey();
      source.setUrls(['u3', 'u4']);
      expect(source.getKey() !== originalKey).to.be(true);
    });
  });
});
