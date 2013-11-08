goog.provide('ol.test.parser.ogc.WMSCapabilities_v1_3_0');

describe('ol.parser.ogc.wmscapabilities_v1_3_0', function() {

  var parser = new ol.parser.ogc.WMSCapabilities();

  describe('test read exception', function() {
    it('Error reported correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_3_0/' +
          'exceptionsample.xml';
      afterLoadXml(url, function(xml) {
        var result;
        result = parser.read(xml);
        expect(!!result.error).to.be(true);
        done();
      });
    });
  });

  describe('test read', function() {
    it('Test read', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_3_0/ogcsample.xml';
      afterLoadXml(url, function(xml) {
        var obj, capability, layers = {}, rootlayer, identifiers, authorities;
        var featurelist, time, elevation, service, contactinfo, personPrimary,
            addr, request, exception, attribution, keywords, metadataURLs;
        obj = parser.read(xml);
        capability = obj.capability;
        for (var i = 0, len = capability.layers.length; i < len; i++) {
          if ('name' in capability.layers[i]) {
            layers[capability.layers[i].name] = capability.layers[i];
          }
        }
        rootlayer = capability.layers[capability.layers.length - 1];
        identifiers = layers['ROADS_RIVERS'].identifiers;
        authorities = layers['ROADS_RIVERS'].authorityURLs;
        featurelist = layers['ROADS_RIVERS'].featureListURL;
        time = layers['Clouds'].dimensions.time;
        elevation = layers['Pressure'].dimensions.elevation;
        service = obj.service;
        contactinfo = service.contactInformation;
        personPrimary = contactinfo.personPrimary;
        addr = contactinfo.contactAddress;
        request = obj.capability.request;
        exception = obj.capability.exception;
        attribution = capability.layers[2].attribution;
        keywords = capability.layers[0].keywords;
        metadataURLs = capability.layers[0].metadataURLs;
        expect(rootlayer.srs).to.eql({'CRS:84': true});
        var srs = {'CRS:84': true, 'EPSG:26986': true};
        expect(layers['ROADS_RIVERS'].srs).to.eql(srs);
        expect(layers['Temperature'].srs).to.eql({'CRS:84': true});
        var infoFormats = ['text/xml', 'text/plain', 'text/html'];
        expect(layers['Temperature'].infoFormats).to.eql(infoFormats);
        var bbox = layers['ROADS_RIVERS'].bbox['EPSG:26986'];
        expect(bbox.bbox).to.eql([189000, 834000, 285000, 962000]);
        expect(bbox.res).to.eql({x: 1, y: 1});
        bbox = layers['ROADS_RIVERS'].bbox['CRS:84'];
        expect(bbox.bbox).to.eql([-71.63, 41.75, -70.78, 42.90]);
        expect(bbox.res).to.eql({x: 0.01, y: 0.01});
        bbox = layers['ROADS_1M'].bbox['EPSG:26986'];
        expect(bbox.bbox).to.eql([189000, 834000, 285000, 962000]);
        expect(bbox.res).to.eql({x: 1, y: 1});
        expect(identifiers).to.be.ok();
        expect('DIF_ID' in identifiers).to.be.ok();
        expect(identifiers['DIF_ID']).to.eql('123456');
        expect('DIF_ID' in authorities).to.be.ok();
        var url = 'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html';
        expect(authorities['DIF_ID']).to.eql(url);
        expect(featurelist).to.be.ok();
        expect(featurelist.format).to.eql('XML');
        url = 'http://www.university.edu/data/roads_rivers.gml';
        expect(featurelist.href).to.eql(url);
        expect(layers['Pressure'].queryable).to.be.ok();
        expect(layers['ozone_image'].queryable).to.not.be();
        expect(layers['population'].cascaded).to.eql(1);
        expect(layers['ozone_image'].fixedWidth).to.eql(512);
        expect(layers['ozone_image'].fixedHeight).to.eql(256);
        expect(layers['ozone_image'].opaque).to.be.ok();
        expect(layers['ozone_image'].noSubsets).to.be.ok();
        expect(time['default']).to.eql('2000-08-22');
        expect(time.values.length).to.eql(1);
        expect(time.values[0]).to.eql('1999-01-01/2000-08-22/P1D');
        expect(elevation.units).to.eql('CRS:88');
        expect(elevation['default']).to.eql('0');
        expect(elevation.nearestVal).to.be.ok();
        expect(elevation.multipleVal).to.not.be();
        expect(elevation.values).to.eql(
            ['0', '1000', '3000', '5000', '10000']);
        expect(contactinfo).to.be.ok();
        expect(personPrimary).to.be.ok();
        expect(personPrimary.person).to.eql('Jeff Smith');
        expect(personPrimary.organization).to.eql('NASA');
        expect(contactinfo.position).to.eql('Computer Scientist');
        expect(addr).to.be.ok();
        expect(addr.type).to.eql('postal');
        expect(addr.address).to.eql('NASA Goddard Space Flight Center');
        expect(addr.city).to.eql('Greenbelt');
        expect(addr.stateOrProvince).to.eql('MD');
        expect(addr.postcode).to.eql('20771');
        expect(addr.country).to.eql('USA');
        expect(contactinfo.phone).to.eql('+1 301 555-1212');
        expect(contactinfo.email).to.eql('user@host.com');
        expect('fees' in service).to.not.be();
        expect('accessConstraints' in service).to.not.be();
        expect(request).to.be.ok();
        expect('getmap' in request).to.be.ok();
        expect('getfeatureinfo' in request).to.be.ok();
        var formats = ['text/xml', 'text/plain', 'text/html'];
        expect(request.getfeatureinfo.formats).to.eql(formats);
        expect(exception).to.be.ok();
        formats = ['XML', 'INIMAGE', 'BLANK'];
        expect(exception.formats).to.eql(formats);
        expect(attribution.title).to.eql('State College University');
        expect(attribution.href).to.eql('http://www.university.edu/');
        url = 'http://www.university.edu/icons/logo.gif';
        expect(attribution.logo.href).to.eql(url);
        expect(attribution.logo.format).to.eql('image/gif');
        expect(attribution.logo.width).to.eql('100');
        expect(attribution.logo.height).to.eql('100');
        expect(keywords.length).to.eql(3);
        expect(keywords[0].value).to.eql('road');
        expect(metadataURLs.length).to.eql(2);
        expect(metadataURLs[0].type).to.eql('FGDC:1998');
        expect(metadataURLs[0].format).to.eql('text/plain');
        url = 'http://www.university.edu/metadata/roads.txt';
        expect(metadataURLs[0].href).to.eql(url);
        var minScale = 250000;
        expect(capability.layers[0].minScale).to.eql(minScale.toPrecision(16));
        var maxScale = 1000;
        expect(capability.layers[0].maxScale).to.eql(maxScale.toPrecision(16));
        expect(obj.service.layerLimit).to.eql(16);
        expect(obj.service.maxHeight).to.eql(2048);
        expect(obj.service.maxWidth).to.eql(2048);
        done();
      });
    });
  });
});

goog.require('ol.parser.ogc.WMSCapabilities');
