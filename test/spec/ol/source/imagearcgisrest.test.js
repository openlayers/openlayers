goog.provide('ol.test.source.ImageArcGISRest');

goog.require('ol.source.ImageArcGISRest');
goog.require('ol.proj');


describe('ol.source.ImageArcGISRest', function() {

  var pixelRatio, options, projection, proj3857, resolution;
  beforeEach(function() {
    pixelRatio = 1;
    projection = ol.proj.get('EPSG:4326');
    proj3857 = ol.proj.get('EPSG:3857');
    resolution = 0.1;
    options = {
      params: {},
      url: 'http://example.com/MapServer'
    };
  });

  describe('#getImage', function() {

    it('returns a image with the expected URL', function() {
      var source = new ol.source.ImageArcGISRest(options);
      var image = source.getImage([3, 2, -7, 1], resolution, pixelRatio, proj3857);
      var uri = new URL(image.src_);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/MapServer/export');
      var queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('5.5,2.25,-9.5,0.75');
      expect(queryData.get('FORMAT')).to.be('PNG32');
      expect(queryData.get('IMAGESR')).to.be('3857');
      expect(queryData.get('BBOXSR')).to.be('3857');
      expect(queryData.get('TRANSPARENT')).to.be('true');

    });

    it('returns a non floating point DPI value', function() {
      var source = new ol.source.ImageArcGISRest(options);
      var image = source.getImage([3, 2, -7, 1.12], resolution, pixelRatio, proj3857);
      var uri = new URL(image.src_);
      var queryData = uri.searchParams;
      expect(queryData.get('DPI')).to.be('90');
    });

    it('returns a image with the expected URL for ImageServer', function() {
      options.url = 'http://example.com/ImageServer';
      var source = new ol.source.ImageArcGISRest(options);
      var image = source.getImage([3, 2, -7, 1], resolution, pixelRatio, proj3857);
      var uri = new URL(image.src_);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/ImageServer/exportImage');
      var queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('5.5,2.25,-9.5,0.75');
      expect(queryData.get('FORMAT')).to.be('PNG32');
      expect(queryData.get('IMAGESR')).to.be('3857');
      expect(queryData.get('BBOXSR')).to.be('3857');
      expect(queryData.get('TRANSPARENT')).to.be('true');
    });

    it('allows various parameters to be overridden', function() {
      options.params.FORMAT = 'png';
      options.params.TRANSPARENT = false;
      var source = new ol.source.ImageArcGISRest(options);
      var image = source.getImage([3, 2, -3, 1], resolution, pixelRatio, projection);
      var uri = new URL(image.src_);
      var queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).to.be('png');
      expect(queryData.get('TRANSPARENT')).to.be('false');
    });

    it('allows adding rest option', function() {
      options.params.LAYERS = 'show:1,3,4';
      var source = new ol.source.ImageArcGISRest(options);
      var image = source.getImage([3, 2, -3, 1], resolution, pixelRatio, proj3857);
      var uri = new URL(image.src_);
      var queryData = uri.searchParams;
      expect(queryData.get('LAYERS')).to.be('show:1,3,4');
    });
  });

  describe('#updateParams', function() {

    it('add a new param', function() {
      var source = new ol.source.ImageArcGISRest(options);
      source.updateParams({'TEST': 'value'});

      var image = source.getImage([3, 2, -7, 1], resolution, pixelRatio, proj3857);
      var uri = new URL(image.src_);
      var queryData = uri.searchParams;
      expect(queryData.get('TEST')).to.be('value');
    });

    it('updates an existing param', function() {
      options.params.TEST = 'value';

      var source = new ol.source.ImageArcGISRest(options);
      source.updateParams({'TEST':'newValue'});

      var image = source.getImage([3, 2, -7, 1], resolution, pixelRatio, proj3857);
      var uri = new URL(image.src_);
      var queryData = uri.searchParams;
      expect(queryData.get('TEST')).to.be('newValue');
    });

  });

  describe('#getParams', function() {

    it('verify getting a param', function() {
      options.params.TEST = 'value';
      var source = new ol.source.ImageArcGISRest(options);

      var setParams = source.getParams();

      expect(setParams).to.eql({TEST: 'value'});
    });

    it('verify on adding a param', function() {
      options.params.TEST = 'value';

      var source = new ol.source.ImageArcGISRest(options);
      source.updateParams({'TEST2':'newValue'});

      var setParams = source.getParams();

      expect(setParams).to.eql({TEST:'value', TEST2:'newValue'});
    });

    it('verify on update a param', function() {
      options.params.TEST = 'value';

      var source = new ol.source.ImageArcGISRest(options);
      source.updateParams({'TEST':'newValue'});

      var setParams = source.getParams();

      expect(setParams).to.eql({TEST:'newValue'});
    });

  });

  describe('#getUrl', function() {

    it('verify getting url', function() {
      options.url = 'http://test.com/MapServer';

      var source = new ol.source.ImageArcGISRest(options);

      var url = source.getUrl();

      expect(url).to.eql('http://test.com/MapServer');
    });


  });

  describe('#setUrl', function() {

    it('verify setting url when not set yet', function() {

      var source = new ol.source.ImageArcGISRest(options);
      source.setUrl('http://test.com/MapServer');

      var url = source.getUrl();

      expect(url).to.eql('http://test.com/MapServer');
    });

    it('verify setting url with existing url', function() {
      options.url = 'http://test.com/MapServer';

      var source = new ol.source.ImageArcGISRest(options);
      source.setUrl('http://test2.com/MapServer');

      var url = source.getUrl();

      expect(url).to.eql('http://test2.com/MapServer');
    });
  });


});
