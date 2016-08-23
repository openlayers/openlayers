goog.provide('ol.test.source.TileWMS');

goog.require('ol.ImageTile');
goog.require('ol.proj');
goog.require('ol.source.TileWMS');
goog.require('ol.tilegrid');
goog.require('ol.tilegrid.TileGrid');


describe('ol.source.TileWMS', function() {

  var options;
  beforeEach(function() {
    options = {
      params: {
        'LAYERS': 'layer'
      },
      url: 'http://example.com/wms'
    };
  });

  describe('constructor', function() {
    it('can be constructed without url or urls params', function() {
      var source = new ol.source.TileWMS({
        projection: 'EPSG:3857',
        tileGrid: ol.tilegrid.createXYZ({maxZoom: 6})
      });
      expect(source).to.be.an(ol.source.TileWMS);
    });
  });

  describe('#getTile', function() {

    it('returns a tile with the expected URL', function() {
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, -7, 1, ol.proj.get('EPSG:3857'));
      expect(tile).to.be.an(ol.ImageTile);
      var uri = new URL(tile.src_);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/wms');
      var queryData = uri.searchParams;
      var bbox = queryData.get('BBOX').split(',').map(parseFloat);
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

    it('returns a larger tile when a gutter is specified', function() {
      options.gutter = 16;
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, -7, 1, ol.proj.get('EPSG:3857'));
      expect(tile).to.be.an(ol.ImageTile);
      var uri = new URL(tile.src_);
      var queryData = uri.searchParams;
      var bbox = queryData.get('BBOX').split(',');
      var expected = [-10331840.239250705, -15341217.324948018,
        -4696291.017841229, -9705668.103538541];
      for (var i = 0, ii = bbox.length; i < ii; ++i) {
        expect(parseFloat(bbox[i])).to.roughlyEqual(expected[i], 1e-9);
      }
      expect(queryData.get('HEIGHT')).to.be('288');
      expect(queryData.get('WIDTH')).to.be('288');
    });

    it('sets the SRS query value instead of CRS if version < 1.3', function() {
      options.params.VERSION = '1.2';
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, -3, 1, ol.proj.get('EPSG:4326'));
      var uri = new URL(tile.src_);
      var queryData = uri.searchParams;
      expect(queryData.get('CRS')).to.be(null);
      expect(queryData.get('SRS')).to.be('EPSG:4326');
    });

    it('allows various parameters to be overridden', function() {
      options.params.FORMAT = 'image/jpeg';
      options.params.TRANSPARENT = false;
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, -3, 1, ol.proj.get('EPSG:4326'));
      var uri = new URL(tile.src_);
      var queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).to.be('image/jpeg');
      expect(queryData.get('TRANSPARENT')).to.be('false');
    });

    it('does not add a STYLES= option if one is specified', function() {
      options.params.STYLES = 'foo';
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, -3, 1, ol.proj.get('EPSG:4326'));
      var uri = new URL(tile.src_);
      var queryData = uri.searchParams;
      expect(queryData.get('STYLES')).to.be('foo');
    });

    it('changes the BBOX order for EN axis orientations', function() {
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, -3, 1, ol.proj.get('EPSG:4326'));
      var uri = new URL(tile.src_);
      var queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('-45,-90,0,-45');
    });

    it('uses EN BBOX order if version < 1.3', function() {
      options.params.VERSION = '1.1.0';
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, -3, 1, ol.proj.get('CRS:84'));
      var uri = new URL(tile.src_);
      var queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('-90,-45,-45,0');
    });

    it('sets FORMAT_OPTIONS when the server is GeoServer', function() {
      options.serverType = 'geoserver';
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, -3, 2, ol.proj.get('CRS:84'));
      var uri = new URL(tile.src_);
      var queryData = uri.searchParams;
      expect(queryData.get('FORMAT_OPTIONS')).to.be('dpi:180');
    });

    it('extends FORMAT_OPTIONS if it is already present', function() {
      options.serverType = 'geoserver';
      var source = new ol.source.TileWMS(options);
      options.params.FORMAT_OPTIONS = 'param1:value1';
      var tile = source.getTile(3, 2, -3, 2, ol.proj.get('CRS:84'));
      var uri = new URL(tile.src_);
      var queryData = uri.searchParams;
      expect(queryData.get('FORMAT_OPTIONS')).to.be('param1:value1;dpi:180');
    });

    it('rounds FORMAT_OPTIONS to an integer when the server is GeoServer',
       function() {
         options.serverType = 'geoserver';
         var source = new ol.source.TileWMS(options);
         var tile = source.getTile(3, 2, -3, 1.325, ol.proj.get('CRS:84'));
         var uri = new URL(tile.src_);
         var queryData = uri.searchParams;
         expect(queryData.get('FORMAT_OPTIONS')).to.be('dpi:119');
       });

  });

  describe('#tileUrlFunction', function() {

    it('returns a tile if it is contained within layers extent', function() {
      options.extent = [-80, -40, -50, -10];
      var source = new ol.source.TileWMS(options);
      var tileCoord = [3, 2, -3];
      var url = source.tileUrlFunction(tileCoord, 1, ol.proj.get('EPSG:4326'));
      var uri = new URL(url);
      var queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('-45,-90,0,-45');
    });

    it('returns a tile if it intersects layers extent', function() {
      options.extent = [-80, -40, -40, -10];
      var source = new ol.source.TileWMS(options);
      var tileCoord = [3, 3, -3];
      var url = source.tileUrlFunction(tileCoord, 1, ol.proj.get('EPSG:4326'));
      var uri = new URL(url);
      var queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('-45,-45,0,0');
    });

    it('works with non-square tiles', function() {
      options.tileGrid = new ol.tilegrid.TileGrid({
        tileSize: [640, 320],
        resolutions: [1.40625, 0.703125, 0.3515625, 0.17578125],
        origin: [-180, -90]
      });
      var source = new ol.source.TileWMS(options);
      var tileCoord = [3, 3, -3];
      var url = source.tileUrlFunction(tileCoord, 1, ol.proj.get('EPSG:4326'));
      var uri = new URL(url);
      var queryData = uri.searchParams;
      expect(queryData.get('WIDTH')).to.be('640');
      expect(queryData.get('HEIGHT')).to.be('320');
    });

  });

  describe('#getGetFeatureInfo', function() {

    it('returns the expected GetFeatureInfo URL', function() {
      var source = new ol.source.TileWMS(options);
      source.pixelRatio_ = 1;
      var url = source.getGetFeatureInfoUrl(
          [-7000000, -12000000],
          19567.87924100512, ol.proj.get('EPSG:3857'),
          {INFO_FORMAT: 'text/plain'});
      var uri = new URL(url);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/wms');
      var queryData = uri.searchParams;
      var bbox = queryData.get('BBOX').split(',').map(parseFloat);
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

    it('sets the QUERY_LAYERS param as expected', function() {
      var source = new ol.source.TileWMS(options);
      source.pixelRatio_ = 1;
      var url = source.getGetFeatureInfoUrl(
          [-7000000, -12000000],
          19567.87924100512, ol.proj.get('EPSG:3857'),
          {INFO_FORMAT: 'text/plain', QUERY_LAYERS: 'foo,bar'});
      var uri = new URL(url);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/wms');
      var queryData = uri.searchParams;
      var bbox = queryData.get('BBOX').split(',').map(parseFloat);
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

  describe('#setUrl()', function() {
    it('sets the correct url', function() {
      var source = new ol.source.TileWMS(options);
      var url = 'http://foo/';
      source.setUrl(url);
      var tileUrl = source.tileUrlFunction([0, 0, 0], 1, ol.proj.get('EPSG:4326'));
      expect(tileUrl.indexOf(url)).to.be(0);
    });
  });

  describe('#setUrls()', function() {
    it ('resets coordKeyPrefix_', function() {
      var urls = ['u1', 'u2'];
      var source1 = new ol.source.TileWMS({
        urls: urls
      });
      var source2 = new ol.source.TileWMS({});
      expect(source2.coordKeyPrefix_).to.be.empty();
      source2.setUrls(urls);
      expect(source2.coordKeyPrefix_).to.equal(source1.coordKeyPrefix_);
    });
  });
});
