goog.provide('ol.test.parser.ogc.WMSCapabilities_v1_1_1');

describe('ol.parser.ogc.wmscapabilities_v1_1_1', function() {

  var parser = new ol.parser.ogc.WMSCapabilities();

  describe('test read exception', function() {
    it('Error reported correctly', function() {
      var obj;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/' +
            'exceptionsample.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          obj = parser.read(xhr.getResponseXml());
        });
      });
      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(!!obj.error).toBeTruthy();
      });
    });
  });

  describe('test read', function() {
    it('Test read', function() {
      var obj, capability, getmap, describelayer, getfeatureinfo, layer;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/gssample.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          obj = parser.read(xhr.getResponseXml());
          capability = obj.capability;
          getmap = capability.request.getmap;
          describelayer = capability.request.describelayer;
          getfeatureinfo = capability.request.getfeatureinfo;
          layer = capability.layers[2];
        });
      });
      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(capability).toBeTruthy();
        expect(getmap.formats.length).toEqual(28);
        var get = 'http://publicus.opengeo.org:80/geoserver/wms?SERVICE=WMS&';
        expect(getmap.get.href).toEqual(get);
        expect(getmap.post).toBeUndefined();
        get = 'http://publicus.opengeo.org:80/geoserver/wms?SERVICE=WMS&';
        expect(describelayer.get.href).toEqual(get);
        expect(describelayer.post).toBeUndefined();
        get = 'http://publicus.opengeo.org:80/geoserver/wms?SERVICE=WMS&';
        expect(getfeatureinfo.get.href).toEqual(get);
        var post = 'http://publicus.opengeo.org:80/geoserver/wms?SERVICE=WMS&';
        expect(getfeatureinfo.post.href).toEqual(post);
        expect(capability.layers).toBeTruthy();
        expect(capability.layers.length).toEqual(22);
        var infoFormats = ['text/plain', 'text/html',
            'application/vnd.ogc.gml'];
        expect(layer.infoFormats).toEqual(infoFormats);
        expect(layer.name).toEqual('tiger:tiger_roads');
        expect(layer.prefix).toEqual('tiger');
        expect(layer.title).toEqual('Manhattan (NY) roads');
        var abstr = 'Highly simplified road layout of Manhattan in New York..';
        expect(layer['abstract']).toEqual(abstr);
        var bbox = [-74.08769307536667, 40.660618924633326,
            -73.84653192463333, 40.90178007536667];
        expect(layer.llbbox).toEqual(bbox);
        expect(layer.styles.length).toEqual(1);
        expect(layer.styles[0].name).toEqual('tiger_roads');
        var legend = 'http://publicus.opengeo.org:80/geoserver/wms/' +
          'GetLegendGraphic?VERSION=1.0.0&FORMAT=image/png&WIDTH=20&' +
          'HEIGHT=20&LAYER=tiger:tiger_roads';
        expect(layer.styles[0].legend.href).toEqual(legend);
        expect(layer.styles[0].legend.format).toEqual('image/png');
        expect(layer.queryable).toBeTruthy();
      });
    });
  });

  describe('test layers', function() {
    it('Test layers', function() {
      var obj, capability, layers = {}, rootlayer, identifiers, authorities;
      var featurelist;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/ogcsample.xml';
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
        });
      });
      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(rootlayer.srs).toEqual({'EPSG:4326': true});
        var srs = {'EPSG:4326': true, 'EPSG:26986': true};
        expect(layers['ROADS_RIVERS'].srs).toEqual(srs);
        expect(layers['Temperature'].srs).toEqual({'EPSG:4326': true});
        var bbox = layers['ROADS_RIVERS'].bbox['EPSG:26986'];
        expect(bbox.bbox).toEqual([189000, 834000, 285000, 962000]);
        expect(bbox.res).toEqual({x: 1, y: 1});
        bbox = layers['ROADS_RIVERS'].bbox['EPSG:4326'];
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
        expect(featurelist.format).toEqual('application/vnd.ogc.se_xml');
        url = 'http://www.university.edu/data/roads_rivers.gml';
        expect(featurelist.href).toEqual(url);
        expect(layers['Pressure'].queryable).toBeTruthy();
        expect(layers['ozone_image'].queryable).toBeFalsy();
        expect(layers['population'].cascaded).toEqual(1);
        expect(layers['ozone_image'].fixedWidth).toEqual(512);
        expect(layers['ozone_image'].fixedHeight).toEqual(256);
        expect(layers['ozone_image'].opaque).toBeTruthy();
        expect(layers['ozone_image'].noSubsets).toBeTruthy();
      });
    });
  });

  describe('test dimensions', function() {
    it('Test dimensions', function() {
      var obj, capability, layers = {}, time, elevation;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/ogcsample.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          obj = parser.read(xhr.getResponseXml());
          capability = obj.capability;
          for (var i = 0, len = capability.layers.length; i < len; i++) {
            if ('name' in capability.layers[i]) {
              layers[capability.layers[i].name] = capability.layers[i];
            }
          }
          time = layers['Clouds'].dimensions.time;
          elevation = layers['Pressure'].dimensions.elevation;
        });
      });
      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(time['default']).toEqual('2000-08-22');
        expect(time.values.length).toEqual(1);
        expect(time.values[0]).toEqual('1999-01-01/2000-08-22/P1D');
        expect(elevation.units).toEqual('EPSG:5030');
        expect(elevation['default']).toEqual('0');
        expect(elevation.nearestVal).toBeTruthy();
        expect(elevation.multipleVal).toBeFalsy();
        expect(elevation.values).toEqual(['0', '1000', '3000', '5000',
            '10000']);
      });
    });
  });

  describe('test contact info', function() {
     it('Test contact info', function() {
       var obj, service, contactinfo, personPrimary, addr;
       runs(function() {
         var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/' +
             'ogcsample.xml';
         goog.net.XhrIo.send(url, function(e) {
           var xhr = e.target;
           obj = parser.read(xhr.getResponseXml());
           service = obj.service;
           contactinfo = service.contactInformation;
           personPrimary = contactinfo.personPrimary;
           addr = contactinfo.contactAddress;
         });
       });
       waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(contactinfo).toBeTruthy();
        expect(personPrimary).toBeTruthy();
        expect(personPrimary.person).toEqual('Jeff deLaBeaujardiere');
        expect(personPrimary.organization).toEqual('NASA');
        expect(contactinfo.position).toEqual('Computer Scientist');
        expect(addr).toBeTruthy();
        expect(addr.type).toEqual('postal');
        var address = 'NASA Goddard Space Flight Center, Code 933';
        expect(addr.address).toEqual(address);
        expect(addr.city).toEqual('Greenbelt');
        expect(addr.stateOrProvince).toEqual('MD');
        expect(addr.postcode).toEqual('20771');
        expect(addr.country).toEqual('USA');
        expect(contactinfo.phone).toEqual('+1 301 286-1569');
        expect(contactinfo.fax).toEqual('+1 301 286-1777');
        expect(contactinfo.email).toEqual('delabeau@iniki.gsfc.nasa.gov');
      });
    });
  });

  describe('Test fees and constraints', function() {
    it('Test fees and constraints', function() {
      var obj, service;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/gssample.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          obj = parser.read(xhr.getResponseXml());
          service = obj.service;
        });
      });
      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect('fees' in service).toBeFalsy();
        expect('accessConstraints' in service).toBeFalsy();
      });
    });
  });

  describe('Test requests', function() {
    it('Test requests', function() {
      var obj, request, exception, userSymbols;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/gssample.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          obj = parser.read(xhr.getResponseXml());
          request = obj.capability.request;
          exception = obj.capability.exception;
          userSymbols = obj.capability.userSymbols;
        });
      });
      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(request).toBeTruthy();
        expect('getmap' in request).toBeTruthy();
        expect('getfeatureinfo' in request).toBeTruthy();
        var formats = ['text/plain', 'text/html', 'application/vnd.ogc.gml'];
        expect(request.getfeatureinfo.formats).toEqual(formats);
        expect('describelayer' in request).toBeTruthy();
        expect('getlegendgraphic' in request).toBeTruthy();
        expect(exception).toBeTruthy();
        expect(exception.formats).toEqual(['application/vnd.ogc.se_xml']);
        expect(userSymbols).toBeTruthy();
        expect(userSymbols.supportSLD).toBeTruthy();
        expect(userSymbols.userLayer).toBeTruthy();
        expect(userSymbols.userStyle).toBeTruthy();
        expect(userSymbols.remoteWFS).toBeTruthy();
      });
    });
  });

  describe('test ogc', function() {
    it('Test ogc', function() {
      var obj, capability, attribution, keywords, metadataURLs;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/ogcsample.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          obj = parser.read(xhr.getResponseXml());
          capability = obj.capability;
          attribution = capability.layers[2].attribution;
          keywords = capability.layers[0].keywords;
          metadataURLs = capability.layers[0].metadataURLs;
        });
      });
      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(attribution.title).toEqual('State College University');
        expect(attribution.href).toEqual('http://www.university.edu/');
        var url = 'http://www.university.edu/icons/logo.gif';
        expect(attribution.logo.href).toEqual(url);
        expect(attribution.logo.format).toEqual('image/gif');
        expect(attribution.logo.width).toEqual('100');
        expect(attribution.logo.height).toEqual('100');
        expect(keywords.length).toEqual(3);
        expect(keywords[0].value).toEqual('road');
        expect(metadataURLs.length).toEqual(2);
        expect(metadataURLs[0].type).toEqual('FGDC');
        expect(metadataURLs[0].format).toEqual('text/plain');
        var href = 'http://www.university.edu/metadata/roads.txt';
        expect(metadataURLs[0].href).toEqual(href);
        expect(Math.round(capability.layers[0].minScale)).toEqual(250000);
        expect(Math.round(capability.layers[0].maxScale)).toEqual(1000);
        expect(capability.layers[1].minScale).toBeUndefined();
        expect(capability.layers[1].maxScale).toBeUndefined();
      });
    });
  });

});

goog.require('goog.net.XhrIo');
goog.require('ol.parser.ogc.WMSCapabilities');
