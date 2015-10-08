goog.provide('ol.test.format.WFS');

describe('ol.format.WFS', function() {

  describe('when parsing TOPP states GML from WFS', function() {

    var features, feature, xml;
    var config = {
      'featureNS': 'http://www.openplans.org/topp',
      'featureType': 'states'
    };

    before(function(done) {
      proj4.defs('urn:x-ogc:def:crs:EPSG:4326', proj4.defs('EPSG:4326'));
      afterLoadText('spec/ol/format/wfs/topp-states-wfs.xml', function(data) {
        try {
          xml = data;
          features = new ol.format.WFS(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 3 features', function() {
      expect(features).to.have.length(3);
    });

    it('creates a polygon for Illinois', function() {
      feature = features[0];
      expect(feature.getId()).to.equal('states.1');
      expect(feature.get('STATE_NAME')).to.equal('Illinois');
      expect(feature.getGeometry()).to.be.an(ol.geom.MultiPolygon);
    });

    it('transforms and creates a polygon for Illinois', function() {
      features = new ol.format.WFS(config).readFeatures(xml, {
        featureProjection: 'EPSG:3857'
      });
      feature = features[0];
      expect(feature.getId()).to.equal('states.1');
      expect(feature.get('STATE_NAME')).to.equal('Illinois');
      var geom = feature.getGeometry();
      expect(geom).to.be.an(ol.geom.MultiPolygon);
      var p = ol.proj.transform([-88.071, 37.511], 'EPSG:4326', 'EPSG:3857');
      p.push(0);
      expect(geom.getFirstCoordinate()).to.eql(p);
    });

  });

  describe('when parsing mapserver GML2 polygon', function() {

    var features, feature, xml;
    var config = {
      'featureNS': 'http://mapserver.gis.umn.edu/mapserver',
      'featureType': 'polygon',
      'gmlFormat': new ol.format.GML2()
    };

    before(function(done) {
      proj4.defs('urn:x-ogc:def:crs:EPSG:4326', proj4.defs('EPSG:4326'));
      afterLoadText('spec/ol/format/wfs/polygonv2.xml', function(data) {
        try {
          xml = data;
          features = new ol.format.WFS(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 3 features', function() {
      expect(features).to.have.length(3);
    });

    it('creates a polygon for My Polygon with hole', function() {
      feature = features[0];
      expect(feature.getId()).to.equal('1');
      expect(feature.get('name')).to.equal('My Polygon with hole');
      expect(feature.get('boundedBy')).to.eql(
          [47.003018, -0.768746, 47.925567, 0.532597]);
      expect(feature.getGeometry()).to.be.an(ol.geom.MultiPolygon);
      expect(feature.getGeometry().getFlatCoordinates()).
          to.have.length(60);
    });

  });

  describe('when parsing FeatureCollection', function() {
    var xml;
    before(function(done) {
      afterLoadText('spec/ol/format/wfs/EmptyFeatureCollection.xml',
          function(_xml) {
            xml = _xml;
            done();
          });
    });
    it('returns an empty array of features when none exist', function() {
      var result = new ol.format.WFS().readFeatures(xml);
      expect(result).to.have.length(0);
    });
  });

  describe('when parsing FeatureCollection', function() {
    var response;
    before(function(done) {
      afterLoadText('spec/ol/format/wfs/NumberOfFeatures.xml',
          function(xml) {
            try {
              response = new ol.format.WFS().readFeatureCollectionMetadata(xml);
            } catch (e) {
              done(e);
            }
            done();
          });
    });
    it('returns the correct number of features', function() {
      expect(response.numberOfFeatures).to.equal(625);
    });
  });

  describe('when parsing FeatureCollection', function() {
    var response;
    before(function(done) {
      proj4.defs('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 ' +
          '+lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 ' +
          '+ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,' +
          '-1.8774,4.0725 +units=m +no_defs');
      afterLoadText('spec/ol/format/wfs/boundedBy.xml',
          function(xml) {
            try {
              response = new ol.format.WFS().readFeatureCollectionMetadata(xml);
            } catch (e) {
              done(e);
            }
            done();
          });
    });
    it('returns the correct bounds', function() {
      expect(response.bounds).to.eql([3197.88, 306457.313,
        280339.156, 613850.438]);
    });
  });

  describe('when parsing TransactionResponse', function() {
    var response;
    before(function(done) {
      afterLoadText('spec/ol/format/wfs/TransactionResponse.xml',
          function(xml) {
            try {
              response = new ol.format.WFS().readTransactionResponse(xml);
            } catch (e) {
              done(e);
            }
            done();
          });
    });
    it('returns the correct TransactionResponse object', function() {
      expect(response.transactionSummary.totalDeleted).to.equal(0);
      expect(response.transactionSummary.totalInserted).to.equal(0);
      expect(response.transactionSummary.totalUpdated).to.equal(1);
      expect(response.insertIds).to.have.length(2);
      expect(response.insertIds[0]).to.equal('parcelle.40');
    });
  });

  describe('when writing out a GetFeature request', function() {

    it('creates the expected output', function() {
      var text =
          '<wfs:GetFeature service="WFS" version="1.1.0" resultType="hits" ' +
          '    xmlns:topp="http://www.openplans.org/topp"' +
          '    xmlns:wfs="http://www.opengis.net/wfs"' +
          '    xmlns:ogc="http://www.opengis.net/ogc"' +
          '    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
          '    xsi:schemaLocation="http://www.opengis.net/wfs ' +
          'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">' +
          '  <wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '      typeName="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
          '      xmlns:topp="http://www.openplans.org/topp">' +
          '    <wfs:PropertyName>STATE_NAME</wfs:PropertyName>' +
          '    <wfs:PropertyName>STATE_FIPS</wfs:PropertyName>' +
          '    <wfs:PropertyName>STATE_ABBR</wfs:PropertyName>' +
          '  </wfs:Query>' +
          '</wfs:GetFeature>';
      var serialized = new ol.format.WFS().writeGetFeature({
        resultType: 'hits',
        featureTypes: ['states'],
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        propertyNames: ['STATE_NAME', 'STATE_FIPS', 'STATE_ABBR']
      });
      expect(serialized).to.xmleql(ol.xml.parse(text));
    });

    it('creates paging headers', function() {
      var text =
          '<wfs:GetFeature service="WFS" version="1.1.0" startIndex="20" ' +
          '    count="10" xmlns:topp="http://www.openplans.org/topp"' +
          '    xmlns:wfs="http://www.opengis.net/wfs"' +
          '    xmlns:ogc="http://www.opengis.net/ogc"' +
          '    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
          '    xsi:schemaLocation="http://www.opengis.net/wfs ' +
          'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">' +
          '  <wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '      typeName="topp:states" srsName="urn:ogc:def:crs:EPSG::4326"' +
          '       xmlns:topp="http://www.openplans.org/topp">' +
          '  </wfs:Query>' +
          '</wfs:GetFeature>';
      var serialized = new ol.format.WFS().writeGetFeature({
        count: 10,
        startIndex: 20,
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states']
      });
      expect(serialized).to.xmleql(ol.xml.parse(text));
    });

    it('creates a BBOX filter', function() {
      var text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:BBOX>' +
          '      <ogc:PropertyName>the_geom</ogc:PropertyName>' +
          '      <gml:Envelope xmlns:gml="http://www.opengis.net/gml" ' +
          '          srsName="urn:ogc:def:crs:EPSG::4326">' +
          '        <gml:lowerCorner>1 2</gml:lowerCorner>' +
          '        <gml:upperCorner>3 4</gml:upperCorner>' +
          '      </gml:Envelope>' +
          '    </ogc:BBOX>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      var serialized = new ol.format.WFS().writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        geometryName: 'the_geom',
        bbox: [1, 2, 3, 4]
      });
      expect(serialized.firstElementChild).to.xmleql(ol.xml.parse(text));
    });

  });

  describe('when writing out a Transaction request', function() {

    it('creates a handle', function() {
      var text =
          '<wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'service="WFS" version="1.1.0" handle="handle_t" ' +
          'xsi:schemaLocation="http://www.opengis.net/wfs ' +
          'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"/>';
      var serialized = new ol.format.WFS().writeTransaction(null, null, null,
          {handle: 'handle_t'});
      expect(serialized).to.xmleql(ol.xml.parse(text));
    });

  });

  describe('when writing out a Transaction request', function() {
    var text;
    before(function(done) {
      afterLoadText('spec/ol/format/wfs/TransactionSrs.xml', function(xml) {
        text = xml;
        done();
      });
    });
    it('creates the correct srsName', function() {
      var format = new ol.format.WFS();
      var insertFeature = new ol.Feature({
        the_geom: new ol.geom.MultiLineString([[
          [-5178372.1885436, 1992365.7775042],
          [-4434792.7774889, 1601008.1927386],
          [-4043435.1927233, 2148908.8114105]
        ]]),
        TYPE: 'xyz'
      });
      insertFeature.setGeometryName('the_geom');
      var inserts = [insertFeature];
      var serialized = format.writeTransaction(inserts, null, null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        featurePrefix: 'feature',
        gmlOptions: {multiCurve: true, srsName: 'EPSG:900913'}
      });
      expect(serialized).to.xmleql(ol.xml.parse(text));
    });
  });

  describe('when writing out a Transaction request', function() {
    var text;
    before(function(done) {
      afterLoadText('spec/ol/format/wfs/TransactionUpdate.xml', function(xml) {
        text = xml;
        done();
      });
    });

    it('creates the correct update', function() {
      var format = new ol.format.WFS();
      var updateFeature = new ol.Feature();
      updateFeature.setGeometryName('the_geom');
      updateFeature.setGeometry(new ol.geom.MultiLineString([[
        [-12279454, 6741885],
        [-12064207, 6732101],
        [-11941908, 6595126],
        [-12240318, 6507071],
        [-12416429, 6604910]
      ]]));
      updateFeature.setId('FAULTS.4455');
      var serialized = format.writeTransaction(null, [updateFeature], null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        featurePrefix: 'foo',
        gmlOptions: {srsName: 'EPSG:900913'}
      });
      expect(serialized).to.xmleql(ol.xml.parse(text));
    });
  });


  describe('when writing out a Transaction request', function() {
    var text, filename = 'spec/ol/format/wfs/TransactionUpdateMultiGeoms.xml';
    before(function(done) {
      afterLoadText(filename, function(xml) {
        text = xml;
        done();
      }
      );
    });

    it('handles multiple geometries', function() {
      var format = new ol.format.WFS();
      var updateFeature = new ol.Feature();
      updateFeature.setGeometryName('the_geom');
      updateFeature.setGeometry(new ol.geom.MultiLineString([[
        [-12279454, 6741885],
        [-12064207, 6732101],
        [-11941908, 6595126],
        [-12240318, 6507071],
        [-12416429, 6604910]
      ]]));
      updateFeature.set('geom2', new ol.geom.MultiLineString([[
        [-12000000, 6700000],
        [-12000001, 6700001],
        [-12000002, 6700002]
      ]]));
      var serialized = format.writeTransaction([updateFeature], [], null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        featurePrefix: 'foo',
        gmlOptions: {srsName: 'EPSG:900913'}
      });
      expect(serialized).to.xmleql(ol.xml.parse(text));
    });
  });

  describe('when writing out a Transaction request', function() {
    var text;
    before(function(done) {
      afterLoadText('spec/ol/format/wfs/TransactionMulti.xml', function(xml) {
        text = xml;
        done();
      });
    });

    it('creates the correct transaction body', function() {
      var format = new ol.format.WFS();
      var insertFeature = new ol.Feature({
        the_geom: new ol.geom.MultiPoint([[1, 2]]),
        foo: 'bar',
        nul: null
      });
      insertFeature.setGeometryName('the_geom');
      var inserts = [insertFeature];
      var updateFeature = new ol.Feature({
        the_geom: new ol.geom.MultiPoint([[1, 2]]),
        foo: 'bar',
        // null value gets Property element with no Value
        nul: null,
        // undefined value means don't create a Property element
        unwritten: undefined
      });
      updateFeature.setId('fid.42');
      var updates = [updateFeature];

      var deleteFeature = new ol.Feature();
      deleteFeature.setId('fid.37');
      var deletes = [deleteFeature];
      var serialized = format.writeTransaction(inserts, updates, deletes, {
        featureNS: 'http://www.openplans.org/topp',
        featureType: 'states',
        featurePrefix: 'topp'
      });
      expect(serialized).to.xmleql(ol.xml.parse(text));
    });

  });

  describe('when writing out a Transaction request', function() {
    var text;
    before(function(done) {
      afterLoadText('spec/ol/format/wfs/Native.xml', function(xml) {
        text = xml;
        done();
      });
    });

    it('handles writing out Native', function() {
      var format = new ol.format.WFS();
      var serialized = format.writeTransaction(null, null, null, {
        nativeElements: [{
          vendorId: 'ORACLE',
          safeToIgnore: true,
          value: 'ALTER SESSION ENABLE PARALLEL DML'
        }, {
          vendorId: 'ORACLE',
          safeToIgnore: false,
          value: 'Another native line goes here'
        }]
      });
      expect(serialized).to.xmleql(ol.xml.parse(text));
    });
  });



  describe('when writing out a GetFeature request', function() {
    var text;
    before(function(done) {
      afterLoadText('spec/ol/format/wfs/GetFeatureMultiple.xml', function(xml) {
        text = xml;
        done();
      });
    });

    it('handles writing multiple Query elements', function() {
      var format = new ol.format.WFS();
      var serialized = format.writeGetFeature({
        featureNS: 'http://www.openplans.org/topp',
        featureTypes: ['states', 'cities'],
        featurePrefix: 'topp'
      });
      expect(serialized).to.xmleql(ol.xml.parse(text));
    });
  });

  describe('when parsing GML from MapServer', function() {

    var features, feature;
    before(function(done) {
      afterLoadText('spec/ol/format/wfs/mapserver.xml', function(xml) {
        try {
          var config = {
            'featureNS': 'http://mapserver.gis.umn.edu/mapserver',
            'featureType': 'Historische_Messtischblaetter_WFS'
          };
          features = new ol.format.WFS(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 7 features', function() {
      expect(features).to.have.length(7);
    });

    it('creates a polygon for Arnstadt', function() {
      feature = features[0];
      var fid = 'Historische_Messtischblaetter_WFS.71055885';
      expect(feature.getId()).to.equal(fid);
      expect(feature.get('titel')).to.equal('Arnstadt');
      expect(feature.getGeometry()).to.be.an(ol.geom.Polygon);
    });

  });

  describe('when parsing multiple feature types', function() {

    var features;
    before(function(done) {
      afterLoadText('spec/ol/format/gml/multiple-typenames.xml', function(xml) {
        try {
          features = new ol.format.WFS({
            featureNS: 'http://localhost:8080/official',
            featureType: ['planet_osm_polygon', 'planet_osm_line']
          }).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('reads all features', function() {
      expect(features.length).to.be(12);
    });

  });

  describe('when parsing multiple feature types', function() {

    var features;
    before(function(done) {
      afterLoadText('spec/ol/format/gml/multiple-typenames.xml', function(xml) {
        try {
          features = new ol.format.WFS().readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('reads all features with autoconfigure', function() {
      expect(features.length).to.be(12);
    });

  });

});


goog.require('ol.xml');
goog.require('ol.Feature');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Polygon');
goog.require('ol.format.GML2');
goog.require('ol.format.WFS');
goog.require('ol.proj');
