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

          expect(options.tileGrid).to.be.a(ol.tilegrid.WMTS);

          expect(options.style).to.be.eql('DarkBlue');

          expect(options.dimensions).to.eql({});

        });

    it('can create REST options from spec/ol/format/wmts/ogcsample.xml',
        function() {
          var options;
          options = ol.source.WMTS.optionsFromCapabilities(
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
});

goog.require('ol.format.WMTSCapabilities');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.tilegrid.WMTS');
goog.require('ol.source.WMTS');
