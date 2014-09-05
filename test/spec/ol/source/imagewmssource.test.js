goog.provide('ol.test.source.ImageWMS');


describe('ol.source.ImageWMS', function() {

  var extent, pixelRatio, options, projection, resolution;
  beforeEach(function() {
    extent = [10, 20, 30, 40];
    pixelRatio = 1;
    projection = ol.proj.get('EPSG:4326');
    resolution = 0.1;
    options = {
      params: {
        'LAYERS': 'layer'
      },
      ratio: 1,
      url: 'http://example.com/wms'
    };
  });

  describe('#getImage', function() {

    it('returns the expected image URL', function() {
      var source = new ol.source.ImageWMS(options);
      var image = source.getImage(extent, resolution, pixelRatio, projection);
      var uri = new goog.Uri(image.src_);
      expect(uri.getScheme()).to.be('http');
      expect(uri.getDomain()).to.be('example.com');
      expect(uri.getPath()).to.be('/wms');
      var queryData = uri.getQueryData();
      expect(queryData.get('BBOX')).to.be('20,10,40,30');
      expect(queryData.get('CRS')).to.be('EPSG:4326');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('200');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('REQUEST')).to.be('GetMap');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(undefined);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('true');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('200');
      expect(uri.getFragment()).to.be.empty();
    });

    it('sets the SRS query value instead of CRS if version < 1.3', function() {
      options.params.VERSION = '1.2';
      var source = new ol.source.ImageWMS(options);
      var image = source.getImage(extent, resolution, pixelRatio, projection);
      var uri = new goog.Uri(image.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('CRS')).to.be(undefined);
      expect(queryData.get('SRS')).to.be('EPSG:4326');
    });

    it('allows various parameters to be overridden', function() {
      options.params.FORMAT = 'image/jpeg';
      options.params.TRANSPARENT = false;
      var source = new ol.source.ImageWMS(options);
      var image = source.getImage(extent, resolution, pixelRatio, projection);
      var uri = new goog.Uri(image.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('FORMAT')).to.be('image/jpeg');
      expect(queryData.get('TRANSPARENT')).to.be('false');
    });

    it('does not add a STYLES= option if one is specified', function() {
      options.params.STYLES = 'foo';
      var source = new ol.source.ImageWMS(options);
      var image = source.getImage(extent, resolution, pixelRatio, projection);
      var uri = new goog.Uri(image.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('STYLES')).to.be('foo');
    });

    it('changes the BBOX order for EN axis orientations', function() {
      var source = new ol.source.ImageWMS(options);
      projection = ol.proj.get('CRS:84');
      var image = source.getImage(extent, resolution, pixelRatio, projection);
      var uri = new goog.Uri(image.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('BBOX')).to.be('10,20,30,40');
    });

    it('uses EN BBOX order if version < 1.3', function() {
      options.params.VERSION = '1.1.0';
      var source = new ol.source.ImageWMS(options);
      var image =
          source.getImage(extent, resolution, pixelRatio, projection);
      var uri = new goog.Uri(image.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('BBOX')).to.be('10,20,30,40');
    });

    it('sets MAP_RESOLUTION when the server is MapServer', function() {
      options.serverType = ol.source.wms.ServerType.MAPSERVER;
      var source = new ol.source.ImageWMS(options);
      pixelRatio = 2;
      var image = source.getImage(extent, resolution, pixelRatio, projection);
      var uri = new goog.Uri(image.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('MAP_RESOLUTION')).to.be('180');
    });

    it('sets FORMAT_OPTIONS when the server is GeoServer', function() {
      options.serverType = ol.source.wms.ServerType.GEOSERVER;
      var source = new ol.source.ImageWMS(options);
      pixelRatio = 2;
      var image = source.getImage(extent, resolution, pixelRatio, projection);
      var uri = new goog.Uri(image.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('FORMAT_OPTIONS')).to.be('dpi:180');
    });

    it('rounds FORMAT_OPTIONS to an integer when the server is GeoServer',
       function() {
         options.serverType = ol.source.wms.ServerType.GEOSERVER;
         var source = new ol.source.ImageWMS(options);
         pixelRatio = 1.325;
         var image =
             source.getImage(extent, resolution, pixelRatio, projection);
         var uri = new goog.Uri(image.src_);
         var queryData = uri.getQueryData();
         expect(queryData.get('FORMAT_OPTIONS')).to.be('dpi:119');
       });

    it('sets DPI when the server is QGIS', function() {
      options.serverType = ol.source.wms.ServerType.QGIS;
      var source = new ol.source.ImageWMS(options);
      pixelRatio = 2;
      var image = source.getImage(extent, resolution, pixelRatio, projection);
      var uri = new goog.Uri(image.src_);
      var queryData = uri.getQueryData();
      expect(queryData.get('DPI')).to.be('180');
    });

  });

  describe('#getGetFeatureInfo', function() {

    it('returns the expected GetFeatureInfo URL', function() {
      var source = new ol.source.ImageWMS(options);
      var url = source.getGetFeatureInfoUrl(
          [20, 30], resolution, projection,
          {INFO_FORMAT: 'text/plain'});
      var uri = new goog.Uri(url);
      expect(uri.getScheme()).to.be('http');
      expect(uri.getDomain()).to.be('example.com');
      expect(uri.getPath()).to.be('/wms');
      var queryData = uri.getQueryData();
      expect(queryData.get('BBOX')).to.be('24.95,14.95,35.05,25.05');
      expect(queryData.get('CRS')).to.be('EPSG:4326');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('101');
      expect(queryData.get('I')).to.be('50');
      expect(queryData.get('J')).to.be('50');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('QUERY_LAYERS')).to.be('layer');
      expect(queryData.get('REQUEST')).to.be('GetFeatureInfo');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(undefined);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('true');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('101');
      expect(uri.getFragment()).to.be.empty();
    });

    it('sets the QUERY_LAYERS param as expected', function() {
      var source = new ol.source.ImageWMS(options);
      var url = source.getGetFeatureInfoUrl(
          [20, 30], resolution, projection,
          {INFO_FORMAT: 'text/plain', QUERY_LAYERS: 'foo,bar'});
      var uri = new goog.Uri(url);
      expect(uri.getScheme()).to.be('http');
      expect(uri.getDomain()).to.be('example.com');
      expect(uri.getPath()).to.be('/wms');
      var queryData = uri.getQueryData();
      expect(queryData.get('BBOX')).to.be('24.95,14.95,35.05,25.05');
      expect(queryData.get('CRS')).to.be('EPSG:4326');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('101');
      expect(queryData.get('I')).to.be('50');
      expect(queryData.get('J')).to.be('50');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('QUERY_LAYERS')).to.be('foo,bar');
      expect(queryData.get('REQUEST')).to.be('GetFeatureInfo');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(undefined);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('true');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('101');
      expect(uri.getFragment()).to.be.empty();
    });
  });

});


goog.require('goog.Uri');
goog.require('ol.source.ImageWMS');
goog.require('ol.proj');
goog.require('ol.source.wms.ServerType');
