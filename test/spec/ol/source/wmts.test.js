goog.provide('ol.test.source.WMTS');

goog.require('ol.format.WMTSCapabilities');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.tilegrid.WMTS');
goog.require('ol.source.WMTS');


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
              {layer: 'BlueMarbleNextGeneration', matrixSet: 'google3857'});

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

          expect(options.dimensions).to.eql({Time: '20110805'});

        });

    it('can create REST options from spec/ol/format/wmts/ogcsample.xml',
        function() {
          var options = ol.source.WMTS.optionsFromCapabilities(
              capabilities,
              {layer: 'BlueMarbleNextGeneration', matrixSet: 'google3857',
                requestEncoding: 'REST'});

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

          expect(options.dimensions).to.eql({Time: '20110805'});

        });

    it('can find a MatrixSet by SRS identifier', function() {
      var options = ol.source.WMTS.optionsFromCapabilities(
          capabilities,
          {layer: 'BlueMarbleNextGeneration', projection: 'EPSG:3857',
            requestEncoding: 'REST'});

      expect(options.matrixSet).to.be.eql('google3857');
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
          var url = source.tileUrlFunction(
              source.getTileCoordForTileUrlFunction([1, 1, -2]), 1, projection);
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
          var url = source.tileUrlFunction(
              source.getTileCoordForTileUrlFunction([1, 1, -2]), 1, projection);
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
                requestEncoding: 'KVP',
                matrixSet: 'default028mm'
              });

          expect(options.urls).to.be.an('array');
          expect(options.urls).to.have.length(1);
          expect(options.urls[0]).to.be.eql(
             'http://services.arcgisonline.com/arcgis/rest/services/' +
             'Demographics/USA_Population_Density/MapServer/WMTS?');
        });

    it('can create REST options from spec/ol/format/wmts/arcgis.xml',
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
             'Demographics/USA_Population_Density/MapServer/WMTS/' +
             'tile/1.0.0/Demographics_USA_Population_Density/' +
             '{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png');
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

});
