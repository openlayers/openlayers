goog.provide('ol.test.source.TileWMS');


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

  describe('#getTile', function() {

    it('returns a tile with the expected URL', function() {
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, 1, 1, ol.proj.get('EPSG:3857'));
      expect(tile).to.be.an(ol.ImageTile);
      var uri = new goog.Uri(tile.src_);
      expect(uri.getScheme()).to.be('http');
      expect(uri.getDomain()).to.be('example.com');
      expect(uri.getPath()).to.be('/wms');
      var queryData = uri.getQueryData();
      expect(queryData.get('BBOX')).to.be(
          '-10018754.171394622,-15028131.257091932,' +
          '-5009377.085697311,-10018754.17139462');
      expect(queryData.get('CRS')).to.be('EPSG:3857');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('256');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('REQUEST')).to.be('GetMap');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(undefined);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('true');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('256');
      expect(uri.getFragment()).to.be.empty();
    });

    it('returns a larger tile when a gutter is specified', function() {
      options.gutter = 16;
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, 1, 1, ol.proj.get('EPSG:3857'));
      expect(tile).to.be.an(ol.ImageTile);
      var uri = new goog.Uri(tile.src_);
      var queryData = uri.getQueryData();
      var bbox = queryData.get('BBOX').split(',');
      var expected = [-10331840.239250705, -15341217.324948015,
        -4696291.017841229, -9705668.103538537];
      for (var i = 0, ii = bbox.length; i < ii; ++i) {
        expect(parseFloat(bbox[i])).to.roughlyEqual(expected[i], 1e-9);
      }
      expect(queryData.get('HEIGHT')).to.be('288');
      expect(queryData.get('WIDTH')).to.be('288');
    });

    it('sets the SRS query value instead of CRS if version < 1.3', function() {
      options.params.VERSION = '1.2';
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, 1, 1, ol.proj.get('EPSG:4326'));
      var uri = new goog.Uri(tile.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('CRS')).to.be(undefined);
      expect(queryData.get('SRS')).to.be('EPSG:4326');
    });

    it('allows various parameters to be overridden', function() {
      options.params.FORMAT = 'image/jpeg';
      options.params.TRANSPARENT = false;
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, 1, 1, ol.proj.get('EPSG:4326'));
      var uri = new goog.Uri(tile.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('FORMAT')).to.be('image/jpeg');
      expect(queryData.get('TRANSPARENT')).to.be('false');
    });

    it('does not add a STYLES= option if one is specified', function() {
      options.params.STYLES = 'foo';
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, 1, 1, ol.proj.get('EPSG:4326'));
      var uri = new goog.Uri(tile.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('STYLES')).to.be('foo');
    });

    it('changes the BBOX order for EN axis orientations', function() {
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, 1, 1, ol.proj.get('EPSG:4326'));
      var uri = new goog.Uri(tile.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('BBOX')).to.be('-45,-90,0,-45');
    });

    it('uses EN BBOX order if version < 1.3', function() {
      options.params.VERSION = '1.1.0';
      var source = new ol.source.TileWMS(options);
      var tile = source.getTile(3, 2, 1, 1, ol.proj.get('CRS:84'));
      var uri = new goog.Uri(tile.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('BBOX')).to.be('-90,-45,-45,0');
    });

  });

  describe('#tileUrlFunction', function() {

    it('returns a tile if it is contained within layers extent', function() {
      options.extent = [-80, -40, -50, -10];
      var source = new ol.source.TileWMS(options);
      var tileCoord = [3, 2, 1];
      var url = source.tileUrlFunction(tileCoord, 1, ol.proj.get('EPSG:4326'));
      var uri = new goog.Uri(url);
      var queryData = uri.getQueryData();
      expect(queryData.get('BBOX')).to.be('-45,-90,0,-45');
    });

    it('returns a tile if it intersects layers extent', function() {
      options.extent = [-80, -40, -40, -10];
      var source = new ol.source.TileWMS(options);
      var tileCoord = [3, 3, 1];
      var url = source.tileUrlFunction(tileCoord, 1, ol.proj.get('EPSG:4326'));
      var uri = new goog.Uri(url);
      var queryData = uri.getQueryData();
      expect(queryData.get('BBOX')).to.be('-45,-45,0,0');
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
      var uri = new goog.Uri(url);
      expect(uri.getScheme()).to.be('http');
      expect(uri.getDomain()).to.be('example.com');
      expect(uri.getPath()).to.be('/wms');
      var queryData = uri.getQueryData();
      expect(queryData.get('BBOX')).to.be(
          '-10018754.171394622,-15028131.257091932,' +
          '-5009377.085697311,-10018754.17139462');
      expect(queryData.get('CRS')).to.be('EPSG:3857');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('256');
      expect(queryData.get('I')).to.be('154');
      expect(queryData.get('J')).to.be('101');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('QUERY_LAYERS')).to.be('layer');
      expect(queryData.get('REQUEST')).to.be('GetFeatureInfo');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(undefined);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('true');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('256');
      expect(uri.getFragment()).to.be.empty();
    });

    it('sets the QUERY_LAYERS param as expected', function() {
      var source = new ol.source.TileWMS(options);
      source.pixelRatio_ = 1;
      var url = source.getGetFeatureInfoUrl(
          [-7000000, -12000000],
          19567.87924100512, ol.proj.get('EPSG:3857'),
          {INFO_FORMAT: 'text/plain', QUERY_LAYERS: 'foo,bar'});
      var uri = new goog.Uri(url);
      expect(uri.getScheme()).to.be('http');
      expect(uri.getDomain()).to.be('example.com');
      expect(uri.getPath()).to.be('/wms');
      var queryData = uri.getQueryData();
      expect(queryData.get('BBOX')).to.be(
          '-10018754.171394622,-15028131.257091932,' +
          '-5009377.085697311,-10018754.17139462');
      expect(queryData.get('CRS')).to.be('EPSG:3857');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('256');
      expect(queryData.get('I')).to.be('154');
      expect(queryData.get('J')).to.be('101');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('QUERY_LAYERS')).to.be('foo,bar');
      expect(queryData.get('REQUEST')).to.be('GetFeatureInfo');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(undefined);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('true');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('256');
      expect(uri.getFragment()).to.be.empty();
      expect(uri.getFragment()).to.be.empty();
    });
  });
});


goog.require('goog.Uri');
goog.require('ol.ImageTile');
goog.require('ol.source.TileWMS');
goog.require('ol.proj');
