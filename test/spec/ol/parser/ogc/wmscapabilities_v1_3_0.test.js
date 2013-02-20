goog.provide('ol.test.parser.ogc.WMSCapabilities_v1_3_0');

describe('ol.parser.ogc.wmscapabilities_v1_3_0', function() {

  var parser = new ol.parser.ogc.WMSCapabilities();

  describe('test read exception', function() {
    it('Error reported correctly', function() {
      var result;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_3_0/' +
            'exceptionsample.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          result = parser.read(xhr.getResponseXml());
        });
      });
      waitsFor(function() {
        return (result !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(!!result.error).toBe(true);
      });
    });
  });

  describe('test read', function() {
    it('Test read', function() {
      var obj, capability, layers = {}, rootlayer, identifiers, authorities;
      var featurelist, time, elevation, service, contactinfo, personPrimary,
          addr, request, exception, attribution, keywords, metadataURLs;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_3_0/ogcsample.xml';
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
      });
      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(rootlayer.srs).toEqual({'CRS:84': true});
        var srs = {'CRS:84': true, 'EPSG:26986': true};
        expect(layers['ROADS_RIVERS'].srs).toEqual(srs);
        expect(layers['Temperature'].srs).toEqual({'CRS:84': true});
        var infoFormats = ['text/xml', 'text/plain', 'text/html'];
        expect(layers['Temperature'].infoFormats).toEqual(infoFormats);
        var bbox = layers['ROADS_RIVERS'].bbox['EPSG:26986'];
        expect(bbox.bbox).toEqual([189000, 834000, 285000, 962000]);
        expect(bbox.res).toEqual({x: 1, y: 1});
        bbox = layers['ROADS_RIVERS'].bbox['CRS:84'];
        expect(bbox.bbox).toEqual([-71.63, 41.75, -70.78, 42.90]);
        expect(bbox.res).toEqual({x: 0.01, y: 0.01});
        bbox = layers['ROADS_1M'].bbox['EPSG:26986'];
        expect(bbox.bbox).toEqual([189000, 834000, 285000, 962000]);
        expect(bbox.res).toEqual({x: 1, y: 1});
        expect(identifiers).toBeTruthy();
        expect('DIF_ID' in identifiers).toBeTruthy();
        expect(identifiers['DIF_ID']).toEqual('123456');
        expect('DIF_ID' in authorities).toBeTruthy();
        var url = 'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html';
        expect(authorities['DIF_ID']).toEqual(url);
        expect(featurelist).toBeTruthy();
        expect(featurelist.format).toEqual('XML');
        url = 'http://www.university.edu/data/roads_rivers.gml';
        expect(featurelist.href).toEqual(url);
        expect(layers['Pressure'].queryable).toBeTruthy();
        expect(layers['ozone_image'].queryable).toBeFalsy();
        expect(layers['population'].cascaded).toEqual(1);
        expect(layers['ozone_image'].fixedWidth).toEqual(512);
        expect(layers['ozone_image'].fixedHeight).toEqual(256);
        expect(layers['ozone_image'].opaque).toBeTruthy();
        expect(layers['ozone_image'].noSubsets).toBeTruthy();
        expect(time['default']).toEqual('2000-08-22');
        expect(time.values.length).toEqual(1);
        expect(time.values[0]).toEqual('1999-01-01/2000-08-22/P1D');
        expect(elevation.units).toEqual('CRS:88');
        expect(elevation['default']).toEqual('0');
        expect(elevation.nearestVal).toBeTruthy();
        expect(elevation.multipleVal).toBeFalsy();
        expect(elevation.values).toEqual(['0', '1000', '3000', '5000',
            '10000']);
        expect(contactinfo).toBeTruthy();
        expect(personPrimary).toBeTruthy();
        expect(personPrimary.person).toEqual('Jeff Smith');
        expect(personPrimary.organization).toEqual('NASA');
        expect(contactinfo.position).toEqual('Computer Scientist');
        expect(addr).toBeTruthy();
        expect(addr.type).toEqual('postal');
        expect(addr.address).toEqual('NASA Goddard Space Flight Center');
        expect(addr.city).toEqual('Greenbelt');
        expect(addr.stateOrProvince).toEqual('MD');
        expect(addr.postcode).toEqual('20771');
        expect(addr.country).toEqual('USA');
        expect(contactinfo.phone).toEqual('+1 301 555-1212');
        expect(contactinfo.email).toEqual('user@host.com');
        expect('fees' in service).toBeFalsy();
        expect('accessConstraints' in service).toBeFalsy();
        expect(request).toBeTruthy();
        expect('getmap' in request).toBeTruthy();
        expect('getfeatureinfo' in request).toBeTruthy();
        var formats = ['text/xml', 'text/plain', 'text/html'];
        expect(request.getfeatureinfo.formats).toEqual(formats);
        expect(exception).toBeTruthy();
        formats = ['XML', 'INIMAGE', 'BLANK'];
        expect(exception.formats).toEqual(formats);
        expect(attribution.title).toEqual('State College University');
        expect(attribution.href).toEqual('http://www.university.edu/');
        url = 'http://www.university.edu/icons/logo.gif';
        expect(attribution.logo.href).toEqual(url);
        expect(attribution.logo.format).toEqual('image/gif');
        expect(attribution.logo.width).toEqual('100');
        expect(attribution.logo.height).toEqual('100');
        expect(keywords.length).toEqual(3);
        expect(keywords[0].value).toEqual('road');
        expect(metadataURLs.length).toEqual(2);
        expect(metadataURLs[0].type).toEqual('FGDC:1998');
        expect(metadataURLs[0].format).toEqual('text/plain');
        url = 'http://www.university.edu/metadata/roads.txt';
        expect(metadataURLs[0].href).toEqual(url);
        var minScale = 250000;
        expect(capability.layers[0].minScale).toEqual(minScale.toPrecision(16));
        var maxScale = 1000;
        expect(capability.layers[0].maxScale).toEqual(maxScale.toPrecision(16));
        expect(obj.service.layerLimit).toEqual(16);
        expect(obj.service.maxHeight).toEqual(2048);
        expect(obj.service.maxWidth).toEqual(2048);
      });
    });
  });
});

goog.require('goog.net.XhrIo');
goog.require('ol.parser.ogc.WMSCapabilities');
