import {assert} from 'chai';
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
      assert.isArray(capabilities.Contents.Layer);
      assert.lengthOf(capabilities.Contents.Layer, 1);

      const layer = capabilities.Contents.Layer[0];
      assert.deepEqual(
        layer.Abstract,
        'Blue Marble Next Generation NASA Product',
      );
      assert.deepEqual(layer.Identifier, 'BlueMarbleNextGeneration');
      assert.deepEqual(layer.Title, 'Blue Marble Next Generation');

      assert.isArray(layer.Dimension);
      assert.lengthOf(layer.Dimension, 1);
      assert.isObject(layer.Dimension[0]);
      assert.deepEqual(layer.Dimension[0].Identifier, 'Time');
      assert.deepEqual(layer.Dimension[0].Default, '20110805');
      assert.isArray(layer.Dimension[0].Value);
      assert.lengthOf(layer.Dimension[0].Value, 2);
      assert.deepEqual(layer.Dimension[0].Value[0], '20110805');

      assert.isArray(layer.Format);
      assert.lengthOf(layer.Format, 2);
      assert.deepEqual(layer.Format[0], 'image/jpeg');

      assert.isArray(layer.Style);
      assert.lengthOf(layer.Style, 2);
      assert.deepEqual(layer.Style[0].Identifier, 'DarkBlue');
      assert.strictEqual(layer.Style[0].isDefault, true);
      assert.deepEqual(layer.Style[0].Title, 'Dark Blue');
      assert.deepEqual(
        layer.Style[0].LegendURL[0].href,
        'http://www.miramon.uab.es/wmts/Coastlines/' +
          'coastlines_darkBlue.png',
      );
      assert.deepEqual(layer.Style[0].LegendURL[0].format, 'image/png');

      assert.isArray(layer.TileMatrixSetLink);
      assert.lengthOf(layer.TileMatrixSetLink, 3);
      assert.deepEqual(
        layer.TileMatrixSetLink[0].TileMatrixSet,
        'BigWorldPixel',
      );
      assert.deepEqual(layer.TileMatrixSetLink[1].TileMatrixSet, 'google3857');
      assert.deepEqual(
        layer.TileMatrixSetLink[2].TileMatrixSet,
        'google3857subset',
      );

      const wgs84Bbox = layer.WGS84BoundingBox;
      assert.isArray(wgs84Bbox);
      assert.deepEqual(wgs84Bbox[0], -180);
      assert.deepEqual(wgs84Bbox[2], 180);
      assert.deepEqual(wgs84Bbox[1], -90);
      assert.deepEqual(wgs84Bbox[3], 90.0);

      const bbox = layer.BoundingBox;
      assert.isArray(bbox);
      assert.isArray(bbox[0].extent);
      assert.deepEqual(bbox[0].extent[0], -180);
      assert.deepEqual(bbox[0].extent[2], 180);
      assert.deepEqual(bbox[0].extent[1], -90);
      assert.deepEqual(bbox[0].extent[3], 90.0);
      assert.deepEqual(bbox[0].crs, 'urn:ogc:def:crs:CRS::84');
      assert.deepEqual(bbox[1].crs, null);

      assert.isArray(layer.ResourceURL);
      assert.lengthOf(layer.ResourceURL, 2);
      assert.deepEqual(layer.ResourceURL[0].format, 'image/png');
      assert.deepEqual(
        layer.ResourceURL[0].template,
        'http://www.example.com/wmts/coastlines/{TileMatrix}' +
          '/{TileRow}/{TileCol}.png',
      );
    });

    it('Can read Capabilities.Content.TileMatrixSet', function () {
      assert.isOk(capabilities.Contents.TileMatrixSet);

      const bigWorld = capabilities.Contents.TileMatrixSet[2];
      assert.isOk(bigWorld);
      assert.deepEqual(bigWorld.Identifier, 'BigWorld');
      assert.deepEqual(bigWorld.SupportedCRS, 'urn:ogc:def:crs:OGC:1.3:CRS84');
      assert.lengthOf(bigWorld.TileMatrix, 2);
      assert.deepEqual(bigWorld.TileMatrix[0].Identifier, '1e6');
      assert.deepEqual(bigWorld.TileMatrix[0].MatrixHeight, 50000);
      assert.deepEqual(bigWorld.TileMatrix[0].MatrixWidth, 60000);
      assert.deepEqual(bigWorld.TileMatrix[0].ScaleDenominator, 1000000);
      assert.deepEqual(bigWorld.TileMatrix[0].TileWidth, 256);
      assert.deepEqual(bigWorld.TileMatrix[0].TileHeight, 256);
      assert.isArray(bigWorld.TileMatrix[0].TopLeftCorner);
      assert.deepEqual(bigWorld.TileMatrix[0].TopLeftCorner[0], -180);
      assert.deepEqual(bigWorld.TileMatrix[0].TopLeftCorner[1], 84);
      assert.deepEqual(bigWorld.TileMatrix[1].Identifier, '2.5e6');
      assert.deepEqual(bigWorld.TileMatrix[1].MatrixHeight, 7000);
      assert.deepEqual(bigWorld.TileMatrix[1].MatrixWidth, 9000);
      assert.deepEqual(bigWorld.TileMatrix[1].ScaleDenominator, 2500000);
      assert.deepEqual(bigWorld.TileMatrix[1].TileWidth, 256);
      assert.deepEqual(bigWorld.TileMatrix[1].TileHeight, 256);
      assert.isArray(bigWorld.TileMatrix[1].TopLeftCorner);
      assert.deepEqual(bigWorld.TileMatrix[1].TopLeftCorner[0], -180);
      assert.deepEqual(bigWorld.TileMatrix[1].TopLeftCorner[1], 84);
    });

    it('Can read OWS tags', function () {
      assert.isOk(capabilities.ServiceIdentification);
      assert.isOk(capabilities.OperationsMetadata);
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
      assert.isArray(capabilities.Contents.Layer);
      assert.lengthOf(capabilities.Contents.Layer, 1);

      const layer = capabilities.Contents.Layer[0];
      assert.isArray(layer.TileMatrixSetLink);
      assert.lengthOf(layer.TileMatrixSetLink, 2);
      assert.deepEqual(layer.TileMatrixSetLink[0].TileMatrixSet, 'PM');
      assert.isArray(layer.TileMatrixSetLink[0].TileMatrixSetLimits);
      assert.lengthOf(layer.TileMatrixSetLink[0].TileMatrixSetLimits, 20);
      assert.deepEqual(
        layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].TileMatrix,
        '0',
      );
      assert.deepEqual(
        layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].MinTileRow,
        0,
      );
      assert.deepEqual(
        layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].MaxTileRow,
        1,
      );
      assert.deepEqual(
        layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].MinTileCol,
        0,
      );
      assert.deepEqual(
        layer.TileMatrixSetLink[0].TileMatrixSetLimits[0].MaxTileCol,
        1,
      );

      assert.deepEqual(layer.TileMatrixSetLink[1].TileMatrixSet, 'Prefixed');
      assert.isArray(layer.TileMatrixSetLink[1].TileMatrixSetLimits);
      assert.lengthOf(layer.TileMatrixSetLink[1].TileMatrixSetLimits, 2);
      assert.deepEqual(
        layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].TileMatrix,
        'Prefixed:0',
      );
      assert.deepEqual(
        layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].MinTileRow,
        0,
      );
      assert.deepEqual(
        layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].MaxTileRow,
        1,
      );
      assert.deepEqual(
        layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].MinTileCol,
        0,
      );
      assert.deepEqual(
        layer.TileMatrixSetLink[1].TileMatrixSetLimits[0].MaxTileCol,
        1,
      );
    });

    it('Can read Capabilities.Content.TileMatrixSet', function () {
      assert.isOk(capabilities.Contents.TileMatrixSet);

      const pm = capabilities.Contents.TileMatrixSet[0];
      assert.isOk(pm);
      assert.deepEqual(pm.Identifier, 'PM');
      assert.deepEqual(pm.SupportedCRS, 'EPSG:3857');
      assert.lengthOf(pm.TileMatrix, 22);
      assert.deepEqual(pm.TileMatrix[0].Identifier, '0');
      assert.deepEqual(pm.TileMatrix[0].MatrixHeight, 1);
      assert.deepEqual(pm.TileMatrix[0].MatrixWidth, 1);
      assert.deepEqual(
        pm.TileMatrix[0].ScaleDenominator,
        559082264.0287178958533332,
      );
      assert.deepEqual(pm.TileMatrix[0].TileWidth, 256);
      assert.deepEqual(pm.TileMatrix[0].TileHeight, 256);
      assert.isArray(pm.TileMatrix[0].TopLeftCorner);
      assert.deepEqual(pm.TileMatrix[0].TopLeftCorner[0], -20037508);
      assert.deepEqual(pm.TileMatrix[0].TopLeftCorner[1], 20037508);
      assert.deepEqual(pm.TileMatrix[1].Identifier, '1');
      assert.deepEqual(pm.TileMatrix[1].MatrixHeight, 2);
      assert.deepEqual(pm.TileMatrix[1].MatrixWidth, 2);
      assert.deepEqual(
        pm.TileMatrix[1].ScaleDenominator,
        279541132.0143588959472254,
      );
      assert.deepEqual(pm.TileMatrix[1].TileWidth, 256);
      assert.deepEqual(pm.TileMatrix[1].TileHeight, 256);
      assert.isArray(pm.TileMatrix[1].TopLeftCorner);
      assert.deepEqual(pm.TileMatrix[1].TopLeftCorner[0], -20037508);
      assert.deepEqual(pm.TileMatrix[1].TopLeftCorner[1], 20037508);
    });
  });
});
