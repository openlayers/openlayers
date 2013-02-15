goog.provide('ol.test.parser.ogc.WMTSCapabilities_v1_0_0');

describe('ol.parser.ogc.wmtscapabilities_v1_0_0', function() {

  var parser = new ol.parser.ogc.WMTSCapabilities();

  describe('test ows', function() {
    var obj, url, serviceIdentification, serviceProvider, operationsMetadata,
        contactInfo;
    url = 'spec/ol/parser/ogc/xml/wmtscapabilities_v1_0_0/ogcsample.xml';
    goog.net.XhrIo.send(url, function(e) {
      var xhr = e.target;
      obj = parser.read(xhr.getResponseXml());
      serviceIdentification = obj.serviceIdentification;
      serviceProvider = obj.serviceProvider;
      operationsMetadata = obj.operationsMetadata;
      contactInfo = serviceProvider.serviceContact.contactInfo;
    });
    it('ows:ServiceIdentification title is correct', function() {
      expect(serviceIdentification.title).toEqual('Web Map Tile Service');
    });
    it('ows:ServiceIdentification serviceTypeVersion is correct', function() {
      expect(serviceIdentification.serviceTypeVersion).toEqual('1.0.0');
    });
    it('ows:ServiceIdentification serviceType is correct', function() {
      expect(serviceIdentification.serviceType.value).toEqual('OGC WMTS');
    });
    it('ows:ServiceProvider providerName is correct', function() {
      expect(serviceProvider.providerName).toEqual('MiraMon');
    });
    it('ows:ServiceProvider providerSite is correct', function() {
      var url = 'http://www.creaf.uab.es/miramon';
      expect(serviceProvider.providerSite).toEqual(url);
    });
    it('ows:ServiceProvider individualName is correct', function() {
      var name = 'Joan Maso Pau';
      expect(serviceProvider.serviceContact.individualName).toEqual(name);
    });
    it('ows:ServiceProvider positionName is correct', function() {
      var position = 'Senior Software Engineer';
      expect(serviceProvider.serviceContact.positionName).toEqual(position);
    });
    it('ows:ServiceProvider address administrativeArea is correct', function() {
      expect(contactInfo.address.administrativeArea).toEqual('Barcelona');
    });
    it('ows:ServiceProvider address city is correct', function() {
      expect(contactInfo.address.city).toEqual('Bellaterra');
    });
    it('ows:ServiceProvider address country is correct', function() {
      expect(contactInfo.address.country).toEqual('Spain');
    });
    it('ows:ServiceProvider address deliveryPoint is correct', function() {
      expect(contactInfo.address.deliveryPoint).toEqual('Fac Ciencies UAB');
    });
    it('ows:ServiceProvider address electronicMailAddress is correct',
      function() {
        var email = 'joan.maso@uab.es';
        expect(contactInfo.address.electronicMailAddress).toEqual(email);
      }
    );
    it('ows:ServiceProvider address postalCode is correct', function() {
      expect(contactInfo.address.postalCode).toEqual('08193');
    });
    it('ows:ServiceProvider phone voice is correct', function() {
      expect(contactInfo.phone.voice).toEqual('+34 93 581 1312');
    });
    it('ows:OperationsMetadata GetCapabilities url is correct', function() {
      var dcp = operationsMetadata.GetCapabilities.dcp;
      var url = 'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?';
      expect(dcp.http.get[0].url).toEqual(url);
    });
    it('ows:OperationsMetadata GetCapabilities Constraints Get is correct',
      function() {
        var dcp = operationsMetadata.GetCapabilities.dcp;
        expect(dcp.http.get[0].constraints.GetEncoding.allowedValues).toEqual(
        {'KVP': true});
      }
    );
    it('ows:OperationsMetadata GetFeatureInfo url is correct', function() {
      var url = 'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?';
      var dcp = operationsMetadata.GetFeatureInfo.dcp;
      expect(dcp.http.get[0].url).toEqual(url);
    });
    it('ows:OperationsMetadata GetFeatureInfo Constraints Get is correct',
      function() {
        var dcp = operationsMetadata.GetFeatureInfo.dcp;
        expect(dcp.http.get[0].constraints).toBeUndefined();
      }
    );
    it('ows:OperationsMetadata GetTile url is correct', function() {
      var url = 'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?';
      expect(operationsMetadata.GetTile.dcp.http.get[0].url).toEqual(url);
    });
    it('ows:OperationsMetadata GetTile Constraints Get is correct', function() {
      var dcp = operationsMetadata.GetTile.dcp;
      expect(dcp.http.get[0].constraints).toBeUndefined();
    });
  });
  describe('test layers', function() {
    var obj, url, contents, layer, wgs84Bbox, dimensions;
    url = 'spec/ol/parser/ogc/xml/wmtscapabilities_v1_0_0/ogcsample.xml';
    goog.net.XhrIo.send(url, function(e) {
      var xhr = e.target;
      obj = parser.read(xhr.getResponseXml());
      contents = obj.contents;
      layer = contents.layers[0];
      wgs84Bbox = layer.bounds;
      dimensions = layer.dimensions;
    });

    it('correct count of layers', function() {
      expect(contents.layers.length).toEqual(1);
    });
    it('layer abstract is correct', function() {
      expect(layer['abstract']).toEqual('Coastline/shorelines (BA010)');
    });
    it('layer identifier is correct', function() {
      expect(layer.identifier).toEqual('coastlines');
    });
    it('layer title is correct', function() {
      expect(layer.title).toEqual('Coastlines');
    });
    it('correct count of formats', function() {
      expect(layer.formats.length).toEqual(2);
    });
    it('format image/png is correct', function() {
      expect(layer.formats[0]).toEqual('image/png');
    });
    it('format image/gif is correct', function() {
      expect(layer.formats[1]).toEqual('image/gif');
    });
    it('correct count of styles', function() {
      expect(layer.styles.length).toEqual(2);
    });
    it('style 0 identifier is correct', function() {
      expect(layer.styles[0].identifier).toEqual('DarkBlue');
    });
    it('style 0 isDefault is correct', function() {
      expect(layer.styles[0].isDefault).toBeTruthy();
    });
    it('style 0 title is correct', function() {
      expect(layer.styles[0].title).toEqual('Dark Blue');
    });
    it('style 0 legend href is correct', function() {
      var url = 'http://www.miramon.uab.es/wmts/Coastlines/' +
        'coastlines_darkBlue.png';
      expect(layer.styles[0].legend.href).toEqual(url);
    });
    it('style 0 legend format is correct', function() {
      expect(layer.styles[0].legend.format).toEqual('image/png');
    });
    it('style 1 identifier is correct', function() {
      expect(layer.styles[1].identifier).toEqual('thickAndRed');
    });
    it('style 1 isDefault is correct', function() {
      expect(!layer.styles[1].isDefault).toBeTruthy();
    });
    it('style 1 title is correct', function() {
      expect(layer.styles[1].title).toEqual('Thick And Red');
    });
    it('style 1 legend is not set', function() {
      expect(layer.styles[1].legend).toBeUndefined();
    });
    it('correct count of tileMatrixSetLinks', function() {
      expect(layer.tileMatrixSetLinks.length).toEqual(1);
    });
    it('tileMatrixSet is correct', function() {
      expect(layer.tileMatrixSetLinks[0].tileMatrixSet).toEqual('BigWorld');
    });
    it('wgs84BoudingBox instance of ol.Extent', function() {
      expect(wgs84Bbox instanceof ol.Extent).toBeTruthy();
    });
    it('wgs84BoudingBox minX is correct', function() {
      expect(wgs84Bbox.minX).toEqual(-180.0);
    });
    it('wgs84BoudingBox maxX is correct', function() {
      expect(wgs84Bbox.maxX).toEqual(180.0);
    });
    it('wgs84BoudingBox minY is correct', function() {
      expect(wgs84Bbox.minY).toEqual(-90.0);
    });
    it('wgs84BoudingBox maxY is correct', function() {
      expect(wgs84Bbox.maxY).toEqual(90.0);
    });
    it('resourceUrl.tile.format is correct', function() {
      expect(layer.resourceUrl.tile.format).toEqual('image/png');
    });
    it('resourceUrl.tile.template is correct', function() {
      var tpl = 'http://www.example.com/wmts/coastlines/{TileMatrix}/' +
          '{TileRow}/{TileCol}.png';
      expect(layer.resourceUrl.tile.template).toEqual(tpl);
    });
    it('resourceUrl.FeatureInfo.format is correct', function() {
      var format = 'application/gml+xml; version=3.1';
      expect(layer.resourceUrl.FeatureInfo.format).toEqual(format);
    });
    it('resourceUrl.FeatureInfo.template is correct', function() {
      var tpl = 'http://www.example.com/wmts/coastlines/{TileMatrixSet}/' +
          '{TileMatrix}/{TileRow}/{TileCol}/{J}/{I}.xml';
      expect(layer.resourceUrl.FeatureInfo.template).toEqual(tpl);
    });
    it('resourceUrls[0].format is correct', function() {
      expect(layer.resourceUrls[0].format).toEqual('image/png');
    });
    it('resourceUrls[0].resourceType is correct', function() {
      expect(layer.resourceUrls[0].resourceType).toEqual('tile');
    });
    it('resourceUrls[0].template is correct', function() {
      var tpl = 'http://www.example.com/wmts/coastlines/{TileMatrix}/' +
          '{TileRow}/{TileCol}.png';
      expect(layer.resourceUrls[0].template).toEqual(tpl);
    });
    it('resourceUrls[1].format is correct', function() {
      var format = 'application/gml+xml; version=3.1';
      expect(layer.resourceUrls[1].format).toEqual(format);
    });
    it('resourceUrls[1].resourceType is correct', function() {
      expect(layer.resourceUrls[1].resourceType).toEqual('FeatureInfo');
    });
    it('resourceUrls[1].template is correct', function() {
      var tpl = 'http://www.example.com/wmts/coastlines/{TileMatrixSet}/' +
          '{TileMatrix}/{TileRow}/{TileCol}/{J}/{I}.xml';
      expect(layer.resourceUrls[1].template).toEqual(tpl);
    });
    it('correct count of dimensions', function() {
      expect(dimensions.length).toEqual(1);
    });
    it('first dimension title is correct', function() {
      expect(dimensions[0].title).toEqual('Time');
    });
    it('first dimension abstract is correct', function() {
      expect(dimensions[0]['abstract']).toEqual('Monthly datasets');
    });
    it('first dimension identifier is correct', function() {
      expect(dimensions[0].identifier).toEqual('TIME');
    });
    it('first dimension default is correct', function() {
      expect(dimensions[0]['default']).toEqual('default');
    });
    it('first dimension has correct count of values', function() {
      expect(dimensions[0].values.length).toEqual(3);
    });
    it('first value is correct', function() {
      expect(dimensions[0].values[0]).toEqual('2007-05');
    });
    it('second value is correct', function() {
      expect(dimensions[0].values[1]).toEqual('2007-06');
    });
    it('second value is correct', function() {
      expect(dimensions[0].values[1]).toEqual('2007-06');
    });
    it('third value is correct', function() {
      expect(dimensions[0].values[2]).toEqual('2007-07');
    });
  });
  describe('test tileMatrixSets', function() {
    var obj, url, tileMatrixSets, bigWorld;
    url = 'spec/ol/parser/ogc/xml/wmtscapabilities_v1_0_0/ogcsample.xml';
    goog.net.XhrIo.send(url, function(e) {
      var xhr = e.target;
      obj = parser.read(xhr.getResponseXml());
      tileMatrixSets = obj.contents.tileMatrixSets;
      bigWorld = tileMatrixSets['BigWorld'];
    });
    it('tileMatrixSets BigWorld found', function() {
      expect(bigWorld).toBeDefined();
    });
    it('tileMatrixSets identifier is correct', function() {
      expect(bigWorld.identifier).toEqual('BigWorld');
    });
    it('tileMatrix count is correct', function() {
      expect(bigWorld.matrixIds.length).toEqual(2);
    });
    it('tileMatrix 0 identifier is correct', function() {
      expect(bigWorld.matrixIds[0].identifier).toEqual('1e6');
    });
    it('tileMatrix 0 matrixHeight is correct', function() {
      expect(bigWorld.matrixIds[0].matrixHeight).toEqual(50000);
    });
    it('tileMatrix 0 matrixWidth is correct', function() {
      expect(bigWorld.matrixIds[0].matrixWidth).toEqual(60000);
    });
    it('tileMatrix 0 scaleDenominator is correct', function() {
      expect(bigWorld.matrixIds[0].scaleDenominator).toEqual(1000000);
    });
    it('tileMatrix 0 tileWidth is correct', function() {
      expect(bigWorld.matrixIds[0].tileWidth).toEqual(256);
    });
    it('tileMatrix 0 tileHeight is correct', function() {
      expect(bigWorld.matrixIds[0].tileHeight).toEqual(256);
    });
    it('tileMatrix 0 topLeftCorner.x is correct', function() {
      expect(bigWorld.matrixIds[0].topLeftCorner.x).toEqual(-180);
    });
    it('tileMatrix 0 topLeftCorner.y is correct', function() {
      expect(bigWorld.matrixIds[0].topLeftCorner.y).toEqual(84);
    });
    it('tileMatrix 1 identifier is correct', function() {
      expect(bigWorld.matrixIds[1].identifier).toEqual('2.5e6');
    });
    it('tileMatrix 1 matrixHeight is correct', function() {
      expect(bigWorld.matrixIds[1].matrixHeight).toEqual(7000);
    });
    it('tileMatrix 1 matrixWidth is correct', function() {
      expect(bigWorld.matrixIds[1].matrixWidth).toEqual(9000);
    });
    it('tileMatrix 1 scaleDenominator is correct', function() {
      expect(bigWorld.matrixIds[1].scaleDenominator).toEqual(2500000);
    });
    it('tileMatrix 1 tileWidth is correct', function() {
      expect(bigWorld.matrixIds[1].tileWidth).toEqual(256);
    });
    it('tileMatrix 1 tileHeight is correct', function() {
      expect(bigWorld.matrixIds[1].tileHeight).toEqual(256);
    });
    it('tileMatrix 1 topLeftCorner.x is correct', function() {
      expect(bigWorld.matrixIds[1].topLeftCorner.x).toEqual(-180);
    });
    it('tileMatrix 1 topLeftCorner.y is correct', function() {
      expect(bigWorld.matrixIds[1].topLeftCorner.y).toEqual(84);
    });
  });
});

goog.require('goog.net.XhrIo');
goog.require('ol.parser.ogc.WMTSCapabilities');
