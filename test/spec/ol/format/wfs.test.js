import Feature from '../../../../src/ol/Feature.js';
import GML2 from '../../../../src/ol/format/GML2.js';
import WFS, {writeFilter} from '../../../../src/ol/format/WFS.js';
import {
  and as andFilter,
  bbox as bboxFilter,
  between as betweenFilter,
  contains as containsFilter,
  during as duringFilter,
  equalTo as equalToFilter,
  greaterThan as greaterThanFilter,
  greaterThanOrEqualTo as greaterThanOrEqualToFilter,
  intersects as intersectsFilter,
  isNull as isNullFilter,
  lessThan as lessThanFilter,
  lessThanOrEqualTo as lessThanOrEqualToFilter,
  like as likeFilter,
  not as notFilter,
  or as orFilter,
  within as withinFilter
} from '../../../../src/ol/format/filter.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import {addCommon, clearAllProjections, transform} from '../../../../src/ol/proj.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import {parse} from '../../../../src/ol/xml.js';

describe('ol.format.WFS', () => {

  describe('featureType', () => {

    test('#getFeatureType #setFeatureType', () => {
      const format = new WFS({
        featureNS: 'http://www.openplans.org/topp',
        featureType: ['foo', 'bar']
      });
      expect(format.getFeatureType()).toEqual(['foo', 'bar']);
      format.setFeatureType('baz');
      expect(format.getFeatureType()).toEqual('baz');
    });

  });

  describe('when parsing TOPP states GML from WFS', () => {

    let features, feature, xml;
    const config = {
      'featureNS': 'http://www.openplans.org/topp',
      'featureType': 'states'
    };

    beforeAll(function(done) {
      proj4.defs('urn:x-ogc:def:crs:EPSG:4326', proj4.defs('EPSG:4326'));
      register(proj4);
      afterLoadText('spec/ol/format/wfs/topp-states-wfs.xml', function(data) {
        try {
          xml = data;
          features = new WFS(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    afterAll(function() {
      delete proj4.defs['urn:x-ogc:def:crs:EPSG:4326'];
      clearAllProjections();
      addCommon();
    });

    test('creates 3 features', () => {
      expect(features).toHaveLength(3);
    });

    test('creates a polygon for Illinois', () => {
      feature = features[0];
      expect(feature.getId()).toBe('states.1');
      expect(feature.get('STATE_NAME')).toBe('Illinois');
      expect(feature.getGeometry()).toBeInstanceOf(MultiPolygon);
    });

    test('transforms and creates a polygon for Illinois', () => {
      features = new WFS(config).readFeatures(xml, {
        featureProjection: 'EPSG:3857'
      });
      feature = features[0];
      expect(feature.getId()).toBe('states.1');
      expect(feature.get('STATE_NAME')).toBe('Illinois');
      const geom = feature.getGeometry();
      expect(geom).toBeInstanceOf(MultiPolygon);
      const p = transform([-88.071, 37.511], 'EPSG:4326', 'EPSG:3857');
      p.push(0);
      expect(geom.getFirstCoordinate()).toEqual(p);
    });

  });

  describe('when parsing mapserver GML2 polygon', () => {

    let features, feature, xml;
    const config = {
      'featureNS': 'http://mapserver.gis.umn.edu/mapserver',
      'featureType': 'polygon',
      'gmlFormat': new GML2()
    };

    beforeAll(function(done) {
      proj4.defs('urn:x-ogc:def:crs:EPSG:4326', proj4.defs('EPSG:4326'));
      register(proj4);
      afterLoadText('spec/ol/format/wfs/polygonv2.xml', function(data) {
        try {
          xml = data;
          features = new WFS(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    afterAll(function() {
      delete proj4.defs['urn:x-ogc:def:crs:EPSG:4326'];
      clearAllProjections();
      addCommon();
    });

    test('creates 3 features', () => {
      expect(features).toHaveLength(3);
    });

    test('creates a polygon for My Polygon with hole', () => {
      feature = features[0];
      expect(feature.getId()).toBe('1');
      expect(feature.get('name')).toBe('My Polygon with hole');
      expect(feature.get('boundedBy')).toEqual([47.003018, -0.768746, 47.925567, 0.532597]);
      expect(feature.getGeometry()).toBeInstanceOf(MultiPolygon);
      expect(feature.getGeometry().getFlatCoordinates()).toHaveLength(60);
    });

  });

  describe('when parsing FeatureCollection', () => {
    let xml;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wfs/EmptyFeatureCollection.xml',
        function(_xml) {
          xml = _xml;
          done();
        });
    });
    test('returns an empty array of features when none exist', () => {
      const result = new WFS().readFeatures(xml);
      expect(result).toHaveLength(0);
    });
  });

  describe('when parsing FeatureCollection', () => {
    let response;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wfs/NumberOfFeatures.xml',
        function(xml) {
          try {
            response = new WFS().readFeatureCollectionMetadata(xml);
          } catch (e) {
            done(e);
          }
          done();
        });
    });
    test('returns the correct number of features', () => {
      expect(response.numberOfFeatures).toBe(625);
    });
  });

  describe('when parsing FeatureCollection', () => {
    let response;
    beforeAll(function(done) {
      proj4.defs('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 ' +
          '+lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 ' +
          '+ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,' +
          '-1.8774,4.0725 +units=m +no_defs');
      register(proj4);
      afterLoadText('spec/ol/format/wfs/boundedBy.xml',
        function(xml) {
          try {
            response = new WFS().readFeatureCollectionMetadata(xml);
          } catch (e) {
            done(e);
          }
          done();
        });
    });
    test('returns the correct bounds', () => {
      expect(response.bounds).toEqual([3197.88, 306457.313,
        280339.156, 613850.438]);
    });
  });

  describe('when parsing TransactionResponse', () => {
    let response;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wfs/TransactionResponse.xml',
        function(xml) {
          try {
            response = new WFS().readTransactionResponse(xml);
          } catch (e) {
            done(e);
          }
          done();
        });
    });
    test('returns the correct TransactionResponse object', () => {
      expect(response.transactionSummary.totalDeleted).toBe(0);
      expect(response.transactionSummary.totalInserted).toBe(0);
      expect(response.transactionSummary.totalUpdated).toBe(1);
      expect(response.insertIds).toHaveLength(2);
      expect(response.insertIds[0]).toBe('parcelle.40');
    });
  });

  describe('when writing out a GetFeature request', () => {

    test('creates the expected output', () => {
      const text =
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
      const serialized = new WFS().writeGetFeature({
        resultType: 'hits',
        featureTypes: ['states'],
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        propertyNames: ['STATE_NAME', 'STATE_FIPS', 'STATE_ABBR']
      });
      expect(serialized).to.xmleql(parse(text));
    });

    test('creates paging headers', () => {
      const text =
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
      const serialized = new WFS().writeGetFeature({
        count: 10,
        startIndex: 20,
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states']
      });
      expect(serialized).to.xmleql(parse(text));
    });

    test('creates a BBOX filter', () => {
      const text =
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
      const serialized = new WFS().writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        geometryName: 'the_geom',
        bbox: [1, 2, 3, 4]
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates a property filter', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:PropertyIsEqualTo matchCase="false">' +
          '      <ogc:PropertyName>name</ogc:PropertyName>' +
          '      <ogc:Literal>New York</ogc:Literal>' +
          '    </ogc:PropertyIsEqualTo>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        filter: equalToFilter('name', 'New York', false)
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates two property filters', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:Or>' +
          '      <ogc:PropertyIsEqualTo>' +
          '        <ogc:PropertyName>name</ogc:PropertyName>' +
          '        <ogc:Literal>New York</ogc:Literal>' +
          '      </ogc:PropertyIsEqualTo>' +
          '      <ogc:PropertyIsEqualTo>' +
          '        <ogc:PropertyName>area</ogc:PropertyName>' +
          '        <ogc:Literal>1234</ogc:Literal>' +
          '      </ogc:PropertyIsEqualTo>' +
          '    </ogc:Or>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        filter: orFilter(
          equalToFilter('name', 'New York'),
          equalToFilter('area', 1234))
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates greater/less than property filters', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:Or>' +
          '      <ogc:And>' +
          '        <ogc:PropertyIsGreaterThan>' +
          '          <ogc:PropertyName>area</ogc:PropertyName>' +
          '          <ogc:Literal>100</ogc:Literal>' +
          '        </ogc:PropertyIsGreaterThan>' +
          '        <ogc:PropertyIsGreaterThanOrEqualTo>' +
          '          <ogc:PropertyName>pop</ogc:PropertyName>' +
          '          <ogc:Literal>20000</ogc:Literal>' +
          '        </ogc:PropertyIsGreaterThanOrEqualTo>' +
          '      </ogc:And>' +
          '      <ogc:And>' +
          '        <ogc:PropertyIsLessThan>' +
          '          <ogc:PropertyName>area</ogc:PropertyName>' +
          '          <ogc:Literal>100</ogc:Literal>' +
          '        </ogc:PropertyIsLessThan>' +
          '        <ogc:PropertyIsLessThanOrEqualTo>' +
          '          <ogc:PropertyName>pop</ogc:PropertyName>' +
          '          <ogc:Literal>20000</ogc:Literal>' +
          '        </ogc:PropertyIsLessThanOrEqualTo>' +
          '      </ogc:And>' +
          '    </ogc:Or>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        filter: orFilter(
          andFilter(
            greaterThanFilter('area', 100),
            greaterThanOrEqualToFilter('pop', 20000)
          ),
          andFilter(
            lessThanFilter('area', 100),
            lessThanOrEqualToFilter('pop', 20000)
          )
        )
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates isBetween property filter', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:PropertyIsBetween>' +
          '      <ogc:PropertyName>area</ogc:PropertyName>' +
          '      <ogc:LowerBoundary><ogc:Literal>100</ogc:Literal></ogc:LowerBoundary>' +
          '      <ogc:UpperBoundary><ogc:Literal>1000</ogc:Literal></ogc:UpperBoundary>' +
          '    </ogc:PropertyIsBetween>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        filter: betweenFilter('area', 100, 1000)
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates isNull property filter', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:PropertyIsNull>' +
          '      <ogc:PropertyName>area</ogc:PropertyName>' +
          '    </ogc:PropertyIsNull>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        filter: isNullFilter('area')
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates isLike property filter', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:PropertyIsLike wildCard="*" singleChar="." escapeChar="!">' +
          '      <ogc:PropertyName>name</ogc:PropertyName>' +
          '      <ogc:Literal>New*</ogc:Literal>' +
          '    </ogc:PropertyIsLike>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        filter: likeFilter('name', 'New*')
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates isLike property filter with arguments', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:PropertyIsLike wildCard="*" singleChar="." escapeChar="!" matchCase="false">' +
          '      <ogc:PropertyName>name</ogc:PropertyName>' +
          '      <ogc:Literal>New*</ogc:Literal>' +
          '    </ogc:PropertyIsLike>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        filter: likeFilter('name', 'New*', '*', '.', '!', false)
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates a Not filter', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:Not>' +
          '      <ogc:PropertyIsEqualTo>' +
          '        <ogc:PropertyName>name</ogc:PropertyName>' +
          '        <ogc:Literal>New York</ogc:Literal>' +
          '      </ogc:PropertyIsEqualTo>' +
          '    </ogc:Not>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        filter: notFilter(equalToFilter('name', 'New York'))
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates an AND filter', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:And>' +
          '      <ogc:PropertyIsEqualTo>' +
          '        <ogc:PropertyName>name</ogc:PropertyName>' +
          '        <ogc:Literal>New York</ogc:Literal>' +
          '      </ogc:PropertyIsEqualTo>' +
          '      <ogc:BBOX>' +
          '        <ogc:PropertyName>the_geom</ogc:PropertyName>' +
          '        <gml:Envelope xmlns:gml="http://www.opengis.net/gml" ' +
          '            srsName="urn:ogc:def:crs:EPSG::4326">' +
          '          <gml:lowerCorner>1 2</gml:lowerCorner>' +
          '          <gml:upperCorner>3 4</gml:upperCorner>' +
          '        </gml:Envelope>' +
          '      </ogc:BBOX>' +
          '      <ogc:PropertyIsGreaterThan>' +
          '        <ogc:PropertyName>population</ogc:PropertyName>' +
          '        <ogc:Literal>2000000</ogc:Literal>' +
          '      </ogc:PropertyIsGreaterThan>' +
          '    </ogc:And>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        filter: andFilter(
          equalToFilter('name', 'New York'),
          bboxFilter('the_geom', [1, 2, 3, 4], 'urn:ogc:def:crs:EPSG::4326'),
          greaterThanFilter('population', 2000000)
        )
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates a contains filter', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="area" srsName="EPSG:4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:Contains>' +
          '      <ogc:PropertyName>the_geom</ogc:PropertyName>' +
          '      <gml:Polygon xmlns:gml="http://www.opengis.net/gml">' +
          '        <gml:exterior>' +
          '          <gml:LinearRing>' +
          '            <gml:posList srsDimension="2">' +
          '              10 20 10 25 15 25 15 20 10 20' +
          '            </gml:posList>' +
          '          </gml:LinearRing>' +
          '        </gml:exterior>' +
          '      </gml:Polygon>' +
          '    </ogc:Contains>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'EPSG:4326',
        featureTypes: ['area'],
        filter: containsFilter(
          'the_geom',
          new Polygon([[
            [10, 20],
            [10, 25],
            [15, 25],
            [15, 20],
            [10, 20]
          ]])
        )
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates a intersects filter', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="area" srsName="EPSG:4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:Intersects>' +
          '      <ogc:PropertyName>the_geom</ogc:PropertyName>' +
          '      <gml:Polygon xmlns:gml="http://www.opengis.net/gml">' +
          '        <gml:exterior>' +
          '          <gml:LinearRing>' +
          '            <gml:posList srsDimension="2">' +
          '              10 20 10 25 15 25 15 20 10 20' +
          '            </gml:posList>' +
          '          </gml:LinearRing>' +
          '        </gml:exterior>' +
          '      </gml:Polygon>' +
          '    </ogc:Intersects>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'EPSG:4326',
        featureTypes: ['area'],
        filter: intersectsFilter(
          'the_geom',
          new Polygon([[
            [10, 20],
            [10, 25],
            [15, 25],
            [15, 20],
            [10, 20]
          ]])
        )
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates a within filter', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="area" srsName="EPSG:4326" ' +
          '    xmlns:topp="http://www.openplans.org/topp">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:Within>' +
          '      <ogc:PropertyName>the_geom</ogc:PropertyName>' +
          '      <gml:Polygon xmlns:gml="http://www.opengis.net/gml">' +
          '        <gml:exterior>' +
          '          <gml:LinearRing>' +
          '            <gml:posList srsDimension="2">' +
          '              10 20 10 25 15 25 15 20 10 20' +
          '            </gml:posList>' +
          '          </gml:LinearRing>' +
          '        </gml:exterior>' +
          '      </gml:Polygon>' +
          '    </ogc:Within>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'EPSG:4326',
        featureTypes: ['area'],
        filter: withinFilter(
          'the_geom',
          new Polygon([[
            [10, 20],
            [10, 25],
            [15, 25],
            [15, 20],
            [10, 20]
          ]])
        )
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    test('creates During property filter', () => {
      const text =
          '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
          '    typeName="states" srsName="EPSG:4326">' +
          '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
          '    <ogc:During>' +
          '      <fes:ValueReference xmlns:fes="http://www.opengis.net/fes">date_prop</fes:ValueReference>' +
          '      <gml:TimePeriod xmlns:gml="http://www.opengis.net/gml">' +
          '        <gml:begin>' +
          '          <gml:TimeInstant>' +
          '            <gml:timePosition>2010-01-20T00:00:00Z</gml:timePosition>' +
          '          </gml:TimeInstant>' +
          '        </gml:begin>' +
          '        <gml:end>' +
          '          <gml:TimeInstant>' +
          '            <gml:timePosition>2012-12-31T00:00:00Z</gml:timePosition>' +
          '          </gml:TimeInstant>' +
          '        </gml:end>' +
          '      </gml:TimePeriod>' +
          '    </ogc:During>' +
          '  </ogc:Filter>' +
          '</wfs:Query>';

      const serialized = new WFS().writeGetFeature({
        srsName: 'EPSG:4326',
        featureTypes: ['states'],
        filter: duringFilter('date_prop', '2010-01-20T00:00:00Z', '2012-12-31T00:00:00Z')
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

  });

  describe('when writing out a Transaction request', () => {

    test('creates a handle', () => {
      const text =
          '<wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'service="WFS" version="1.1.0" handle="handle_t" ' +
          'xsi:schemaLocation="http://www.opengis.net/wfs ' +
          'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"/>';
      const serialized = new WFS().writeTransaction(null, null, null,
        {handle: 'handle_t'});
      expect(serialized).to.xmleql(parse(text));
    });

  });

  describe('when writing out a Transaction request', () => {
    let text;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wfs/TransactionSrs.xml', function(xml) {
        text = xml;
        done();
      });
    });
    test('creates the correct srsName', () => {
      const format = new WFS();
      const insertFeature = new Feature({
        the_geom: new MultiLineString([[
          [-5178372.1885436, 1992365.7775042],
          [-4434792.7774889, 1601008.1927386],
          [-4043435.1927233, 2148908.8114105]
        ]]),
        TYPE: 'xyz'
      });
      insertFeature.setGeometryName('the_geom');
      const inserts = [insertFeature];
      const serialized = format.writeTransaction(inserts, null, null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        featurePrefix: 'feature',
        gmlOptions: {multiCurve: true, srsName: 'EPSG:900913'}
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', () => {
    let text;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wfs/TransactionUpdate.xml', function(xml) {
        text = xml;
        done();
      });
    });

    test('creates the correct update', () => {
      const format = new WFS();
      const updateFeature = new Feature();
      updateFeature.setGeometryName('the_geom');
      updateFeature.setGeometry(new MultiLineString([[
        [-12279454, 6741885],
        [-12064207, 6732101],
        [-11941908, 6595126],
        [-12240318, 6507071],
        [-12416429, 6604910]
      ]]));
      updateFeature.setId('FAULTS.4455');
      const serialized = format.writeTransaction(null, [updateFeature], null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        featurePrefix: 'foo',
        gmlOptions: {srsName: 'EPSG:900913'}
      });
      expect(serialized).to.xmleql(parse(text));
    });

    test('creates the correct update if geometry name is alias', () => {
      const format = new WFS();
      const updateFeature = new Feature(new MultiLineString([[
        [-12279454, 6741885],
        [-12064207, 6732101],
        [-11941908, 6595126],
        [-12240318, 6507071],
        [-12416429, 6604910]
      ]]));
      updateFeature.setGeometryName('the_geom');
      updateFeature.setId('FAULTS.4455');
      const serialized = format.writeTransaction(null, [updateFeature], null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        featurePrefix: 'foo',
        gmlOptions: {srsName: 'EPSG:900913'}
      });
      expect(serialized).to.xmleql(parse(text));
    });

  });

  describe('when writing out a Transaction request', () => {

    test('creates the correct update with default featurePrefix', () => {
      const format = new WFS();
      const updateFeature = new Feature();
      updateFeature.setGeometryName('the_geom');
      updateFeature.setGeometry(new MultiLineString([[
        [-12279454, 6741885],
        [-12064207, 6732101],
        [-11941908, 6595126],
        [-12240318, 6507071],
        [-12416429, 6604910]
      ]]));
      updateFeature.setId('FAULTS.4455');
      const serialized = format.writeTransaction(null, [updateFeature], null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        gmlOptions: {srsName: 'EPSG:900913'}
      });
      expect(serialized.firstChild.attributes.getNamedItem('xmlns:feature') !== null).toBe(true);
    });
  });

  describe('when writing out a Transaction request', () => {

    test('does not create an update if no fid', () => {
      const format = new WFS();
      const updateFeature = new Feature();
      updateFeature.setGeometryName('the_geom');
      updateFeature.setGeometry(new MultiLineString([[
        [-12279454, 6741885],
        [-12064207, 6732101],
        [-11941908, 6595126],
        [-12240318, 6507071],
        [-12416429, 6604910]
      ]]));

      expect(function() {
        format.writeTransaction(null, [updateFeature], null, {
          featureNS: 'http://foo',
          featureType: 'FAULTS',
          featurePrefix: 'foo',
          gmlOptions: {srsName: 'EPSG:900913'}
        });
      }).toThrow();
    });
  });

  describe('when writing out a Transaction request', () => {
    let text;
    const filename = 'spec/ol/format/wfs/TransactionUpdateMultiGeoms.xml';
    beforeAll(function(done) {
      afterLoadText(filename, function(xml) {
        text = xml;
        done();
      }
      );
    });

    test('handles multiple geometries', () => {
      const format = new WFS();
      const updateFeature = new Feature();
      updateFeature.setGeometryName('the_geom');
      updateFeature.setGeometry(new MultiLineString([[
        [-12279454, 6741885],
        [-12064207, 6732101],
        [-11941908, 6595126],
        [-12240318, 6507071],
        [-12416429, 6604910]
      ]]));
      updateFeature.set('geom2', new MultiLineString([[
        [-12000000, 6700000],
        [-12000001, 6700001],
        [-12000002, 6700002]
      ]]));
      const serialized = format.writeTransaction([updateFeature], [], null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        featurePrefix: 'foo',
        gmlOptions: {srsName: 'EPSG:900913'}
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', () => {
    let text;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wfs/TransactionMulti.xml', function(xml) {
        text = xml;
        done();
      });
    });

    test('creates the correct transaction body', () => {
      const format = new WFS();
      const insertFeature = new Feature({
        the_geom: new MultiPoint([[1, 2]]),
        foo: 'bar',
        nul: null
      });
      insertFeature.setGeometryName('the_geom');
      const inserts = [insertFeature];
      const updateFeature = new Feature({
        the_geom: new MultiPoint([[1, 2]]),
        foo: 'bar',
        // null value gets Property element with no Value
        nul: null,
        // undefined value means don't create a Property element
        unwritten: undefined
      });
      updateFeature.setId('fid.42');
      updateFeature.setGeometryName('the_geom');
      const updates = [updateFeature];

      const deleteFeature = new Feature();
      deleteFeature.setId('fid.37');
      const deletes = [deleteFeature];
      const serialized = format.writeTransaction(inserts, updates, deletes, {
        featureNS: 'http://www.openplans.org/topp',
        featureType: 'states',
        featurePrefix: 'topp'
      });
      expect(serialized).to.xmleql(parse(text));
    });

  });

  describe('when writing out a Transaction request', () => {
    let text;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wfs/Native.xml', function(xml) {
        text = xml;
        done();
      });
    });

    test('handles writing out Native', () => {
      const format = new WFS();
      const serialized = format.writeTransaction(null, null, null, {
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
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', () => {
    let text;
    const filename = 'spec/ol/format/wfs/TransactionMultiVersion100.xml';
    beforeAll(function(done) {
      afterLoadText(filename, function(xml) {
        text = xml;
        done();
      });
    });

    test('handles the WFS version', () => {
      const format = new WFS();
      const insertFeature = new Feature({
        the_geom: new LineString([[1.1, 2], [3, 4.2]]),
        foo: 'bar',
        nul: null
      });
      insertFeature.setGeometryName('the_geom');
      const inserts = [insertFeature];
      const updateFeature = new Feature({
        the_geom: new LineString([[1.1, 2], [3, 4.2]]),
        foo: 'bar',
        // null value gets Property element with no Value
        nul: null,
        // undefined value means don't create a Property element
        unwritten: undefined
      });
      updateFeature.setId('fid.42');
      updateFeature.setGeometryName('the_geom');
      const updates = [updateFeature];

      const deleteFeature = new Feature();
      deleteFeature.setId('fid.37');
      const deletes = [deleteFeature];
      const serialized = format.writeTransaction(inserts, updates, deletes, {
        featureNS: 'http://www.openplans.org/topp',
        featureType: 'states',
        featurePrefix: 'topp',
        version: '1.0.0'
      });

      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', () => {
    let text;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wfs/TransactionMulti.xml', function(xml) {
        text = xml;
        done();
      });
    });

    test('do not add feature prefix twice', () => {
      const format = new WFS();
      const insertFeature = new Feature({
        the_geom: new MultiPoint([[1, 2]]),
        foo: 'bar',
        nul: null
      });
      insertFeature.setGeometryName('the_geom');
      const inserts = [insertFeature];
      const updateFeature = new Feature({
        the_geom: new MultiPoint([[1, 2]]),
        foo: 'bar',
        // null value gets Property element with no Value
        nul: null,
        // undefined value means don't create a Property element
        unwritten: undefined
      });
      updateFeature.setId('fid.42');
      updateFeature.setGeometryName('the_geom');
      const updates = [updateFeature];

      const deleteFeature = new Feature();
      deleteFeature.setId('fid.37');
      const deletes = [deleteFeature];
      const serialized = format.writeTransaction(inserts, updates, deletes, {
        featureNS: 'http://www.openplans.org/topp',
        featureType: 'topp:states',
        featurePrefix: 'topp'
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a transaction request', () => {
    let text;
    const filename = 'spec/ol/format/wfs/TransactionMultiVersion100_3D.xml';
    beforeAll(function(done) {
      afterLoadText(filename, function(xml) {
        text = xml;
        done();
      });
    });

    test('handles 3D in WFS 1.0.0', () => {
      const format = new WFS();
      const insertFeature = new Feature({
        the_geom: new LineString([[1.1, 2, 4], [3, 4.2, 5]]),
        foo: 'bar',
        nul: null
      });
      insertFeature.setGeometryName('the_geom');
      const inserts = [insertFeature];
      const updateFeature = new Feature({
        the_geom: new LineString([[1.1, 2, 6], [3, 4.2, 7]]),
        foo: 'bar',
        // null value gets Property element with no Value
        nul: null,
        // undefined value means don't create a Property element
        unwritten: undefined
      });
      updateFeature.setGeometryName('the_geom');
      updateFeature.setId('fid.42');
      const updates = [updateFeature];

      const serialized = format.writeTransaction(inserts, updates, null, {
        featureNS: 'http://www.openplans.org/topp',
        featureType: 'states',
        featurePrefix: 'topp',
        hasZ: true,
        version: '1.0.0'
      });

      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', () => {
    let text;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wfs/TransactionMulti_3D.xml', function(xml) {
        text = xml;
        done();
      });
    });

    test('handles 3D in WFS 1.1.0', () => {
      const format = new WFS();
      const insertFeature = new Feature({
        the_geom: new MultiPoint([[1, 2, 3]]),
        foo: 'bar',
        nul: null
      });
      insertFeature.setGeometryName('the_geom');
      const inserts = [insertFeature];
      const updateFeature = new Feature({
        the_geom: new MultiPoint([[1, 2, 3]]),
        foo: 'bar',
        // null value gets Property element with no Value
        nul: null,
        // undefined value means don't create a Property element
        unwritten: undefined
      });
      updateFeature.setGeometryName('the_geom');
      updateFeature.setId('fid.42');
      const updates = [updateFeature];

      const serialized = format.writeTransaction(inserts, updates, null, {
        featureNS: 'http://www.openplans.org/topp',
        featureType: 'states',
        hasZ: true,
        featurePrefix: 'topp'
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a GetFeature request', () => {
    let text;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wfs/GetFeatureMultiple.xml', function(xml) {
        text = xml;
        done();
      });
    });

    test('handles writing multiple Query elements', () => {
      const format = new WFS();
      const serialized = format.writeGetFeature({
        featureNS: 'http://www.openplans.org/topp',
        featureTypes: ['states', 'cities'],
        featurePrefix: 'topp'
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when parsing GML from MapServer', () => {

    let features, feature;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wfs/mapserver.xml', function(xml) {
        try {
          const config = {
            'featureNS': 'http://mapserver.gis.umn.edu/mapserver',
            'featureType': 'Historische_Messtischblaetter_WFS'
          };
          features = new WFS(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    test('creates 7 features', () => {
      expect(features).toHaveLength(7);
    });

    test('creates a polygon for Arnstadt', () => {
      feature = features[0];
      const fid = 'Historische_Messtischblaetter_WFS.71055885';
      expect(feature.getId()).toBe(fid);
      expect(feature.get('titel')).toBe('Arnstadt');
      expect(feature.getGeometry()).toBeInstanceOf(Polygon);
    });

  });

  describe('when parsing multiple feature types', () => {

    let features;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/gml/multiple-typenames.xml', function(xml) {
        try {
          features = new WFS({
            featureNS: 'http://localhost:8080/official',
            featureType: ['planet_osm_polygon', 'planet_osm_line']
          }).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    test('reads all features', () => {
      expect(features.length).toBe(12);
    });

  });

  describe('when parsing multiple feature types separately', () => {

    let lineFeatures, polygonFeatures;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/gml/multiple-typenames.xml', function(xml) {
        try {
          lineFeatures = new WFS({
            featureNS: 'http://localhost:8080/official',
            featureType: ['planet_osm_line']
          }).readFeatures(xml);
          polygonFeatures = new WFS({
            featureNS: 'http://localhost:8080/official',
            featureType: ['planet_osm_polygon']
          }).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    test('reads all features', () => {
      expect(lineFeatures.length).toBe(3);
      expect(polygonFeatures.length).toBe(9);
    });

  });

  describe('when parsing multiple feature types', () => {

    let features;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/gml/multiple-typenames.xml', function(xml) {
        try {
          features = new WFS().readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    test('reads all features with autoconfigure', () => {
      expect(features.length).toBe(12);
    });

  });

  describe('when parsing multiple feature types (MapServer)', () => {

    let features;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/gml/multiple-typenames-mapserver.xml', function(xml) {
        try {
          features = new WFS().readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    test('reads all features', () => {
      expect(features.length).toBe(5);
      features.forEach(function(feature) {
        expect(feature instanceof Feature).toBe(true);
      });
    });

  });

  describe('when parsing multiple feature types separately (MapServer)', () => {

    let busFeatures, infoFeatures;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/gml/multiple-typenames-mapserver.xml', function(xml) {
        try {
          busFeatures = new WFS({
            featureNS: 'http://mapserver.gis.umn.edu/mapserver',
            featureType: ['bus_stop']
          }).readFeatures(xml);
          infoFeatures = new WFS({
            featureNS: 'http://mapserver.gis.umn.edu/mapserver',
            featureType: ['information']
          }).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    test('reads all features', () => {
      expect(busFeatures.length).toBe(3);
      expect(infoFeatures.length).toBe(2);
    });

  });

  describe('when writing out a WFS Filter', () => {
    test('creates a filter', () => {
      const text =
          '<Filter xmlns="http://www.opengis.net/ogc">' +
          '  <And>' +
          '    <PropertyIsLike wildCard="*" singleChar="." escapeChar="!">' +
          '      <PropertyName>name</PropertyName>' +
          '      <Literal>Mississippi*</Literal>' +
          '    </PropertyIsLike>' +
          '    <PropertyIsEqualTo>' +
          '      <PropertyName>waterway</PropertyName>' +
          '      <Literal>riverbank</Literal>' +
          '    </PropertyIsEqualTo>' +
          '  </And>' +
          '</Filter>';
      const serialized = writeFilter(
        andFilter(
          likeFilter('name', 'Mississippi*'),
          equalToFilter('waterway', 'riverbank')
        )
      );
      expect(serialized).to.xmleql(parse(text));
    });
  });

});
