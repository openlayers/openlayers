goog.provide('ol.test.parser.ogc.WMSCapabilities_v1_1_1');

describe('ol.parser.ogc.wmscapabilities_v1_1_1', function() {

  var parser = new ol.parser.ogc.WMSCapabilities();

  describe('test read exception', function() {
    var obj, url;
    url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/exceptionsample.xml';
    goog.net.XhrIo.send(url, function(e) {
      var xhr = e.target;
      obj = parser.read(xhr.getResponseXml());
    });
    it('Error reported correctly', function() {
      expect(!!obj.error).toBeTruthy();
    });
  });

  describe('test read', function() {
    var obj, capability, getmap, describelayer, getfeatureinfo, layer, url;
    url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/gssample.xml';
    goog.net.XhrIo.send(url, function(e) {
      var xhr = e.target;
      obj = parser.read(xhr.getResponseXml());
      capability = obj.capability;
      getmap = capability.request.getmap;
      describelayer = capability.request.describelayer;
      getfeatureinfo = capability.request.getfeatureinfo;
      layer = capability.layers[2];
    });
    it('object contains capability property', function() {
      expect(capability).toBeTruthy();
    });
    it('getmap formats parsed', function() {
      expect(getmap.formats.length).toEqual(28);
    });
    it('getmap href parsed', function() {
      var url = 'http://publicus.opengeo.org:80/geoserver/wms?SERVICE=WMS&';
      expect(getmap.href).toEqual(url);
    });
    it('getmap.get.href parsed', function() {
      expect(getmap.get.href).toEqual(getmap.href);
    });
    it('getmap.post not available', function() {
      expect(getmap.post).toBeUndefined();
    });
    it('describelayer href parsed', function() {
      var url = 'http://publicus.opengeo.org:80/geoserver/wms?SERVICE=WMS&';
      expect(describelayer.href).toEqual(url);
    });
    it('describelayer.get.href parsed', function() {
      expect(describelayer.get.href).toEqual(describelayer.href);
    });
    it('describelayer.post not available', function() {
      expect(describelayer.post).toBeUndefined();
    });
    it('getfeatureinfo href parsed', function() {
      var url = 'http://publicus.opengeo.org:80/geoserver/wms?SERVICE=WMS&';
      expect(getfeatureinfo.href).toEqual(url);
    });
    it('getmap.get.href parsed', function() {
      expect(getfeatureinfo.get.href).toEqual(getfeatureinfo.href);
    });
    it('getfeatureinfo.post set correctly', function() {
      var url = 'http://publicus.opengeo.org:80/geoserver/wms?SERVICE=WMS&';
      expect(getfeatureinfo.post.href).toEqual(url);
    });
    it('layers parsed', function() {
      expect(capability.layers).toBeTruthy();
    });
    it('correct number of layers parsed', function() {
      expect(capability.layers.length).toEqual(22);
    });
    it('infoFormats set on layer', function() {
      var infoFormats = ['text/plain', 'text/html', 'application/vnd.ogc.gml'];
      expect(layer.infoFormats).toEqual(infoFormats);
    });
    it('[2] correct layer name', function() {
      expect(layer.name).toEqual('tiger:tiger_roads');
    });
    it('[2] correct layer prefix', function() {
      expect(layer.prefix).toEqual('tiger');
    });
    it('[2] correct layer title', function() {
      expect(layer.title).toEqual('Manhattan (NY) roads');
    });
    it('[2] correct layer abstract', function() {
      var abstr = 'Highly simplified road layout of Manhattan in New York..';
      expect(layer['abstract']).toEqual(abstr);
    });
    it('[2] correct layer bbox', function() {
      var bbox = [-74.08769307536667, 40.660618924633326,
          -73.84653192463333, 40.90178007536667];
      expect(layer.llbbox).toEqual(bbox);
    });
    it('[2] correct styles length', function() {
      expect(layer.styles.length).toEqual(1);
    });
    it('[2] correct style name', function() {
      expect(layer.styles[0].name).toEqual('tiger_roads');
    });
    it('[2] correct legend url', function() {
      var url = 'http://publicus.opengeo.org:80/geoserver/wms/' +
          'GetLegendGraphic?VERSION=1.0.0&FORMAT=image/png&WIDTH=20&' +
          'HEIGHT=20&LAYER=tiger:tiger_roads';
      expect(layer.styles[0].legend.href).toEqual(url);
    });
    it('[2] correct legend format', function() {
      expect(layer.styles[0].legend.format).toEqual('image/png');
    });
    it('[2] correct queryable attribute', function() {
      expect(layer.queryable).toBeTruthy();
    });
  });

  describe('test layers', function() {
    var obj, capability, layers = {}, rootlayer, identifiers, authorities;
    var featurelist, url;
    url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/ogcsample.xml';
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
    it('SRS parsed correctly for root layer', function() {
      expect(rootlayer.srs).toEqual({'EPSG:4326': true});
    });
    it('Inheritance of SRS handled correctly when adding SRSes', function() {
      var srs = {'EPSG:4326': true, 'EPSG:26986': true};
      expect(layers['ROADS_RIVERS'].srs).toEqual(srs);
    });
    var msg = 'Inheritance of SRS handled correctly when redeclaring an ' +
      'inherited SRS';
    it(msg, function() {
      expect(layers['Temperature'].srs).toEqual({'EPSG:4326': true});
    });
    it('Correct bbox and res from BoundingBox', function() {
      var bbox = layers['ROADS_RIVERS'].bbox['EPSG:26986'];
      expect(bbox.bbox).toEqual([189000, 834000, 285000, 962000]);
      expect(bbox.res).toEqual({x: 1, y: 1});
    });
    it('Correct bbox and res from BoundingBox (override)', function() {
      bbox = layers['ROADS_RIVERS'].bbox['EPSG:4326'];
      expect(bbox.bbox).toEqual([-71.63, 41.75, -70.78, 42.90]);
      expect(bbox.res).toEqual({x: 0.01, y: 0.01});
    });
    it('Correctly inherited bbox and resolution', function() {
      bbox = layers['ROADS_1M'].bbox['EPSG:26986'];
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
      expect(featurelist.format).toEqual('application/vnd.ogc.se_xml');
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
     var obj, capability, layers = {}, time, elevation, url;
     url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/ogcsample.xml';
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
      expect(elevation.units).toEqual('EPSG:5030');
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
     var obj, service, contactinfo, personPrimary, addr, url;
     url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/ogcsample.xml';
     goog.net.XhrIo.send(url, function(e) {
      var xhr = e.target;
      obj = parser.read(xhr.getResponseXml());
      service = obj.service;
      contactinfo = service.contactInformation;
      personPrimary = contactinfo.personPrimary;
      addr = contactinfo.contactAddress;
    });
    it('object contains contactInformation property', function() {
      expect(contactinfo).toBeTruthy();
    });
    it('object contains personPrimary property', function() {
      expect(personPrimary).toBeTruthy();
    });
    it('ContactPerson parsed correctly', function() {
      expect(personPrimary.person).toEqual('Jeff deLaBeaujardiere');
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
      var address = 'NASA Goddard Space Flight Center, Code 933';
      expect(addr.address).toEqual(address);
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
      expect(contactinfo.phone).toEqual('+1 301 286-1569');
    });
    it('ContactFacsimileTelephone parsed correctly', function() {
      expect(contactinfo.fax).toEqual('+1 301 286-1777');
    });
    it('ContactElectronicMailAddress parsed correctly', function() {
      expect(contactinfo.email).toEqual('delabeau@iniki.gsfc.nasa.gov');
    });
  });

  describe('Test fees and constraints', function() {
    var obj, service, url;
    url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/gssample.xml';
    goog.net.XhrIo.send(url, function(e) {
      var xhr = e.target;
      obj = parser.read(xhr.getResponseXml());
      service = obj.service;
    });
    it('Fees=none handled correctly', function() {
      expect('fees' in service).toBeFalsy();
    });
    it('AccessConstraints=none handled correctly', function() {
      expect('accessConstraints' in service).toBeFalsy();
    });
  });

  describe('Test requests', function() {
    var obj, request, exception, userSymbols, url;
    url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/gssample.xml';
    goog.net.XhrIo.send(url, function(e) {
      var xhr = e.target;
      obj = parser.read(xhr.getResponseXml());
      request = obj.capability.request;
      exception = obj.capability.exception;
      userSymbols = obj.capability.userSymbols;
    });
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
      var formats = ['text/plain', 'text/html', 'application/vnd.ogc.gml'];
      expect(request.getfeatureinfo.formats).toEqual(formats);
    });
    it('got DescribeLayer request', function() {
      expect('describelayer' in request).toBeTruthy();
    });
    it('got GetLegendGraphic request', function() {
      expect('getlegendgraphic' in request).toBeTruthy();
    });
    it('exception property exists', function() {
      expect(exception).toBeTruthy();
    });
    it('Exception Format parsed', function() {
      expect(exception.formats).toEqual(['application/vnd.ogc.se_xml']);
    });
    it('userSymbols property exists', function() {
      expect(userSymbols).toBeTruthy();
    });
    it('supportSLD parsed', function() {
      expect(userSymbols.supportSLD).toBeTruthy();
    });
    it('userLayer parsed', function() {
      expect(userSymbols.userLayer).toBeTruthy();
    });
    it('userStyle parsed', function() {
      expect(userSymbols.userStyle).toBeTruthy();
    });
    it('remoteWFS parsed', function() {
      expect(userSymbols.remoteWFS).toBeTruthy();
    });
  });

  describe('test ogc', function() {
    var obj, capability, attribution, keywords, metadataURLs, url;
    url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/ogcsample.xml';
    goog.net.XhrIo.send(url, function(e) {
      var xhr = e.target;
      obj = parser.read(xhr.getResponseXml());
      capability = obj.capability;
      attribution = capability.layers[2].attribution;
      keywords = capability.layers[0].keywords;
      metadataURLs = capability.layers[0].metadataURLs;
    });
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
      expect(metadataURLs[0].type).toEqual('FGDC');
    });
    it('format parsed correctly.', function() {
      expect(metadataURLs[0].format).toEqual('text/plain');
    });
    it('href parsed correctly.', function() {
      var href = 'http://www.university.edu/metadata/roads.txt';
      expect(metadataURLs[0].href).toEqual(href);
    });
    it('layer.minScale is correct', function() {
      expect(Math.round(capability.layers[0].minScale)).toEqual(250000);
    });
    it('layer.maxScale is correct', function() {
      expect(Math.round(capability.layers[0].maxScale)).toEqual(1000);
    });
    it('layer.minScale for max="Infinity" is correct', function() {
      expect(capability.layers[1].minScale).toBeUndefined();
    });
    it('layer.maxScale for min="0" is correct', function() {
      expect(capability.layers[1].maxScale).toBeUndefined();
    });
  });

});

goog.require('goog.net.XhrIo');
goog.require('ol.parser.ogc.WMSCapabilities');
