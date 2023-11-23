import WMTSCapabilities from '../../../../../src/ol/format/WMTSCapabilities.js';

describe('ol.format.WMTSCapabilities', function () {
  describe('when parsing ogcsample.xml', function () {
    const parser = new WMTSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText('spec/ol/format/wmts/ogcsample.xml', function (xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can read Capability.Contents.Layer', function () {
      expect(capabilities.Contents.Layer).to.be.an('array');
      expect(capabilities.Contents.Layer).to.have.length(1);

      const layer = capabilities.Contents.Layer[0];
      expect(layer.Abstract).to.be.eql(
        'Blue Marble Next Generation NASA Product'
      );
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
      expect(layer.Style[0].LegendURL[0].href).to.be.eql(
        'http://www.miramon.uab.es/wmts/Coastlines/' + 'coastlines_darkBlue.png'
      );
      expect(layer.Style[0].LegendURL[0].format).to.be.eql('image/png');

      expect(layer.TileMatrixSetLink).to.be.an('array');
      expect(layer.TileMatrixSetLink).to.have.length(3);
      expect(layer.TileMatrixSetLink[0].TileMatrixSet).to.be.eql(
        'BigWorldPixel'
      );
      expect(layer.TileMatrixSetLink[1].TileMatrixSet).to.be.eql('google3857');
      expect(layer.TileMatrixSetLink[2].TileMatrixSet).to.be.eql(
        'google3857subset'
      );

      const wgs84Bbox = layer.WGS84BoundingBox;
      expect(wgs84Bbox).to.be.an('array');
      expect(wgs84Bbox[0]).to.be.eql(-180);
      expect(wgs84Bbox[2]).to.be.eql(180);
      expect(wgs84Bbox[1]).to.be.eql(-90);
      expect(wgs84Bbox[3]).to.be.eql(90.0);

      expect(layer.ResourceURL).to.be.an('array');
      expect(layer.ResourceURL).to.have.length(2);
      expect(layer.ResourceURL[0].format).to.be.eql('image/png');
      expect(layer.ResourceURL[0].template).to.be.eql(
        'http://www.example.com/wmts/coastlines/{TileMatrix}' +
          '/{TileRow}/{TileCol}.png'
      );
    });

    it('Can read Capabilities.Content.TileMatrixSet', function () {
      expect(capabilities.Contents.TileMatrixSet).to.be.ok();

      const bigWorld = capabilities.Contents.TileMatrixSet[2];
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

    it('Can read OWS tags', function () {
      expect(capabilities.ServiceIdentification).to.be.ok();
      expect(capabilities.OperationsMetadata).to.be.ok();
    });
  });

  describe('when parsing ign.xml', function () {
    const parser = new WMTSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText('spec/ol/format/wmts/ign.xml', function (xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can read Capability.Contents.Layer', function () {
      expect(capabilities.Contents.Layer).to.be.an('array');
      expect(capabilities.Contents.Layer).to.have.length(1);

      const layer = capabilities.Contents.Layer[0];
      expect(layer.TileMatrixSetLink).to.be.an('array');
      expect(layer.TileMatrixSetLink).to.have.length(2);
      expect(layer.TileMatrixSetLink[0].TileMatrixSet).to.be.eql('PM');
      expect(layer.TileMatrixSetLink[0].TileMatrixSetLimits).to.be.an('array');
      expect(layer.TileMatrixSetLink[0].TileMatrixSetLimits).to.have.length(20);
      expect(
        layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].TileMatrix
      ).to.be.eql('0');
      expect(
        layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].MinTileRow
      ).to.be.eql(0);
      expect(
        layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].MaxTileRow
      ).to.be.eql(1);
      expect(
        layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].MinTileCol
      ).to.be.eql(0);
      expect(
        layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].MaxTileCol
      ).to.be.eql(1);

      expect(layer.TileMatrixSetLink[1].TileMatrixSet).to.be.eql('Prefixed');
      expect(layer.TileMatrixSetLink[1].TileMatrixSetLimits).to.be.an('array');
      expect(layer.TileMatrixSetLink[1].TileMatrixSetLimits).to.have.length(2);
      expect(
        layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].TileMatrix
      ).to.be.eql('Prefixed:0');
      expect(
        layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].MinTileRow
      ).to.be.eql(0);
      expect(
        layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].MaxTileRow
      ).to.be.eql(1);
      expect(
        layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].MinTileCol
      ).to.be.eql(0);
      expect(
        layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].MaxTileCol
      ).to.be.eql(1);
    });

    it('Can read Capabilities.Content.TileMatrixSet', function () {
      expect(capabilities.Contents.TileMatrixSet).to.be.ok();

      const pm = capabilities.Contents.TileMatrixSet[0];
      expect(pm).to.be.ok();
      expect(pm.Identifier).to.be.eql('PM');
      expect(pm.SupportedCRS).to.be.eql('EPSG:3857');
      expect(pm.TileMatrix).to.have.length(22);
      expect(pm.TileMatrix[0].Identifier).to.be.eql('0');
      expect(pm.TileMatrix[0].MatrixHeight).to.be.eql(1);
      expect(pm.TileMatrix[0].MatrixWidth).to.be.eql(1);
      expect(pm.TileMatrix[0].ScaleDenominator).to.be.eql(
        559082264.0287178958533332
      );
      expect(pm.TileMatrix[0].TileWidth).to.be.eql(256);
      expect(pm.TileMatrix[0].TileHeight).to.be.eql(256);
      expect(pm.TileMatrix[0].TopLeftCorner).to.be.a('array');
      expect(pm.TileMatrix[0].TopLeftCorner[0]).to.be.eql(-20037508);
      expect(pm.TileMatrix[0].TopLeftCorner[1]).to.be.eql(20037508);
      expect(pm.TileMatrix[1].Identifier).to.be.eql('1');
      expect(pm.TileMatrix[1].MatrixHeight).to.be.eql(2);
      expect(pm.TileMatrix[1].MatrixWidth).to.be.eql(2);
      expect(pm.TileMatrix[1].ScaleDenominator).to.be.eql(
        279541132.0143588959472254
      );
      expect(pm.TileMatrix[1].TileWidth).to.be.eql(256);
      expect(pm.TileMatrix[1].TileHeight).to.be.eql(256);
      expect(pm.TileMatrix[1].TopLeftCorner).to.be.a('array');
      expect(pm.TileMatrix[1].TopLeftCorner[0]).to.be.eql(-20037508);
      expect(pm.TileMatrix[1].TopLeftCorner[1]).to.be.eql(20037508);
    });
  });
});
