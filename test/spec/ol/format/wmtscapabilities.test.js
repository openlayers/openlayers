goog.provide('ol.test.format.WMTSCapabilities');

goog.require('ol.format.WMTSCapabilities');


describe('ol.format.WMTSCapabilities', function() {

  describe('when parsing ogcsample.xml', function() {

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

    it('can read Capability.Contents.Layer', function() {

      expect(capabilities.Contents.Layer).to.be.an('array');
      expect(capabilities.Contents.Layer).to.have.length(1);


      var layer = capabilities.Contents.Layer[0];
      expect(layer.Abstract).to.be
        .eql('Blue Marble Next Generation NASA Product');
      expect(layer.Identifier).to.be.eql('BlueMarbleNextGeneration');
      expect(layer.Title).to.be.eql('Blue Marble Next Generation');

      expect(layer.Dimension).to.be.an('array');
      expect(layer.Dimension).to.have.length(1);
      expect(layer.Dimension[0]).to.be.an('object');
      expect(layer.Dimension[0].Identifier).to.be.eql('Time');
      expect(layer.Dimension[0].Default).to.be.eql('20110805');
      expect(layer.Dimension[0].Value).to.be.an('array');
      expect(layer.Dimension[0].Value).to.have.length(2);
      expect(layer.Dimension[0].Value[0]).to.be.eql('20110805');

      expect(layer.Format).to.be.an('array');
      expect(layer.Format).to.have.length(2);
      expect(layer.Format[0]).to.be.eql('image/jpeg');

      expect(layer.Style).to.be.an('array');
      expect(layer.Style).to.have.length(2);
      expect(layer.Style[0].Identifier).to.be.eql('DarkBlue');
      expect(layer.Style[0].isDefault).to.be(true);
      expect(layer.Style[0].Title).to.be.eql('Dark Blue');
      expect(layer.Style[0].LegendURL[0].href).to.be
        .eql('http://www.miramon.uab.es/wmts/Coastlines/' +
          'coastlines_darkBlue.png');
      expect(layer.Style[0].LegendURL[0].format).to.be.eql('image/png');

      expect(layer.TileMatrixSetLink).to.be.an('array');
      expect(layer.TileMatrixSetLink).to.have.length(2);
      expect(layer.TileMatrixSetLink[0].TileMatrixSet).to.be
        .eql('BigWorldPixel');
      expect(layer.TileMatrixSetLink[1].TileMatrixSet).to.be
        .eql('google3857');

      var wgs84Bbox = layer.WGS84BoundingBox;
      expect(wgs84Bbox).to.be.an('array');
      expect(wgs84Bbox[0]).to.be.eql(-180);
      expect(wgs84Bbox[2]).to.be.eql(180);
      expect(wgs84Bbox[1]).to.be.eql(-90);
      expect(wgs84Bbox[3]).to.be.eql(90.0);

      expect(layer.ResourceURL).to.be.an('array');
      expect(layer.ResourceURL).to.have.length(2);
      expect(layer.ResourceURL[0].format).to.be.eql('image/png');
      expect(layer.ResourceURL[0].template).to.be
        .eql('http://www.example.com/wmts/coastlines/{TileMatrix}' +
          '/{TileRow}/{TileCol}.png');

    });

    it('Can read Capabilities.Content.TileMatrixSet', function() {
      expect(capabilities.Contents.TileMatrixSet).to.be.ok();

      var bigWorld = capabilities.Contents.TileMatrixSet[2];
      expect(bigWorld).to.be.ok();
      expect(bigWorld.Identifier).to.be.eql('BigWorld');
      expect(bigWorld.SupportedCRS).to.be.eql('urn:ogc:def:crs:OGC:1.3:CRS84');
      expect(bigWorld.TileMatrix).to.have.length(2);
      expect(bigWorld.TileMatrix[0].Identifier).to.be.eql('1e6');
      expect(bigWorld.TileMatrix[0].MatrixHeight).to.be.eql(50000);
      expect(bigWorld.TileMatrix[0].MatrixWidth).to.be.eql(60000);
      expect(bigWorld.TileMatrix[0].ScaleDenominator).to.be.eql(1000000);
      expect(bigWorld.TileMatrix[0].TileWidth).to.be.eql(256);
      expect(bigWorld.TileMatrix[0].TileHeight).to.be.eql(256);
      expect(bigWorld.TileMatrix[0].TopLeftCorner).to.be.a('array');
      expect(bigWorld.TileMatrix[0].TopLeftCorner[0]).to.be.eql(-180);
      expect(bigWorld.TileMatrix[0].TopLeftCorner[1]).to.be.eql(84);
      expect(bigWorld.TileMatrix[1].Identifier).to.be.eql('2.5e6');
      expect(bigWorld.TileMatrix[1].MatrixHeight).to.be.eql(7000);
      expect(bigWorld.TileMatrix[1].MatrixWidth).to.be.eql(9000);
      expect(bigWorld.TileMatrix[1].ScaleDenominator).to.be.eql(2500000);
      expect(bigWorld.TileMatrix[1].TileWidth).to.be.eql(256);
      expect(bigWorld.TileMatrix[1].TileHeight).to.be.eql(256);
      expect(bigWorld.TileMatrix[1].TopLeftCorner).to.be.a('array');
      expect(bigWorld.TileMatrix[1].TopLeftCorner[0]).to.be.eql(-180);
      expect(bigWorld.TileMatrix[1].TopLeftCorner[1]).to.be.eql(84);


    });

    it('Can read OWS tags', function() {
      expect(capabilities.ServiceIdentification).to.be.ok();
      expect(capabilities.OperationsMetadata).to.be.ok();

    });

  });
});
