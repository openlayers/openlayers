import WMTSCapabilities from '../../../../src/ol/format/WMTSCapabilities.js';


describe('ol.format.WMTSCapabilities', () => {

  describe('when parsing ogcsample.xml', () => {

    const parser = new WMTSCapabilities();
    let capabilities;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wmts/ogcsample.xml', function(xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    test('can read Capability.Contents.Layer', () => {

      expect(capabilities.Contents.Layer).toBeInstanceOf(Array);
      expect(capabilities.Contents.Layer).toHaveLength(1);


      const layer = capabilities.Contents.Layer[0];
      expect(layer.Abstract).toEqual('Blue Marble Next Generation NASA Product');
      expect(layer.Identifier).toEqual('BlueMarbleNextGeneration');
      expect(layer.Title).toEqual('Blue Marble Next Generation');

      expect(layer.Dimension).toBeInstanceOf(Array);
      expect(layer.Dimension).toHaveLength(1);
      expect(typeof layer.Dimension[0]).toBe('object');
      expect(layer.Dimension[0].Identifier).toEqual('Time');
      expect(layer.Dimension[0].Default).toEqual('20110805');
      expect(layer.Dimension[0].Value).toBeInstanceOf(Array);
      expect(layer.Dimension[0].Value).toHaveLength(2);
      expect(layer.Dimension[0].Value[0]).toEqual('20110805');

      expect(layer.Format).toBeInstanceOf(Array);
      expect(layer.Format).toHaveLength(2);
      expect(layer.Format[0]).toEqual('image/jpeg');

      expect(layer.Style).toBeInstanceOf(Array);
      expect(layer.Style).toHaveLength(2);
      expect(layer.Style[0].Identifier).toEqual('DarkBlue');
      expect(layer.Style[0].isDefault).toBe(true);
      expect(layer.Style[0].Title).toEqual('Dark Blue');
      expect(layer.Style[0].LegendURL[0].href).toEqual('http://www.miramon.uab.es/wmts/Coastlines/' +
          'coastlines_darkBlue.png');
      expect(layer.Style[0].LegendURL[0].format).toEqual('image/png');

      expect(layer.TileMatrixSetLink).toBeInstanceOf(Array);
      expect(layer.TileMatrixSetLink).toHaveLength(2);
      expect(layer.TileMatrixSetLink[0].TileMatrixSet).toEqual('BigWorldPixel');
      expect(layer.TileMatrixSetLink[1].TileMatrixSet).toEqual('google3857');

      const wgs84Bbox = layer.WGS84BoundingBox;
      expect(wgs84Bbox).toBeInstanceOf(Array);
      expect(wgs84Bbox[0]).toEqual(-180);
      expect(wgs84Bbox[2]).toEqual(180);
      expect(wgs84Bbox[1]).toEqual(-90);
      expect(wgs84Bbox[3]).toEqual(90.0);

      expect(layer.ResourceURL).toBeInstanceOf(Array);
      expect(layer.ResourceURL).toHaveLength(2);
      expect(layer.ResourceURL[0].format).toEqual('image/png');
      expect(layer.ResourceURL[0].template).toEqual('http://www.example.com/wmts/coastlines/{TileMatrix}' +
          '/{TileRow}/{TileCol}.png');

    });

    test('Can read Capabilities.Content.TileMatrixSet', () => {
      expect(capabilities.Contents.TileMatrixSet).toBeTruthy();

      const bigWorld = capabilities.Contents.TileMatrixSet[2];
      expect(bigWorld).toBeTruthy();
      expect(bigWorld.Identifier).toEqual('BigWorld');
      expect(bigWorld.SupportedCRS).toEqual('urn:ogc:def:crs:OGC:1.3:CRS84');
      expect(bigWorld.TileMatrix).toHaveLength(2);
      expect(bigWorld.TileMatrix[0].Identifier).toEqual('1e6');
      expect(bigWorld.TileMatrix[0].MatrixHeight).toEqual(50000);
      expect(bigWorld.TileMatrix[0].MatrixWidth).toEqual(60000);
      expect(bigWorld.TileMatrix[0].ScaleDenominator).toEqual(1000000);
      expect(bigWorld.TileMatrix[0].TileWidth).toEqual(256);
      expect(bigWorld.TileMatrix[0].TileHeight).toEqual(256);
      expect(bigWorld.TileMatrix[0].TopLeftCorner).toBeInstanceOf(Array);
      expect(bigWorld.TileMatrix[0].TopLeftCorner[0]).toEqual(-180);
      expect(bigWorld.TileMatrix[0].TopLeftCorner[1]).toEqual(84);
      expect(bigWorld.TileMatrix[1].Identifier).toEqual('2.5e6');
      expect(bigWorld.TileMatrix[1].MatrixHeight).toEqual(7000);
      expect(bigWorld.TileMatrix[1].MatrixWidth).toEqual(9000);
      expect(bigWorld.TileMatrix[1].ScaleDenominator).toEqual(2500000);
      expect(bigWorld.TileMatrix[1].TileWidth).toEqual(256);
      expect(bigWorld.TileMatrix[1].TileHeight).toEqual(256);
      expect(bigWorld.TileMatrix[1].TopLeftCorner).toBeInstanceOf(Array);
      expect(bigWorld.TileMatrix[1].TopLeftCorner[0]).toEqual(-180);
      expect(bigWorld.TileMatrix[1].TopLeftCorner[1]).toEqual(84);


    });

    test('Can read OWS tags', () => {
      expect(capabilities.ServiceIdentification).toBeTruthy();
      expect(capabilities.OperationsMetadata).toBeTruthy();

    });

  });

  describe('when parsing ign.xml', () => {

    const parser = new WMTSCapabilities();
    let capabilities;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wmts/ign.xml', function(xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    test('can read Capability.Contents.Layer', () => {
      expect(capabilities.Contents.Layer).toBeInstanceOf(Array);
      expect(capabilities.Contents.Layer).toHaveLength(1);


      const layer = capabilities.Contents.Layer[0];
      expect(layer.TileMatrixSetLink).toBeInstanceOf(Array);
      expect(layer.TileMatrixSetLink).toHaveLength(2);
      expect(layer.TileMatrixSetLink[0].TileMatrixSet).toEqual('PM');
      expect(layer.TileMatrixSetLink[0].TileMatrixSetLimits).toBeInstanceOf(Array);
      expect(layer.TileMatrixSetLink[0].TileMatrixSetLimits).toHaveLength(20);
      expect(layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].TileMatrix).toEqual('0');
      expect(layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].MinTileRow).toEqual(0);
      expect(layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].MaxTileRow).toEqual(1);
      expect(layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].MinTileCol).toEqual(0);
      expect(layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].MaxTileCol).toEqual(1);

      expect(layer.TileMatrixSetLink[1].TileMatrixSet).toEqual('Prefixed');
      expect(layer.TileMatrixSetLink[1].TileMatrixSetLimits).toBeInstanceOf(Array);
      expect(layer.TileMatrixSetLink[1].TileMatrixSetLimits).toHaveLength(2);
      expect(layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].TileMatrix).toEqual('Prefixed:0');
      expect(layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].MinTileRow).toEqual(0);
      expect(layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].MaxTileRow).toEqual(1);
      expect(layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].MinTileCol).toEqual(0);
      expect(layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].MaxTileCol).toEqual(1);

    });

    test('Can read Capabilities.Content.TileMatrixSet', () => {
      expect(capabilities.Contents.TileMatrixSet).toBeTruthy();

      const pm = capabilities.Contents.TileMatrixSet[0];
      expect(pm).toBeTruthy();
      expect(pm.Identifier).toEqual('PM');
      expect(pm.SupportedCRS).toEqual('EPSG:3857');
      expect(pm.TileMatrix).toHaveLength(22);
      expect(pm.TileMatrix[0].Identifier).toEqual('0');
      expect(pm.TileMatrix[0].MatrixHeight).toEqual(1);
      expect(pm.TileMatrix[0].MatrixWidth).toEqual(1);
      expect(pm.TileMatrix[0].ScaleDenominator).toEqual(559082264.0287178958533332);
      expect(pm.TileMatrix[0].TileWidth).toEqual(256);
      expect(pm.TileMatrix[0].TileHeight).toEqual(256);
      expect(pm.TileMatrix[0].TopLeftCorner).toBeInstanceOf(Array);
      expect(pm.TileMatrix[0].TopLeftCorner[0]).toEqual(-20037508);
      expect(pm.TileMatrix[0].TopLeftCorner[1]).toEqual(20037508);
      expect(pm.TileMatrix[1].Identifier).toEqual('1');
      expect(pm.TileMatrix[1].MatrixHeight).toEqual(2);
      expect(pm.TileMatrix[1].MatrixWidth).toEqual(2);
      expect(pm.TileMatrix[1].ScaleDenominator).toEqual(279541132.0143588959472254);
      expect(pm.TileMatrix[1].TileWidth).toEqual(256);
      expect(pm.TileMatrix[1].TileHeight).toEqual(256);
      expect(pm.TileMatrix[1].TopLeftCorner).toBeInstanceOf(Array);
      expect(pm.TileMatrix[1].TopLeftCorner[0]).toEqual(-20037508);
      expect(pm.TileMatrix[1].TopLeftCorner[1]).toEqual(20037508);


    });

  });
});
