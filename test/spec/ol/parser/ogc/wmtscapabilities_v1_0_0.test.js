goog.provide('ol.test.parser.ogc.WMTSCapabilities_v1_0_0');

describe('ol.parser.ogc.wmtscapabilities_v1_0_0', function() {

  var parser = new ol.parser.ogc.WMTSCapabilities();

  describe('test ows', function() {
    it('Test ows', function(done) {
      var obj, serviceIdentification, serviceProvider, operationsMetadata,
          contactInfo;

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

      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000, function() {
        expect(serviceIdentification.title).to.eql('Web Map Tile Service');
        expect(serviceIdentification.serviceTypeVersion).to.eql('1.0.0');
        expect(serviceIdentification.serviceType.value).to.eql('OGC WMTS');
        expect(serviceProvider.providerName).to.eql('MiraMon');
        var url = 'http://www.creaf.uab.es/miramon';
        expect(serviceProvider.providerSite).to.eql(url);
        var name = 'Joan Maso Pau';
        expect(serviceProvider.serviceContact.individualName).to.eql(name);
        var position = 'Senior Software Engineer';
        expect(serviceProvider.serviceContact.positionName).to.eql(position);
        expect(contactInfo.address.administrativeArea).to.eql('Barcelona');
        expect(contactInfo.address.city).to.eql('Bellaterra');
        expect(contactInfo.address.country).to.eql('Spain');
        expect(contactInfo.address.deliveryPoint).to.eql('Fac Ciencies UAB');
        var email = 'joan.maso@uab.es';
        expect(contactInfo.address.electronicMailAddress).to.eql(email);
        expect(contactInfo.address.postalCode).to.eql('08193');
        expect(contactInfo.phone.voice).to.eql('+34 93 581 1312');
        var dcp = operationsMetadata.GetCapabilities.dcp;
        url = 'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?';
        expect(dcp.http.get[0].url).to.eql(url);
        dcp = operationsMetadata.GetCapabilities.dcp;
        expect(dcp.http.get[0].constraints.GetEncoding.allowedValues).to.eql(
            {'KVP': true});
        url = 'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?';
        dcp = operationsMetadata.GetFeatureInfo.dcp;
        expect(dcp.http.get[0].url).to.eql(url);
        dcp = operationsMetadata.GetFeatureInfo.dcp;
        expect(dcp.http.get[0].constraints).to.be(undefined);
        url = 'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?';
        expect(operationsMetadata.GetTile.dcp.http.get[0].url).to.eql(url);
        dcp = operationsMetadata.GetTile.dcp;
        expect(dcp.http.get[0].constraints).to.be(undefined);
        done();
      });
    });
  });
  describe('test layers', function() {
    it('Test layers', function(done) {
      var obj, contents, layer, wgs84Bbox, dimensions;

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

      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000, function() {
        expect(contents.layers.length).to.eql(1);
        expect(layer['abstract']).to.eql('Coastline/shorelines (BA010)');
        expect(layer.identifier).to.eql('coastlines');
        expect(layer.title).to.eql('Coastlines');
        expect(layer.formats.length).to.eql(2);
        expect(layer.formats[0]).to.eql('image/png');
        expect(layer.formats[1]).to.eql('image/gif');
        expect(layer.styles.length).to.eql(2);
        expect(layer.styles[0].identifier).to.eql('DarkBlue');
        expect(layer.styles[0].isDefault).to.be.ok();
        expect(layer.styles[0].title).to.eql('Dark Blue');
        var url = 'http://www.miramon.uab.es/wmts/Coastlines/' +
            'coastlines_darkBlue.png';
        expect(layer.styles[0].legend.href).to.eql(url);
        expect(layer.styles[0].legend.format).to.eql('image/png');
        expect(layer.styles[1].identifier).to.eql('thickAndRed');
        expect(!layer.styles[1].isDefault).to.be.ok();
        expect(layer.styles[1].title).to.eql('Thick And Red');
        expect(layer.styles[1].legend).to.be(undefined);
        expect(layer.tileMatrixSetLinks.length).to.eql(1);
        expect(layer.tileMatrixSetLinks[0].tileMatrixSet).to.eql('BigWorld');
        expect(wgs84Bbox).to.be.an(Array);
        expect(wgs84Bbox[0]).to.eql(-180.0);
        expect(wgs84Bbox[1]).to.eql(180.0);
        expect(wgs84Bbox[2]).to.eql(-90.0);
        expect(wgs84Bbox[3]).to.eql(90.0);
        expect(layer.resourceUrls.hasOwnProperty('tile')).to.be.ok();
        var format = 'image/png';
        expect(layer.resourceUrls.tile.hasOwnProperty(format)).to.be.ok();
        expect(layer.resourceUrls.tile[format].length).to.eql(2);
        var tpl = 'http://a.example.com/wmts/coastlines/{TileMatrix}/' +
            '{TileRow}/{TileCol}.png';
        expect(layer.resourceUrls.tile[format][0]).to.eql(tpl);
        tpl = 'http://b.example.com/wmts/coastlines/{TileMatrix}/' +
            '{TileRow}/{TileCol}.png';
        expect(layer.resourceUrls.tile[format][1]).to.eql(tpl);
        expect(layer.resourceUrls.hasOwnProperty('FeatureInfo')).to.be.ok();
        format = 'application/gml+xml; version=3.1';
        expect(layer.resourceUrls.FeatureInfo.hasOwnProperty(format))
            .to.be.ok();
        expect(layer.resourceUrls.FeatureInfo[format].length).to.eql(1);
        tpl = 'http://www.example.com/wmts/coastlines/{TileMatrixSet}/' +
            '{TileMatrix}/{TileRow}/{TileCol}/{J}/{I}.xml';
        expect(layer.resourceUrls.FeatureInfo[format][0]).to.eql(tpl);
        expect(dimensions.length).to.eql(1);
        expect(dimensions[0].title).to.eql('Time');
        expect(dimensions[0]['abstract']).to.eql('Monthly datasets');
        expect(dimensions[0].identifier).to.eql('TIME');
        expect(dimensions[0]['default']).to.eql('default');
        expect(dimensions[0].values.length).to.eql(3);
        expect(dimensions[0].values[0]).to.eql('2007-05');
        expect(dimensions[0].values[1]).to.eql('2007-06');
        expect(dimensions[0].values[1]).to.eql('2007-06');
        expect(dimensions[0].values[2]).to.eql('2007-07');
        done();
      });
    });
  });
  describe('test tileMatrixSets', function() {
    it('Test tileMatrixSets', function(done) {
      var obj, tileMatrixSets, bigWorld;

      var url = 'spec/ol/parser/ogc/xml/wmtscapabilities_v1_0_0/' +
          'ogcsample.xml';
      goog.net.XhrIo.send(url, function(e) {
        var xhr = e.target;
        obj = parser.read(xhr.getResponseXml());
        tileMatrixSets = obj.contents.tileMatrixSets;
        bigWorld = tileMatrixSets['BigWorld'];
      });

      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000, function() {
        expect(bigWorld).to.not.be(undefined);
        expect(bigWorld.identifier).to.eql('BigWorld');
        expect(bigWorld.matrixIds.length).to.eql(2);
        expect(bigWorld.matrixIds[0].identifier).to.eql('1e6');
        expect(bigWorld.matrixIds[0].matrixHeight).to.eql(50000);
        expect(bigWorld.matrixIds[0].matrixWidth).to.eql(60000);
        expect(bigWorld.matrixIds[0].scaleDenominator).to.eql(1000000);
        expect(bigWorld.matrixIds[0].tileWidth).to.eql(256);
        expect(bigWorld.matrixIds[0].tileHeight).to.eql(256);
        expect(bigWorld.matrixIds[0].topLeftCorner[0]).to.eql(-180);
        expect(bigWorld.matrixIds[0].topLeftCorner[1]).to.eql(84);
        expect(bigWorld.matrixIds[1].identifier).to.eql('2.5e6');
        expect(bigWorld.matrixIds[1].matrixHeight).to.eql(7000);
        expect(bigWorld.matrixIds[1].matrixWidth).to.eql(9000);
        expect(bigWorld.matrixIds[1].scaleDenominator).to.eql(2500000);
        expect(bigWorld.matrixIds[1].tileWidth).to.eql(256);
        expect(bigWorld.matrixIds[1].tileHeight).to.eql(256);
        expect(bigWorld.matrixIds[1].topLeftCorner[0]).to.eql(-180);
        expect(bigWorld.matrixIds[1].topLeftCorner[1]).to.eql(84);
        done();
      });
    });
  });
});

goog.require('goog.net.XhrIo');
goog.require('ol.parser.ogc.WMTSCapabilities');
