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
});

goog.require('goog.net.XhrIo');
goog.require('ol.parser.ogc.WMTSCapabilities');
