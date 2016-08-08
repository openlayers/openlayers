goog.provide('ol.test.format.OWS');

goog.require('ol.format.OWS');
goog.require('ol.xml');


describe('ol.format.OWS 1.1', function() {

  var parser = new ol.format.OWS();

  it('should read ServiceProvider tag properly', function() {
    var doc = ol.xml.parse(
        '<ows:GetCapabilities xmlns:ows="http://www.opengis.net/ows/1.1" ' +
        'xmlns:xlink="http://www.w3.org/1999/xlink" >' +
        '<ows:ServiceProvider>' +
        '<ows:ProviderName>MiraMon</ows:ProviderName>' +
                    '<ows:ProviderSite ' +
                    'xlink:href="http://www.creaf.uab.es/miramon"/>' +
                    '<ows:ServiceContact>' +
                        '<ows:IndividualName>Joan Maso Pau' +
                        '</ows:IndividualName>' +
                        '<ows:PositionName>Senior Software Engineer' +
                        '</ows:PositionName>' +
                        '<ows:ContactInfo>' +
                            '<ows:Phone>' +
                                '<ows:Voice>+34 93 581 1312</ows:Voice>' +
                                '<ows:Facsimile>+34 93 581 4151' +
                                '</ows:Facsimile>' +
                            '</ows:Phone>' +
                            '<ows:Address>' +
                                '<ows:DeliveryPoint>Fac Ciencies UAB' +
                                '</ows:DeliveryPoint>' +
                                '<ows:City>Bellaterra</ows:City>' +
                                '<ows:AdministrativeArea>Barcelona' +
                                '</ows:AdministrativeArea>' +
                                '<ows:PostalCode>08193</ows:PostalCode>' +
                                '<ows:Country>Spain</ows:Country>' +
                                '<ows:ElectronicMailAddress>joan.maso@uab.es' +
                                '</ows:ElectronicMailAddress>' +
                            '</ows:Address>' +
                        '</ows:ContactInfo>' +
                    '</ows:ServiceContact>' +
                '</ows:ServiceProvider>' +
            '</ows:GetCapabilities>'
        );

    var obj = parser.read(doc);
    expect(obj).to.be.ok();
    var serviceProvider = obj.ServiceProvider;
    expect(serviceProvider).to.be.ok();
    expect(serviceProvider.ProviderName).to.eql('MiraMon');
    var url = 'http://www.creaf.uab.es/miramon';
    expect(serviceProvider.ProviderSite).to.eql(url);
    var name = 'Joan Maso Pau';
    expect(serviceProvider.ServiceContact.IndividualName).to.eql(name);
    var position = 'Senior Software Engineer';
    expect(serviceProvider.ServiceContact.PositionName).to.eql(position);
  });

  it('should read ServiceIdentification tag properly', function() {
    var doc = ol.xml.parse(
        '<ows:GetCapabilities xmlns:ows="http://www.opengis.net/ows/1.1" ' +
        'xmlns:xlink="http://www.w3.org/1999/xlink" >' +
        '<ows:ServiceIdentification>' +
            '<ows:Title>Web Map Tile Service</ows:Title>' +
            '<ows:Abstract>Service that contrains the map access interface ' +
            'to some TileMatrixSets</ows:Abstract>' +
            '<ows:Keywords>' +
                '<ows:Keyword>tile</ows:Keyword>' +
                '<ows:Keyword>tile matrix set</ows:Keyword>' +
                '<ows:Keyword>map</ows:Keyword>' +
            '</ows:Keywords>' +
            '<ows:ServiceType>OGC WMTS</ows:ServiceType>' +
            '<ows:ServiceTypeVersion>1.0.0</ows:ServiceTypeVersion>' +
            '<ows:Fees>none</ows:Fees>' +
            '<ows:AccessConstraints>none</ows:AccessConstraints>' +
        '</ows:ServiceIdentification>' +
        '</ows:GetCapabilities>'
        );
    var obj = parser.readFromNode(doc.firstChild);
    expect(obj).to.be.ok();

    var serviceIdentification = obj.ServiceIdentification;
    expect(serviceIdentification).to.be.ok();
    expect(serviceIdentification.Title).to.eql('Web Map Tile Service');
    expect(serviceIdentification.ServiceTypeVersion).to.eql('1.0.0');
    expect(serviceIdentification.ServiceType).to.eql('OGC WMTS');
  });

  it('should read OperationsMetadata tag properly', function() {
    var doc = ol.xml.parse(
        '<ows:GetCapabilities xmlns:ows="http://www.opengis.net/ows/1.1" ' +
        'xmlns:xlink="http://www.w3.org/1999/xlink" >' +
        '<ows:OperationsMetadata>' +
            '<ows:Operation name="GetCapabilities">' +
                '<ows:DCP>' +
                    '<ows:HTTP>' +
                        '<ows:Get xlink:href=' +
                        '"http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?">' +
                            '<ows:Constraint name="GetEncoding">' +
                                '<ows:AllowedValues>' +
                                    '<ows:Value>KVP</ows:Value>' +
                                    '<ows:Value>SOAP</ows:Value>' +
                                '</ows:AllowedValues>' +
                            '</ows:Constraint>' +
                        '</ows:Get>' +
                    '</ows:HTTP>' +
                '</ows:DCP>' +
            '</ows:Operation>' +
            '<ows:Operation name="GetTile">' +
                '<ows:DCP>' +
                    '<ows:HTTP>' +
                        '<ows:Get xlink:href="http://www.miramon.uab.es/cgi-' +
                        'bin/MiraMon5_0.cgi?"/>' +
                        '<ows:Get xlink:href="http://www.miramon.uab.es/cgi-' +
                        'bin/MiraMon6_0.cgi?"/>' +
                        '<ows:Post xlink:href="http://www.miramon.uab.es/cgi-' +
                        'bin/MiraMon7_0.cgi?"/>' +
                    '</ows:HTTP>' +
                '</ows:DCP>' +
            '</ows:Operation>' +
            '<ows:Operation name="GetFeatureInfo">' +
                '<ows:DCP>' +
                    '<ows:HTTP>' +
                        '<ows:Get xlink:href="http://www.miramon.uab.es/cgi-' +
                        'bin/MiraMon5_0.cgi?"/>' +
                    '</ows:HTTP>' +
                '</ows:DCP>' +
            '</ows:Operation>' +
        '</ows:OperationsMetadata>' +
        '</ows:GetCapabilities>'
        );
    var obj = parser.readFromNode(doc.firstChild);
    expect(obj).to.be.ok();

    var operationsMetadata = obj.OperationsMetadata;
    expect(operationsMetadata).to.be.ok();
    var getCap = operationsMetadata.GetCapabilities;
    var dcp = getCap.DCP;
    var url = 'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?';
    expect(dcp.HTTP.Get[0].href).to.eql(url);
    expect(dcp.HTTP.Get[0].Constraint[0].name).to.eql('GetEncoding');
    expect(dcp.HTTP.Get[0].Constraint[0].AllowedValues.Value[0]).to.eql('KVP');

    url = 'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?';
    dcp = operationsMetadata.GetFeatureInfo.DCP;
    expect(dcp.HTTP.Get[0].href).to.eql(url);
    expect(dcp.HTTP.Get[0].Constraint).to.be(undefined);

    url = 'http://www.miramon.uab.es/cgi-bin/MiraMon5_0.cgi?';
    dcp = operationsMetadata.GetTile.DCP;
    expect(dcp.HTTP.Get[0].href).to.eql(url);
    expect(dcp.HTTP.Get[0].Constraint).to.be(undefined);
  });

});
