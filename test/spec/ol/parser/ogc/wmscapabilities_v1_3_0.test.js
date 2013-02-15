goog.provide('ol.test.parser.ogc.WMSCapabilities_v1_3_0');

describe('ol.parser.ogc.wmscapabilities_v1_3_0', function() {

  var parser = new ol.parser.ogc.WMSCapabilities();

  var obj, capability, layers = {}, rootlayer, identifiers, authorities;
  var featurelist, time, elevation, service, contactinfo, personPrimary, addr;
  var request, exception, attribution, keywords, metadataURLs, url;
  url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_3_0/ogcsample.xml';
  goog.net.XhrIo.send(url, function(e) {
      var xhr = e.target;
      obj = parser.read(xhr.getResponseXml());
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
  });

  describe('test read exception', function() {
    var result, url;
    url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_3_0/exceptionsample.xml';
    goog.net.XhrIo.send(url, function(e) {
      var xhr = e.target;
      result = parser.read(xhr.getResponseXml());
    });
    it('Error reported correctly', function() {
      expect(!!result.error).toBe(true);
    });
  });

  describe('test layers', function() {
    it('SRS parsed correctly for root layer', function() {
      expect(rootlayer.srs).toEqual({'CRS:84': true});
    });
    it('Inheritance of SRS handled correctly when adding SRSes', function() {
      var srs = {'CRS:84': true, 'EPSG:26986': true};
      expect(layers['ROADS_RIVERS'].srs).toEqual(srs);
    });
    it('Inheritance of SRS handled correctly when redeclaring an' +
      ' inherited SRS', function() {
        expect(layers['Temperature'].srs).toEqual({'CRS:84': true});
    });
    it('infoFormats set correctly on layer', function() {
      var infoFormats = ['text/xml', 'text/plain', 'text/html'];
      expect(layers['Temperature'].infoFormats).toEqual(infoFormats);
    });
    it('Correct resolution and bbox from BoundingBox', function() {
      var bbox = layers['ROADS_RIVERS'].bbox['EPSG:26986'];
      expect(bbox.bbox).toEqual([189000, 834000, 285000, 962000]);
      expect(bbox.res).toEqual({x: 1, y: 1});
    });
    it('Correct resolution and bbox from BoundingBox (override)', function() {
      var bbox = layers['ROADS_RIVERS'].bbox['CRS:84'];
      expect(bbox.bbox).toEqual([-71.63, 41.75, -70.78, 42.90]);
      expect(bbox.res).toEqual({x: 0.01, y: 0.01});
    });
    it('Correctly inherited bbox and resolution', function() {
      var bbox = layers['ROADS_1M'].bbox['EPSG:26986'];
      expect(bbox.bbox).toEqual([189000, 834000, 285000, 962000]);
      expect(bbox.res).toEqual({x: 1, y: 1});
    });
    it('got identifiers from layer ROADS_RIVERS', function() {
      expect(identifiers).toBeTruthy();
    });
    it('authority attribute from Identifiers parsed correctly', function() {
      expect('DIF_ID' in identifiers).toBeTruthy();
    });
    it('Identifier value parsed correctly', function() {
      expect(identifiers['DIF_ID']).toEqual('123456');
    });
    it('AuthorityURLs parsed and inherited correctly', function() {
      expect('DIF_ID' in authorities).toBeTruthy();
    });
    it('OnlineResource in AuthorityURLs parsed correctly', function() {
      var url = 'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html';
      expect(authorities['DIF_ID']).toEqual(url);
    });
    it('layer has FeatureListURL', function() {
      expect(featurelist).toBeTruthy();
    });
    it('FeatureListURL format parsed correctly', function() {
      expect(featurelist.format).toEqual('XML');
    });
    it('FeatureListURL OnlineResource parsed correctly', function() {
      var url = 'http://www.university.edu/data/roads_rivers.gml';
      expect(featurelist.href).toEqual(url);
    });
    it('queryable property inherited correctly', function() {
      expect(layers['Pressure'].queryable).toBeTruthy();
    });
    it('queryable property has correct default value', function() {
      expect(layers['ozone_image'].queryable).toBeFalsy();
    });
    it('cascaded property parsed correctly', function() {
      expect(layers['population'].cascaded).toEqual(1);
    });
    it('fixedWidth property correctly parsed', function() {
      expect(layers['ozone_image'].fixedWidth).toEqual(512);
    });
    it('fixedHeight property correctly parsed', function() {
      expect(layers['ozone_image'].fixedHeight).toEqual(256);
    });
    it('opaque property parsed correctly', function() {
      expect(layers['ozone_image'].opaque).toBeTruthy();
    });
    it('noSubsets property parsed correctly', function() {
      expect(layers['ozone_image'].noSubsets).toBeTruthy();
    });
  });

  describe('test dimensions', function() {
    it('Default time value parsed correctly', function() {
      expect(time['default']).toEqual('2000-08-22');
    });
    it('Currect number of time extent values/periods', function() {
      expect(time.values.length).toEqual(1);
    });
    it('Time extent values parsed correctly', function() {
      expect(time.values[0]).toEqual('1999-01-01/2000-08-22/P1D');
    });
    it('Dimension units parsed correctly', function() {
      expect(elevation.units).toEqual('CRS:88');
    });
    it('Default elevation value parsed correctly', function() {
      expect(elevation['default']).toEqual('0');
    });
    it('NearestValue parsed correctly', function() {
      expect(elevation.nearestVal).toBeTruthy();
    });
    it('Absense of MultipleValues handled correctly', function() {
      expect(elevation.multipleVal).toBeFalsy();
    });
    it('Parsing of comma-separated values done correctly', function() {
      expect(elevation.values).toEqual(['0', '1000', '3000', '5000', '10000']);
    });
  });

  describe('test contact info', function() {
    it('object contains contactInformation property', function() {
      expect(contactinfo).toBeTruthy();
    });
    it('object contains personPrimary property', function() {
      expect(personPrimary).toBeTruthy();
    });
    it('ContactPerson parsed correctly', function() {
      expect(personPrimary.person).toEqual('Jeff Smith');
    });
    it('ContactOrganization parsed correctly', function() {
      expect(personPrimary.organization).toEqual('NASA');
    });
    it('ContactPosition parsed correctly', function() {
      expect(contactinfo.position).toEqual('Computer Scientist');
    });
    it('object contains contactAddress property', function() {
      expect(addr).toBeTruthy();
    });
    it('AddressType parsed correctly', function() {
      expect(addr.type).toEqual('postal');
    });
    it('Address parsed correctly', function() {
      expect(addr.address).toEqual('NASA Goddard Space Flight Center');
    });
    it('City parsed correctly', function() {
      expect(addr.city).toEqual('Greenbelt');
    });
    it('StateOrProvince parsed correctly', function() {
      expect(addr.stateOrProvince).toEqual('MD');
    });
    it('PostCode parsed correctly', function() {
      expect(addr.postcode).toEqual('20771');
    });
    it('Country parsed correctly', function() {
      expect(addr.country).toEqual('USA');
    });
    it('ContactVoiceTelephone parsed correctly', function() {
      expect(contactinfo.phone).toEqual('+1 301 555-1212');
    });
    it('ContactElectronicMailAddress parsed correctly', function() {
      expect(contactinfo.email).toEqual('user@host.com');
    });
  });

  describe('test fees and constraints', function() {
    it('Fees=none handled correctly', function() {
      expect('fees' in service).toBeFalsy();
    });
    it('AccessConstraints=none handled correctly', function() {
      expect('accessConstraints' in service).toBeFalsy();
    });
  });

  describe('test requests', function() {
    it('request property exists', function() {
      expect(request).toBeTruthy();
    });
    it('got GetMap request', function() {
      expect('getmap' in request).toBeTruthy();
    });
    it('got GetFeatureInfo request', function() {
      expect('getfeatureinfo' in request).toBeTruthy();
    });
    it('GetFeatureInfo formats correctly parsed', function() {
      var formats = ['text/xml', 'text/plain', 'text/html'];
      expect(request.getfeatureinfo.formats).toEqual(formats);
    });
    it('exception property exists', function() {
      expect(exception).toBeTruthy();
    });
    it('Exception Format parsed', function() {
      var formats = ['XML', 'INIMAGE', 'BLANK'];
      expect(exception.formats).toEqual(formats);
    });
  });

  describe('test ogc', function() {
    it('attribution title parsed correctly.', function() {
      expect(attribution.title).toEqual('State College University');
    });
    it('attribution href parsed correctly.', function() {
      expect(attribution.href).toEqual('http://www.university.edu/');
    });
    it('attribution logo url parsed correctly.', function() {
      var url = 'http://www.university.edu/icons/logo.gif';
      expect(attribution.logo.href).toEqual(url);
    });
    it('attribution logo format parsed correctly.', function() {
      expect(attribution.logo.format).toEqual('image/gif');
    });
    it('attribution logo width parsed correctly.', function() {
      expect(attribution.logo.width).toEqual('100');
    });
    it('attribution logo height parsed correctly.', function() {
      expect(attribution.logo.height).toEqual('100');
    });
    it('layer has 3 keywords.', function() {
      expect(keywords.length).toEqual(3);
    });
    it('1st keyword parsed correctly.', function() {
      expect(keywords[0].value).toEqual('road');
    });
    it('layer has 2 metadata urls.', function() {
      expect(metadataURLs.length).toEqual(2);
    });
    it('type parsed correctly.', function() {
      expect(metadataURLs[0].type).toEqual('FGDC:1998');
    });
    it('format parsed correctly.', function() {
      expect(metadataURLs[0].format).toEqual('text/plain');
    });
    it('href parsed correctly.', function() {
      var url = 'http://www.university.edu/metadata/roads.txt';
      expect(metadataURLs[0].href).toEqual(url);
    });
    it('layer.minScale is correct', function() {
      var minScale = 250000;
      expect(capability.layers[0].minScale).toEqual(minScale.toPrecision(16));
    });
    it('layer.maxScale is correct', function() {
      var maxScale = 1000;
      expect(capability.layers[0].maxScale).toEqual(maxScale.toPrecision(16));
    });
  });

  describe('test WMS 1.3 specials', function() {
    it('LayerLimit parsed correctly', function() {
      expect(obj.service.layerLimit).toEqual(16);
    });
    it('MaxHeight parsed correctly', function() {
      expect(obj.service.maxHeight).toEqual(2048);
    });
    it('MaxWidth parsed correctly', function() {
      expect(obj.service.maxWidth).toEqual(2048);
    });
  });

});

goog.require('goog.net.XhrIo');
goog.require('ol.parser.ogc.WMSCapabilities');
