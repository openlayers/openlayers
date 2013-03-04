goog.provide('ol.test.parser.ogc.WMTSCapabilities_v1_0_0');

describe('ol.parser.ogc.wmtscapabilities_v1_0_0', function() {

  var parser = new ol.parser.ogc.WMTSCapabilities();

  describe('test ows', function() {
    it('Test ows', function() {
      var obj, serviceIdentification, serviceProvider, operationsMetadata,
          contactInfo;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmtscapabilities_v1_0_0/' +
            'ogcsample.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          obj = parser.read(xhr.getResponseXml());
          serviceIdentification = obj.serviceIdentification;
          serviceProvider = obj.serviceProvider;
          operationsMetadata = obj.operationsMetadata;
          contactInfo = serviceProvider.serviceContact.contactInfo;
        });
      });
      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(serviceIdentification.title).toEqual('Web Map Tile Service');
        expect(serviceIdentification.serviceTypeVersion).toEqual('1.0.0');
        expect(serviceIdentification.serviceType.value).toEqual('OGC WMTS');
        expect(serviceProvider.providerName).toEqual('MiraMon');
        var url = 'http://www.creaf.uab.es/miramon';
        expect(serviceProvider.providerSite).toEqual(url);
        var name = 'Joan Maso Pau';
        expect(serviceProvider.serviceContact.individualName).toEqual(name);
        var position = 'Senior Software Engineer';
        expect(serviceProvider.serviceContact.positionName).toEqual(position);
        expect(contactInfo.address.administrativeArea).toEqual('Barcelona');
        expect(contactInfo.address.city).toEqual('Bellaterra');
        expect(contactInfo.address.country).toEqual('Spain');
        expect(contactInfo.address.deliveryPoint).toEqual('Fac Ciencies UAB');
        var email = 'joan.maso@uab.es';
        expect(contactInfo.address.electronicMailAddress).toEqual(email);
        expect(contactInfo.address.postalCode).toEqual('08193');
        expect(contactInfo.phone.voice).toEqual('+34 93 581 1312');
        var dcp = operationsMetadata.GetCapabilities.dcp;
        url = 'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?';
        expect(dcp.http.get[0].url).toEqual(url);
        dcp = operationsMetadata.GetCapabilities.dcp;
        expect(dcp.http.get[0].constraints.GetEncoding.allowedValues).toEqual(
            {'KVP': true});
        url = 'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?';
        dcp = operationsMetadata.GetFeatureInfo.dcp;
        expect(dcp.http.get[0].url).toEqual(url);
        dcp = operationsMetadata.GetFeatureInfo.dcp;
        expect(dcp.http.get[0].constraints).toBeUndefined();
        url = 'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?';
        expect(operationsMetadata.GetTile.dcp.http.get[0].url).toEqual(url);
        dcp = operationsMetadata.GetTile.dcp;
        expect(dcp.http.get[0].constraints).toBeUndefined();
      });
    });
  });
  describe('test layers', function() {
    it('Test layers', function() {
      var obj, contents, layer, wgs84Bbox, dimensions;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmtscapabilities_v1_0_0/' +
            'ogcsample.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          obj = parser.read(xhr.getResponseXml());
          contents = obj.contents;
          layer = contents.layers[0];
          wgs84Bbox = layer.bounds;
          dimensions = layer.dimensions;
        });
      });
      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(contents.layers.length).toEqual(1);
        expect(layer['abstract']).toEqual('Coastline/shorelines (BA010)');
        expect(layer.identifier).toEqual('coastlines');
        expect(layer.title).toEqual('Coastlines');
        expect(layer.formats.length).toEqual(2);
        expect(layer.formats[0]).toEqual('image/png');
        expect(layer.formats[1]).toEqual('image/gif');
        expect(layer.styles.length).toEqual(2);
        expect(layer.styles[0].identifier).toEqual('DarkBlue');
        expect(layer.styles[0].isDefault).toBeTruthy();
        expect(layer.styles[0].title).toEqual('Dark Blue');
        var url = 'http://www.miramon.uab.es/wmts/Coastlines/' +
            'coastlines_darkBlue.png';
        expect(layer.styles[0].legend.href).toEqual(url);
        expect(layer.styles[0].legend.format).toEqual('image/png');
        expect(layer.styles[1].identifier).toEqual('thickAndRed');
        expect(!layer.styles[1].isDefault).toBeTruthy();
        expect(layer.styles[1].title).toEqual('Thick And Red');
        expect(layer.styles[1].legend).toBeUndefined();
        expect(layer.tileMatrixSetLinks.length).toEqual(1);
        expect(layer.tileMatrixSetLinks[0].tileMatrixSet).toEqual('BigWorld');
        expect(wgs84Bbox instanceof ol.Extent).toBeTruthy();
        expect(wgs84Bbox.minX).toEqual(-180.0);
        expect(wgs84Bbox.maxX).toEqual(180.0);
        expect(wgs84Bbox.minY).toEqual(-90.0);
        expect(wgs84Bbox.maxY).toEqual(90.0);
        expect(layer.resourceUrls.hasOwnProperty('tile')).toBeTruthy();
        var format = 'image/png';
        expect(layer.resourceUrls.tile.hasOwnProperty(format)).toBeTruthy();
        expect(layer.resourceUrls.tile[format].length).toEqual(2);
        var tpl = 'http://a.example.com/wmts/coastlines/{TileMatrix}/' +
          '{TileRow}/{TileCol}.png';
        expect(layer.resourceUrls.tile[format][0]).toEqual(tpl);
        tpl = 'http://b.example.com/wmts/coastlines/{TileMatrix}/' +
          '{TileRow}/{TileCol}.png';
        expect(layer.resourceUrls.tile[format][1]).toEqual(tpl);
        expect(layer.resourceUrls.hasOwnProperty('FeatureInfo')).toBeTruthy();
        format = 'application/gml+xml; version=3.1';
        expect(layer.resourceUrls.FeatureInfo.hasOwnProperty(format))
            .toBeTruthy();
        expect(layer.resourceUrls.FeatureInfo[format].length).toEqual(1);
        tpl = 'http://www.example.com/wmts/coastlines/{TileMatrixSet}/' +
          '{TileMatrix}/{TileRow}/{TileCol}/{J}/{I}.xml';
        expect(layer.resourceUrls.FeatureInfo[format][0]).toEqual(tpl);
        expect(dimensions.length).toEqual(1);
        expect(dimensions[0].title).toEqual('Time');
        expect(dimensions[0]['abstract']).toEqual('Monthly datasets');
        expect(dimensions[0].identifier).toEqual('TIME');
        expect(dimensions[0]['default']).toEqual('default');
        expect(dimensions[0].values.length).toEqual(3);
        expect(dimensions[0].values[0]).toEqual('2007-05');
        expect(dimensions[0].values[1]).toEqual('2007-06');
        expect(dimensions[0].values[1]).toEqual('2007-06');
        expect(dimensions[0].values[2]).toEqual('2007-07');
      });
    });
  });
  describe('test tileMatrixSets', function() {
    it('Test tileMatrixSets', function() {
      var obj, tileMatrixSets, bigWorld;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmtscapabilities_v1_0_0/' +
            'ogcsample.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          obj = parser.read(xhr.getResponseXml());
          tileMatrixSets = obj.contents.tileMatrixSets;
          bigWorld = tileMatrixSets['BigWorld'];
        });
      });
      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(bigWorld).toBeDefined();
        expect(bigWorld.identifier).toEqual('BigWorld');
        expect(bigWorld.matrixIds.length).toEqual(2);
        expect(bigWorld.matrixIds[0].identifier).toEqual('1e6');
        expect(bigWorld.matrixIds[0].matrixHeight).toEqual(50000);
        expect(bigWorld.matrixIds[0].matrixWidth).toEqual(60000);
        expect(bigWorld.matrixIds[0].scaleDenominator).toEqual(1000000);
        expect(bigWorld.matrixIds[0].tileWidth).toEqual(256);
        expect(bigWorld.matrixIds[0].tileHeight).toEqual(256);
        expect(bigWorld.matrixIds[0].topLeftCorner.x).toEqual(-180);
        expect(bigWorld.matrixIds[0].topLeftCorner.y).toEqual(84);
        expect(bigWorld.matrixIds[1].identifier).toEqual('2.5e6');
        expect(bigWorld.matrixIds[1].matrixHeight).toEqual(7000);
        expect(bigWorld.matrixIds[1].matrixWidth).toEqual(9000);
        expect(bigWorld.matrixIds[1].scaleDenominator).toEqual(2500000);
        expect(bigWorld.matrixIds[1].tileWidth).toEqual(256);
        expect(bigWorld.matrixIds[1].tileHeight).toEqual(256);
        expect(bigWorld.matrixIds[1].topLeftCorner.x).toEqual(-180);
        expect(bigWorld.matrixIds[1].topLeftCorner.y).toEqual(84);
      });
    });
  });
});

goog.require('goog.net.XhrIo');
goog.require('ol.Extent');
goog.require('ol.parser.ogc.WMTSCapabilities');
