goog.provide('ol.test.parser.ogc.WMSCapabilities_v1_1_1');

describe('ol.parser.ogc.wmscapabilities_v1_1_1', function() {

  var parser = new ol.parser.ogc.WMSCapabilities();

  describe('test read exception', function() {
    it('Error reported correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/' +
          'exceptionsample.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(!!obj.error).to.be.ok();
        done();
      });
    });
  });

  describe('test read', function() {
    it('Test read', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/gssample.xml';
      afterLoadXml(url, function(xml) {
        var obj, capability, getmap, describelayer, getfeatureinfo, layer;
        obj = parser.read(xml);
        capability = obj.capability;
        getmap = capability.request.getmap;
        describelayer = capability.request.describelayer;
        getfeatureinfo = capability.request.getfeatureinfo;
        layer = capability.layers[2];
        expect(capability).to.be.ok();
        expect(getmap.formats.length).to.eql(28);
        var get = 'http://publicus.opengeo.org:80/geoserver/wms?SERVICE=WMS&';
        expect(getmap.get.href).to.eql(get);
        expect(getmap.post).to.be(undefined);
        get = 'http://publicus.opengeo.org:80/geoserver/wms?SERVICE=WMS&';
        expect(describelayer.get.href).to.eql(get);
        expect(describelayer.post).to.be(undefined);
        get = 'http://publicus.opengeo.org:80/geoserver/wms?SERVICE=WMS&';
        expect(getfeatureinfo.get.href).to.eql(get);
        var post = 'http://publicus.opengeo.org:80/geoserver/wms?SERVICE=WMS&';
        expect(getfeatureinfo.post.href).to.eql(post);
        expect(capability.layers).to.be.ok();
        expect(capability.layers.length).to.eql(22);
        var infoFormats =
            ['text/plain', 'text/html', 'application/vnd.ogc.gml'];
        expect(layer.infoFormats).to.eql(infoFormats);
        expect(layer.name).to.eql('tiger:tiger_roads');
        expect(layer.prefix).to.eql('tiger');
        expect(layer.title).to.eql('Manhattan (NY) roads');
        var abstr = 'Highly simplified road layout of Manhattan in New York..';
        expect(layer['abstract']).to.eql(abstr);
        var bbox = [
          -74.08769307536667, 40.660618924633326,
          -73.84653192463333, 40.90178007536667
        ];
        expect(layer.llbbox).to.eql(bbox);
        expect(layer.styles.length).to.eql(1);
        expect(layer.styles[0].name).to.eql('tiger_roads');
        var legend = 'http://publicus.opengeo.org:80/geoserver/wms/' +
            'GetLegendGraphic?VERSION=1.0.0&FORMAT=image/png&WIDTH=20&' +
            'HEIGHT=20&LAYER=tiger:tiger_roads';
        expect(layer.styles[0].legend.href).to.eql(legend);
        expect(layer.styles[0].legend.format).to.eql('image/png');
        expect(layer.queryable).to.be.ok();
        done();
      });
    });
  });

  describe('test layers', function() {
    it('Test layers', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/ogcsample.xml';
      afterLoadXml(url, function(xml) {
        var obj, capability, layers = {}, rootlayer, identifiers, authorities;
        var featurelist;
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
        expect(rootlayer.srs).to.eql({'EPSG:4326': true});
        var srs = {'EPSG:4326': true, 'EPSG:26986': true};
        expect(layers['ROADS_RIVERS'].srs).to.eql(srs);
        expect(layers['Temperature'].srs).to.eql({'EPSG:4326': true});
        var bbox = layers['ROADS_RIVERS'].bbox['EPSG:26986'];
        expect(bbox.bbox).to.eql([189000, 834000, 285000, 962000]);
        expect(bbox.res).to.eql({x: 1, y: 1});
        bbox = layers['ROADS_RIVERS'].bbox['EPSG:4326'];
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
        expect(featurelist.format).to.eql('application/vnd.ogc.se_xml');
        url = 'http://www.university.edu/data/roads_rivers.gml';
        expect(featurelist.href).to.eql(url);
        expect(layers['Pressure'].queryable).to.be.ok();
        expect(layers['ozone_image'].queryable).to.not.be();
        expect(layers['population'].cascaded).to.eql(1);
        expect(layers['ozone_image'].fixedWidth).to.eql(512);
        expect(layers['ozone_image'].fixedHeight).to.eql(256);
        expect(layers['ozone_image'].opaque).to.be.ok();
        expect(layers['ozone_image'].noSubsets).to.be.ok();
        done();
      });
    });
  });

  describe('test dimensions', function() {
    it('Test dimensions', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/ogcsample.xml';
      afterLoadXml(url, function(xml) {
        var obj, capability, layers = {}, time, elevation;
        obj = parser.read(xml);
        capability = obj.capability;
        for (var i = 0, len = capability.layers.length; i < len; i++) {
          if ('name' in capability.layers[i]) {
            layers[capability.layers[i].name] = capability.layers[i];
          }
        }
        time = layers['Clouds'].dimensions.time;
        elevation = layers['Pressure'].dimensions.elevation;
        expect(time['default']).to.eql('2000-08-22');
        expect(time.values.length).to.eql(1);
        expect(time.values[0]).to.eql('1999-01-01/2000-08-22/P1D');
        expect(elevation.units).to.eql('EPSG:5030');
        expect(elevation['default']).to.eql('0');
        expect(elevation.nearestVal).to.be.ok();
        expect(elevation.multipleVal).to.not.be();
        expect(elevation.values).to.eql(
            ['0', '1000', '3000', '5000', '10000']);
        done();
      });
    });
  });

  describe('test contact info', function() {
    it('Test contact info', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/' +
          'ogcsample.xml';
      afterLoadXml(url, function(xml) {
        var obj, service, contactinfo, personPrimary, addr;
        obj = parser.read(xml);
        service = obj.service;
        contactinfo = service.contactInformation;
        personPrimary = contactinfo.personPrimary;
        addr = contactinfo.contactAddress;
        expect(contactinfo).to.be.ok();
        expect(personPrimary).to.be.ok();
        expect(personPrimary.person).to.eql('Jeff deLaBeaujardiere');
        expect(personPrimary.organization).to.eql('NASA');
        expect(contactinfo.position).to.eql('Computer Scientist');
        expect(addr).to.be.ok();
        expect(addr.type).to.eql('postal');
        var address = 'NASA Goddard Space Flight Center, Code 933';
        expect(addr.address).to.eql(address);
        expect(addr.city).to.eql('Greenbelt');
        expect(addr.stateOrProvince).to.eql('MD');
        expect(addr.postcode).to.eql('20771');
        expect(addr.country).to.eql('USA');
        expect(contactinfo.phone).to.eql('+1 301 286-1569');
        expect(contactinfo.fax).to.eql('+1 301 286-1777');
        expect(contactinfo.email).to.eql('delabeau@iniki.gsfc.nasa.gov');
        done();
      });
    });
  });

  describe('Test fees and constraints', function() {
    it('Test fees and constraints', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/gssample.xml';
      afterLoadXml(url, function(xml) {
        var obj, service;
        obj = parser.read(xml);
        service = obj.service;
        expect('fees' in service).to.not.be();
        expect('accessConstraints' in service).to.not.be();
        done();
      });
    });
  });

  describe('Test requests', function() {
    it('Test requests', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/gssample.xml';
      afterLoadXml(url, function(xml) {
        var obj, request, exception, userSymbols;
        obj = parser.read(xml);
        request = obj.capability.request;
        exception = obj.capability.exception;
        userSymbols = obj.capability.userSymbols;
        expect(request).to.be.ok();
        expect('getmap' in request).to.be.ok();
        expect('getfeatureinfo' in request).to.be.ok();
        var formats = ['text/plain', 'text/html', 'application/vnd.ogc.gml'];
        expect(request.getfeatureinfo.formats).to.eql(formats);
        expect('describelayer' in request).to.be.ok();
        expect('getlegendgraphic' in request).to.be.ok();
        expect(exception).to.be.ok();
        expect(exception.formats).to.eql(['application/vnd.ogc.se_xml']);
        expect(userSymbols).to.be.ok();
        expect(userSymbols.supportSLD).to.be.ok();
        expect(userSymbols.userLayer).to.be.ok();
        expect(userSymbols.userStyle).to.be.ok();
        expect(userSymbols.remoteWFS).to.be.ok();
        done();
      });
    });
  });

  describe('test ogc', function() {
    it('Test ogc', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1/ogcsample.xml';
      afterLoadXml(url, function(xml) {
        var obj, capability, attribution, keywords, metadataURLs;
        obj = parser.read(xml);
        capability = obj.capability;
        attribution = capability.layers[2].attribution;
        keywords = capability.layers[0].keywords;
        metadataURLs = capability.layers[0].metadataURLs;
        expect(attribution.title).to.eql('State College University');
        expect(attribution.href).to.eql('http://www.university.edu/');
        var url = 'http://www.university.edu/icons/logo.gif';
        expect(attribution.logo.href).to.eql(url);
        expect(attribution.logo.format).to.eql('image/gif');
        expect(attribution.logo.width).to.eql('100');
        expect(attribution.logo.height).to.eql('100');
        expect(keywords.length).to.eql(3);
        expect(keywords[0].value).to.eql('road');
        expect(metadataURLs.length).to.eql(2);
        expect(metadataURLs[0].type).to.eql('FGDC');
        expect(metadataURLs[0].format).to.eql('text/plain');
        var href = 'http://www.university.edu/metadata/roads.txt';
        expect(metadataURLs[0].href).to.eql(href);
        expect(Math.round(capability.layers[0].minScale)).to.eql(250000);
        expect(Math.round(capability.layers[0].maxScale)).to.eql(1000);
        expect(capability.layers[1].minScale).to.be(undefined);
        expect(capability.layers[1].maxScale).to.be(undefined);
        done();
      });
    });
  });

});

goog.require('ol.parser.ogc.WMSCapabilities');
