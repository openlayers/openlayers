goog.provide('ol.test.source.WMTS');

describe('ol.source.WMTS', function() {

  describe('when creating options from capabilities', function() {
    var parser = new ol.format.WMTSCapabilities();
    var capabilities;
    before(function(done) {
      afterLoadText('spec/ol/format/wmts/ogcsample.xml', function(xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can create KVP options from spec/ol/format/wmts/ogcsample.xml',
        function() {
          var options = ol.source.WMTS.optionsFromCapabilities(
              capabilities,
              { layer: 'BlueMarbleNextGeneration', matrixSet: 'google3857' });

          expect(options.urls).to.be.an('array');
          expect(options.urls).to.have.length(1);
          expect(options.urls[0]).to.be.eql(
              'http://www.maps.bob/cgi-bin/MiraMon5_0.cgi?');

          expect(options.layer).to.be.eql('BlueMarbleNextGeneration');

          expect(options.matrixSet).to.be.eql('google3857');

          expect(options.format).to.be.eql('image/jpeg');

          expect(options.projection).to.be.a(ol.proj.Projection);
          expect(options.projection).to.be.eql(ol.proj.get('EPSG:3857'));

          expect(options.requestEncoding).to.be.eql('KVP');

          expect(options.tileGrid).to.be.a(ol.tilegrid.WMTS);

          expect(options.style).to.be.eql('DarkBlue');

          expect(options.dimensions).to.eql({});

        });

    it('can create REST options from spec/ol/format/wmts/ogcsample.xml',
        function() {
          var options = ol.source.WMTS.optionsFromCapabilities(
              capabilities,
              { layer: 'BlueMarbleNextGeneration', matrixSet: 'google3857',
                requestEncoding: 'REST' });

          expect(options.urls).to.be.an('array');
          expect(options.urls).to.have.length(1);
          expect(options.urls[0]).to.be.eql(
              'http://www.example.com/wmts/coastlines/{TileMatrix}/{TileRow}/{TileCol}.png');

          expect(options.layer).to.be.eql('BlueMarbleNextGeneration');

          expect(options.matrixSet).to.be.eql('google3857');

          expect(options.format).to.be.eql('image/png');

          expect(options.projection).to.be.a(ol.proj.Projection);
          expect(options.projection).to.be.eql(ol.proj.get('EPSG:3857'));

          expect(options.requestEncoding).to.be.eql('REST');

          expect(options.tileGrid).to.be.a(ol.tilegrid.WMTS);

          expect(options.style).to.be.eql('DarkBlue');

          expect(options.dimensions).to.eql({});

        });

    it('can create getFeatureInfoOptions from ' +
        'spec/ol/format/wmts/ogcsample.xml', function() {
          var options;
          options = ol.source.WMTS.optionsFromCapabilities(
              capabilities,
              { layer: 'BlueMarbleNextGeneration', matrixSet: 'google3857' });

          expect(options.urls).to.be.an('array');
          expect(options.urls).to.have.length(1);
          expect(options.urls[0]).to.be.eql(
              'http://www.maps.bob/cgi-bin/MiraMon5_0.cgi?');

          expect(options.layer).to.be.eql('BlueMarbleNextGeneration');

          expect(options.matrixSet).to.be.eql('google3857');

          expect(options.format).to.be.eql('image/jpeg');

          expect(options.projection).to.be.a(ol.proj.Projection);
          expect(options.projection).to.be.eql(ol.proj.get('EPSG:3857'));

          expect(options.requestEncoding).to.be.eql('KVP');

          expect(options.getFeatureInfoOptions).to.be.an('object');
          expect(options.getFeatureInfoOptions.url).to.be.eql(
              'http://www.example.com/wmts/coastlines/{TileMatrixSet}/' +
              '{TileMatrix}/{TileRow}/{TileCol}/{J}/{I}.xml');
          expect(options.getFeatureInfoOptions.requestEncoding).to.be.eql(
              'REST');
          expect(options.getFeatureInfoOptions.infoFormat).to.be.eql(
              'application/gml+xml; version=3.1');

          expect(options.tileGrid).to.be.a(ol.tilegrid.WMTS);

          expect(options.style).to.be.eql('DarkBlue');

          expect(options.dimensions).to.eql({});

        });
  });

  describe('when creating tileUrlFunction', function() {

    it('can replace lowercase REST parameters',
        function() {
          var source = new ol.source.WMTS({
            layer: 'layer',
            style: 'default',
            urls: ['http://www.example.com/wmts/coastlines/{layer}/{style}/' +
             '{tilematrixset}/{TileMatrix}/{TileCol}/{TileRow}.jpg'],
            matrixSet: 'EPSG:3857',
            requestEncoding: 'REST',
            tileGrid: new ol.tilegrid.WMTS({
              origin: [-20037508.342789244, 20037508.342789244],
              resolutions: [559082264.029 * 0.28E-3,
                279541132.015 * 0.28E-3,
                139770566.007 * 0.28E-3],
              matrixIds: [0, 1, 2]
            })
          });

          var projection = ol.proj.get('EPSG:3857');
          var url = source.tileUrlFunction.call(source,
             [1, 1, -2], 1, projection);
          expect(url).to.be.eql('http://www.example.com/wmts/coastlines/' +
             'layer/default/EPSG:3857/1/1/1.jpg');

        });

    it('can replace camelcase REST parameters',
        function() {
          var source = new ol.source.WMTS({
            layer: 'layer',
            style: 'default',
            urls: ['http://www.example.com/wmts/coastlines/{Layer}/{Style}/' +
             '{tilematrixset}/{TileMatrix}/{TileCol}/{TileRow}.jpg'],
            matrixSet: 'EPSG:3857',
            requestEncoding: 'REST',
            tileGrid: new ol.tilegrid.WMTS({
              origin: [-20037508.342789244, 20037508.342789244],
              resolutions: [559082264.029 * 0.28E-3,
                279541132.015 * 0.28E-3,
                139770566.007 * 0.28E-3],
              matrixIds: [0, 1, 2]
            })
          });

          var projection = ol.proj.get('EPSG:3857');
          var url = source.tileUrlFunction.call(source,
             [1, 1, -2], 1, projection);
          expect(url).to.be.eql('http://www.example.com/wmts/coastlines/' +
             'layer/default/EPSG:3857/1/1/1.jpg');

        });
  });

  describe('when creating options from Esri capabilities', function() {
    var parser = new ol.format.WMTSCapabilities();
    var capabilities;
    before(function(done) {
      afterLoadText('spec/ol/format/wmts/arcgis.xml', function(xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can create KVP options from spec/ol/format/wmts/arcgis.xml',
        function() {
          var options = ol.source.WMTS.optionsFromCapabilities(
              capabilities, {
                layer: 'Demographics_USA_Population_Density',
                matrixSet: 'default028mm'
              });

          expect(options.urls).to.be.an('array');
          expect(options.urls).to.have.length(1);
          expect(options.urls[0]).to.be.eql(
             'http://services.arcgisonline.com/arcgis/rest/services/' +
             'Demographics/USA_Population_Density/MapServer/WMTS?');
        });
  });

  describe('#getUrls', function() {

    var sourceOptions;
    var source;

    beforeEach(function() {
      sourceOptions = {
        layer: 'layer',
        style: 'default',
        matrixSet: 'foo',
        requestEncoding: 'REST',
        tileGrid: new ol.tilegrid.WMTS({
          origin: [0, 0],
          resolutions: [],
          matrixIds: []
        })
      };
    });

    describe('using a "url" option', function() {
      beforeEach(function() {
        sourceOptions.url = 'some_wmts_url';
        source = new ol.source.WMTS(sourceOptions);
      });

      it('returns the WMTS URLs', function() {
        var urls = source.getUrls();
        expect(urls).to.be.eql(['some_wmts_url']);
      });

    });

    describe('using a "urls" option', function() {
      beforeEach(function() {
        sourceOptions.urls = ['some_wmts_url1', 'some_wmts_url2'];
        source = new ol.source.WMTS(sourceOptions);
      });

      it('returns the WMTS URLs', function() {
        var urls = source.getUrls();
        expect(urls).to.be.eql(['some_wmts_url1', 'some_wmts_url2']);
      });

    });

  });

  describe('#getRequestEncoding', function() {

    var source;

    beforeEach(function() {
      source = new ol.source.WMTS({
        layer: 'layer',
        style: 'default',
        matrixSet: 'foo',
        requestEncoding: 'REST',
        tileGrid: new ol.tilegrid.WMTS({
          origin: [0, 0],
          resolutions: [],
          matrixIds: []
        })
      });
    });

    it('returns the request encoding', function() {
      var requestEncoding = source.getRequestEncoding();
      expect(requestEncoding).to.be.eql('REST');
    });

  });

  describe('when retrieving GetFeatureInfo url', function() {
    it('can get url without defining getFeatureInfoOptions',
        function() {
          var source = new ol.source.WMTS({
            layer: 'layer',
            style: 'default',
            urls: ['http://www.example.com/wmts/coastlines'],
            matrixSet: 'EPSG:3857',
            tileGrid: new ol.tilegrid.WMTS({
              origin: [-20037508.342789244, 20037508.342789244],
              resolutions: [559082264.029 * 0.28E-3,
                279541132.015 * 0.28E-3,
                139770566.007 * 0.28E-3],
              matrixIds: [0, 1, 2]
            })
          });

          var url = source.getGetFeatureInfoUrl([1, -2], 78271.516,
             ol.proj.get('EPSG:3857'), 'text/html');
          expect(url).to.be.eql('http://www.example.com/wmts/coastlines' +
             '?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetFeatureInfo&LAYER=layer' +
             '&STYLE=default&FORMAT=image%2Fjpeg&TileCol=1&TileRow=1' +
             '&TileMatrix=1&TileMatrixSet=EPSG%3A3857&' +
             'INFOFORMAT=text%2Fhtml&I=0&J=0');
        });

    it('can get url without defining request encoding in getFeatureInfoOptions',
        function() {
          var source = new ol.source.WMTS({
            layer: 'layer',
            style: 'default',
            urls: ['http://www.example.com/wmts/coastlines'],
            matrixSet: 'EPSG:3857',
            getFeatureInfoOptions: {
              url: 'http://www.example.com/wmts/coastlines/featureinfo/',
              infoFormat: 'text/html'
            },
            tileGrid: new ol.tilegrid.WMTS({
              origin: [-20037508.342789244, 20037508.342789244],
              resolutions: [559082264.029 * 0.28E-3,
                279541132.015 * 0.28E-3,
                139770566.007 * 0.28E-3],
              matrixIds: [0, 1, 2]
            })
          });

          var url = source.getGetFeatureInfoUrl([1, -2], 78271.516,
             ol.proj.get('EPSG:3857'));
          expect(url).to.be.eql('http://www.example.com/wmts/coastlines/' +
             'featureinfo/?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetFeatureInfo' +
             '&LAYER=layer&STYLE=default&FORMAT=image%2Fjpeg&TileCol=1' +
             '&TileRow=1&TileMatrix=1&TileMatrixSet=EPSG%3A3857' +
             '&INFOFORMAT=text%2Fhtml&I=0&J=0');
        });

    it('can get KVP url from getFeatureInfoOptions',
        function() {
          var source = new ol.source.WMTS({
            layer: 'layer',
            style: 'default',
            urls: ['http://www.example.com/wmts/coastlines'],
            matrixSet: 'EPSG:3857',
            getFeatureInfoOptions: {
              url: 'http://www.example.com/wmts/coastlines/featureinfo/',
              requestEncoding: 'KVP',
              infoFormat: 'text/html'
            },
            tileGrid: new ol.tilegrid.WMTS({
              origin: [-20037508.342789244, 20037508.342789244],
              resolutions: [559082264.029 * 0.28E-3,
                279541132.015 * 0.28E-3,
                139770566.007 * 0.28E-3],
              matrixIds: [0, 1, 2]
            })
          });

          var url = source.getGetFeatureInfoUrl([1, -2], 78271.516,
             ol.proj.get('EPSG:3857'));
          expect(url).to.be.eql('http://www.example.com/wmts/coastlines/' +
             'featureinfo/?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetFeatureInfo' +
             '&LAYER=layer&STYLE=default&FORMAT=image%2Fjpeg&TileCol=1' +
             '&TileRow=1&TileMatrix=1&TileMatrixSet=EPSG%3A3857' +
             '&INFOFORMAT=text%2Fhtml&I=0&J=0');
        });

    it('can get REST url from getFeatureInfoOptions',
        function() {
          var source = new ol.source.WMTS({
            layer: 'layer',
            style: 'default',
            urls: ['http://www.example.com/wmts/coastlines'],
            matrixSet: 'EPSG:3857',
            getFeatureInfoOptions: {
              url: 'http://www.example.com/wmts/coastlines/featureinfo/' +
                 '{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}/{I}/{J}.html',
              requestEncoding: 'REST',
              infoFormat: 'text/html'
            },
            tileGrid: new ol.tilegrid.WMTS({
              origin: [-20037508.342789244, 20037508.342789244],
              resolutions: [559082264.029 * 0.28E-3,
                279541132.015 * 0.28E-3,
                139770566.007 * 0.28E-3],
              matrixIds: [0, 1, 2]
            })
          });

          var url = source.getGetFeatureInfoUrl([1, -2], 78271.516,
             ol.proj.get('EPSG:3857'));
          expect(url).to.be.eql('http://www.example.com/wmts/coastlines/' +
              'featureinfo/EPSG:3857/1/1/1/0/0.html');
        });

    it('throws an exception when infoFormat is not defined',
        function() {
          var source = new ol.source.WMTS({
            layer: 'layer',
            style: 'default',
            urls: ['http://www.example.com/wmts/coastlines'],
            matrixSet: 'EPSG:3857',
            tileGrid: new ol.tilegrid.WMTS({
              origin: [-20037508.342789244, 20037508.342789244],
              resolutions: [559082264.029 * 0.28E-3,
                279541132.015 * 0.28E-3,
                139770566.007 * 0.28E-3],
              matrixIds: [0, 1, 2]
            })
          });

          expect(function() {
            source.getGetFeatureInfoUrl([1, -2], 78271.516,
               ol.proj.get('EPSG:3857'));
          }).to.throwException();
        });
  });

});

goog.require('ol.format.WMTSCapabilities');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.tilegrid.WMTS');
goog.require('ol.source.WMTS');
