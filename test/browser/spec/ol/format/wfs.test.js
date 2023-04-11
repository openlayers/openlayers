import Feature from '../../../../../src/ol/Feature.js';
import GML2 from '../../../../../src/ol/format/GML2.js';
import GML32 from '../../../../../src/ol/format/GML32.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import WFS, {writeFilter} from '../../../../../src/ol/format/WFS.js';
import {
  addCommon,
  clearAllProjections,
  transform,
} from '../../../../../src/ol/proj.js';
import {
  and as andFilter,
  bbox as bboxFilter,
  between as betweenFilter,
  contains as containsFilter,
  disjoint as disjointFilter,
  during as duringFilter,
  dwithin as dwithinFilter,
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
  resourceId as resourceIdFilter,
  within as withinFilter,
} from '../../../../../src/ol/format/filter.js';
import {parse} from '../../../../../src/ol/xml.js';
import {register} from '../../../../../src/ol/proj/proj4.js';

describe('ol.format.WFS', function () {
  describe('featureType', function () {
    it('#getFeatureType #setFeatureType', function () {
      const format = new WFS({
        featureNS: 'http://www.openplans.org/topp',
        featureType: ['foo', 'bar'],
      });
      expect(format.getFeatureType()).to.eql(['foo', 'bar']);
      format.setFeatureType('baz');
      expect(format.getFeatureType()).to.eql('baz');
    });
  });

  describe('when parsing TOPP states GML from WFS', function () {
    let features, feature, xml;
    const config = {
      'featureNS': 'http://www.openplans.org/topp',
      'featureType': 'states',
    };

    before(function (done) {
      proj4.defs('urn:x-ogc:def:crs:EPSG:4326', proj4.defs('EPSG:4326'));
      register(proj4);
      afterLoadText('spec/ol/format/wfs/topp-states-wfs.xml', function (data) {
        try {
          xml = data;
          features = new WFS(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    after(function () {
      delete proj4.defs['urn:x-ogc:def:crs:EPSG:4326'];
      clearAllProjections();
      addCommon();
    });

    it('creates 3 features', function () {
      expect(features).to.have.length(3);
    });

    it('creates a polygon for Illinois', function () {
      feature = features[0];
      expect(feature.getId()).to.equal('states.1');
      expect(feature.get('STATE_NAME')).to.equal('Illinois');
      expect(feature.getGeometry()).to.be.an(MultiPolygon);
    });

    it('transforms and creates a polygon for Illinois', function () {
      features = new WFS(config).readFeatures(xml, {
        featureProjection: 'EPSG:3857',
      });
      feature = features[0];
      expect(feature.getId()).to.equal('states.1');
      expect(feature.get('STATE_NAME')).to.equal('Illinois');
      const geom = feature.getGeometry();
      expect(geom).to.be.an(MultiPolygon);
      const p = transform([-88.071, 37.511], 'EPSG:4326', 'EPSG:3857');
      p.push(0);
      expect(geom.getFirstCoordinate()).to.eql(p);
    });
  });

  describe('when parsing mapserver GML2 polygon', function () {
    let features, feature, xml;
    const config = {
      'featureNS': 'http://mapserver.gis.umn.edu/mapserver',
      'featureType': 'polygon',
      'gmlFormat': new GML2(),
    };

    before(function (done) {
      proj4.defs('urn:x-ogc:def:crs:EPSG:4326', proj4.defs('EPSG:4326'));
      register(proj4);
      afterLoadText('spec/ol/format/wfs/polygonv2.xml', function (data) {
        try {
          xml = data;
          features = new WFS(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    after(function () {
      delete proj4.defs['urn:x-ogc:def:crs:EPSG:4326'];
      clearAllProjections();
      addCommon();
    });

    it('creates 3 features', function () {
      expect(features).to.have.length(3);
    });

    it('creates a polygon for My Polygon with hole', function () {
      feature = features[0];
      expect(feature.getId()).to.equal('1');
      expect(feature.get('name')).to.equal('My Polygon with hole');
      expect(feature.get('boundedBy')).to.eql([
        47.003018, -0.768746, 47.925567, 0.532597,
      ]);
      expect(feature.getGeometry()).to.be.an(MultiPolygon);
      expect(feature.getGeometry().getFlatCoordinates()).to.have.length(60);
    });
  });

  describe('when parsing FeatureCollection', function () {
    let xml;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/wfs/EmptyFeatureCollection.xml',
        function (_xml) {
          xml = _xml;
          done();
        }
      );
    });
    it('returns an empty array of features when none exist', function () {
      const result = new WFS().readFeatures(xml);
      expect(result).to.have.length(0);
    });
  });

  describe('when parsing FeatureCollection', function () {
    let response;
    before(function (done) {
      afterLoadText('spec/ol/format/wfs/NumberOfFeatures.xml', function (xml) {
        try {
          response = new WFS().readFeatureCollectionMetadata(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });
    it('returns the correct number of features', function () {
      expect(response.numberOfFeatures).to.equal(625);
    });
  });

  describe('when parsing FeatureCollection', function () {
    let response;
    before(function (done) {
      proj4.defs(
        'EPSG:28992',
        '+proj=sterea +lat_0=52.15616055555555 ' +
          '+lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 ' +
          '+ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,' +
          '-1.8774,4.0725 +units=m +no_defs'
      );
      register(proj4);
      afterLoadText('spec/ol/format/wfs/boundedBy.xml', function (xml) {
        try {
          response = new WFS().readFeatureCollectionMetadata(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });
    it('returns the correct bounds', function () {
      expect(response.bounds).to.eql([
        3197.88, 306457.313, 280339.156, 613850.438,
      ]);
    });
  });

  describe('when parsing TransactionResponse', function () {
    let response;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/wfs/TransactionResponse.xml',
        function (xml) {
          try {
            response = new WFS().readTransactionResponse(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });
    it('returns the correct TransactionResponse object', function () {
      expect(response.transactionSummary.totalDeleted).to.equal(0);
      expect(response.transactionSummary.totalInserted).to.equal(0);
      expect(response.transactionSummary.totalUpdated).to.equal(1);
      expect(response.insertIds).to.have.length(2);
      expect(response.insertIds[0]).to.equal('parcelle.40');
    });
  });

  describe('when writing out a GetFeature request', function () {
    it('creates the expected output', function () {
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
        propertyNames: ['STATE_NAME', 'STATE_FIPS', 'STATE_ABBR'],
      });
      expect(serialized).to.xmleql(parse(text));
    });

    it('creates paging headers', function () {
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
        featureTypes: ['states'],
      });
      expect(serialized).to.xmleql(parse(text));
    });

    it('creates a BBOX filter', function () {
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
        bbox: [1, 2, 3, 4],
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates one BBOX filter per feature type', function () {
      const textQuery1 =
        '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
        '    typeName="topp:states_1" srsName="urn:ogc:def:crs:EPSG::4326" ' +
        '    xmlns:topp="http://www.openplans.org/topp">' +
        '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
        '    <ogc:BBOX>' +
        '      <ogc:PropertyName>the_geom_1</ogc:PropertyName>' +
        '      <gml:Envelope xmlns:gml="http://www.opengis.net/gml" ' +
        '          srsName="urn:ogc:def:crs:EPSG::4326">' +
        '        <gml:lowerCorner>1 2</gml:lowerCorner>' +
        '        <gml:upperCorner>3 4</gml:upperCorner>' +
        '      </gml:Envelope>' +
        '    </ogc:BBOX>' +
        '  </ogc:Filter>' +
        '</wfs:Query>';
      const textQuery2 =
        '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
        '    typeName="topp:states_2" srsName="urn:ogc:def:crs:EPSG::4326" ' +
        '    xmlns:topp="http://www.openplans.org/topp">' +
        '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
        '    <ogc:BBOX>' +
        '      <ogc:PropertyName>the_geom_2</ogc:PropertyName>' +
        '      <gml:Envelope xmlns:gml="http://www.opengis.net/gml" ' +
        '          srsName="urn:ogc:def:crs:EPSG::4326">' +
        '        <gml:lowerCorner>5 6</gml:lowerCorner>' +
        '        <gml:upperCorner>7 8</gml:upperCorner>' +
        '      </gml:Envelope>' +
        '    </ogc:BBOX>' +
        '  </ogc:Filter>' +
        '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: [
          {
            name: 'states_1',
            geometryName: 'the_geom_1',
            bbox: [1, 2, 3, 4],
          },
          {
            name: 'states_2',
            geometryName: 'the_geom_2',
            bbox: [5, 6, 7, 8],
          },
        ],
      });
      expect(serialized.children.length).to.equal(2);
      expect(serialized.firstElementChild).to.xmleql(parse(textQuery1));
      expect(serialized.lastElementChild).to.xmleql(parse(textQuery2));
    });

    it('creates a property filter', function () {
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
        filter: equalToFilter('name', 'New York', false),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates two property filters', function () {
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
          equalToFilter('area', 1234)
        ),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates greater/less than property filters', function () {
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
        ),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates isBetween property filter', function () {
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
        filter: betweenFilter('area', 100, 1000),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates isNull property filter', function () {
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
        filter: isNullFilter('area'),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates isLike property filter', function () {
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
        filter: likeFilter('name', 'New*'),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates isLike property filter with arguments', function () {
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
        filter: likeFilter('name', 'New*', '*', '.', '!', false),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates a Not filter', function () {
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
        filter: notFilter(equalToFilter('name', 'New York')),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates an AND filter', function () {
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
        ),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates a contains filter', function () {
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
          new Polygon([
            [
              [10, 20],
              [10, 25],
              [15, 25],
              [15, 20],
              [10, 20],
            ],
          ])
        ),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates a intersects filter', function () {
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
          new Polygon([
            [
              [10, 20],
              [10, 25],
              [15, 25],
              [15, 20],
              [10, 20],
            ],
          ])
        ),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('WFS v2 creates an intersects filter with a MultiSurface', function () {
      const text = `
        <wfs:Query xmlns:wfs="http://www.opengis.net/wfs/2.0"
             typeNames="area" srsName="EPSG:4326"
             xmlns:topp="http://www.openplans.org/topp">
          <Filter xmlns="http://www.opengis.net/fes/2.0">
            <Intersects>
              <ValueReference>the_geom</ValueReference>
                <MultiSurface xmlns="http://www.opengis.net/gml/3.2">
                  <surfaceMember>
                    <Polygon>
                      <exterior>
                        <LinearRing>
                          <posList srsDimension="2">10 20 10 25 15 25 15 20 10 20</posList>
                        </LinearRing>
                      </exterior>
                    </Polygon>
                  </surfaceMember>
                </MultiSurface>
              </Intersects>
            </Filter>        
        </wfs:Query>`;
      const serialized = new WFS({version: '2.0.0'}).writeGetFeature({
        srsName: 'EPSG:4326',
        featureTypes: ['area'],
        filter: intersectsFilter(
          'the_geom',
          new MultiPolygon([
            [
              [
                [10, 20],
                [10, 25],
                [15, 25],
                [15, 20],
                [10, 20],
              ],
            ],
          ])
        ),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates a within filter', function () {
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
          new Polygon([
            [
              [10, 20],
              [10, 25],
              [15, 25],
              [15, 20],
              [10, 20],
            ],
          ])
        ),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates a dwithin filter', function () {
      const text =
        '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs" ' +
        '    typeName="area" srsName="EPSG:4326" ' +
        '    xmlns:topp="http://www.openplans.org/topp">' +
        '  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
        '    <ogc:DWithin>' +
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
        '      <ogc:Distance units="m">10</ogc:Distance>' +
        '    </ogc:DWithin>' +
        '  </ogc:Filter>' +
        '</wfs:Query>';
      const serialized = new WFS().writeGetFeature({
        srsName: 'EPSG:4326',
        featureTypes: ['area'],
        filter: dwithinFilter(
          'the_geom',
          new Polygon([
            [
              [10, 20],
              [10, 25],
              [15, 25],
              [15, 20],
              [10, 20],
            ],
          ]),
          10,
          'm'
        ),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates During property filter', function () {
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
        filter: duringFilter(
          'date_prop',
          '2010-01-20T00:00:00Z',
          '2012-12-31T00:00:00Z'
        ),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', function () {
    it('creates a handle', function () {
      const text =
        '<wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'service="WFS" version="1.1.0" handle="handle_t" ' +
        'xsi:schemaLocation="http://www.opengis.net/wfs ' +
        'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"/>';
      const serialized = new WFS().writeTransaction(null, null, null, {
        handle: 'handle_t',
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', function () {
    let text;
    before(function (done) {
      afterLoadText('spec/ol/format/wfs/TransactionSrs.xml', function (xml) {
        text = xml;
        done();
      });
    });
    it('creates the correct srsName', function () {
      const format = new WFS();
      const insertFeature = new Feature({
        the_geom: new MultiLineString([
          [
            [-5178372.1885436, 1992365.7775042],
            [-4434792.7774889, 1601008.1927386],
            [-4043435.1927233, 2148908.8114105],
          ],
        ]),
        TYPE: 'xyz',
      });
      insertFeature.setGeometryName('the_geom');
      const inserts = [insertFeature];
      const serialized = format.writeTransaction(inserts, null, null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        featurePrefix: 'feature',
        gmlOptions: {multiCurve: true, srsName: 'EPSG:900913'},
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', function () {
    let text;
    before(function (done) {
      afterLoadText('spec/ol/format/wfs/TransactionUpdate.xml', function (xml) {
        text = xml;
        done();
      });
    });

    it('creates the correct update', function () {
      const format = new WFS();
      const updateFeature = new Feature();
      updateFeature.setGeometryName('the_geom');
      updateFeature.setGeometry(
        new MultiLineString([
          [
            [-12279454, 6741885],
            [-12064207, 6732101],
            [-11941908, 6595126],
            [-12240318, 6507071],
            [-12416429, 6604910],
          ],
        ])
      );
      updateFeature.setId('FAULTS.4455');
      const serialized = format.writeTransaction(null, [updateFeature], null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        featurePrefix: 'foo',
        gmlOptions: {srsName: 'EPSG:900913'},
      });
      expect(serialized).to.xmleql(parse(text));
    });

    it('creates the correct update if geometry name is alias', function () {
      const format = new WFS();
      const updateFeature = new Feature(
        new MultiLineString([
          [
            [-12279454, 6741885],
            [-12064207, 6732101],
            [-11941908, 6595126],
            [-12240318, 6507071],
            [-12416429, 6604910],
          ],
        ])
      );
      updateFeature.setGeometryName('the_geom');
      updateFeature.setId('FAULTS.4455');
      const serialized = format.writeTransaction(null, [updateFeature], null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        featurePrefix: 'foo',
        gmlOptions: {srsName: 'EPSG:900913'},
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', function () {
    it('creates the correct update with default featurePrefix', function () {
      const format = new WFS();
      const updateFeature = new Feature();
      updateFeature.setGeometryName('the_geom');
      updateFeature.setGeometry(
        new MultiLineString([
          [
            [-12279454, 6741885],
            [-12064207, 6732101],
            [-11941908, 6595126],
            [-12240318, 6507071],
            [-12416429, 6604910],
          ],
        ])
      );
      updateFeature.setId('FAULTS.4455');
      const serialized = format.writeTransaction(null, [updateFeature], null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        gmlOptions: {srsName: 'EPSG:900913'},
      });
      expect(
        serialized.firstChild.attributes.getNamedItem('xmlns:feature') !== null
      ).to.equal(true);
    });
  });

  describe('when writing out a Transaction request', function () {
    it('does not create an update if no fid', function () {
      const format = new WFS();
      const updateFeature = new Feature();
      updateFeature.setGeometryName('the_geom');
      updateFeature.setGeometry(
        new MultiLineString([
          [
            [-12279454, 6741885],
            [-12064207, 6732101],
            [-11941908, 6595126],
            [-12240318, 6507071],
            [-12416429, 6604910],
          ],
        ])
      );

      expect(function () {
        format.writeTransaction(null, [updateFeature], null, {
          featureNS: 'http://foo',
          featureType: 'FAULTS',
          featurePrefix: 'foo',
          gmlOptions: {srsName: 'EPSG:900913'},
        });
      }).to.throwException();
    });
  });

  describe('when writing out a Transaction request', function () {
    let text;
    const filename = 'spec/ol/format/wfs/TransactionUpdateMultiGeoms.xml';
    before(function (done) {
      afterLoadText(filename, function (xml) {
        text = xml;
        done();
      });
    });

    it('handles multiple geometries', function () {
      const format = new WFS();
      const updateFeature = new Feature();
      updateFeature.setGeometryName('the_geom');
      updateFeature.setGeometry(
        new MultiLineString([
          [
            [-12279454, 6741885],
            [-12064207, 6732101],
            [-11941908, 6595126],
            [-12240318, 6507071],
            [-12416429, 6604910],
          ],
        ])
      );
      updateFeature.set(
        'geom2',
        new MultiLineString([
          [
            [-12000000, 6700000],
            [-12000001, 6700001],
            [-12000002, 6700002],
          ],
        ])
      );
      const serialized = format.writeTransaction([updateFeature], [], null, {
        featureNS: 'http://foo',
        featureType: 'FAULTS',
        featurePrefix: 'foo',
        gmlOptions: {srsName: 'EPSG:900913'},
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', function () {
    let text;
    before(function (done) {
      afterLoadText('spec/ol/format/wfs/TransactionMulti.xml', function (xml) {
        text = xml;
        done();
      });
    });

    it('creates the correct transaction body', function () {
      const format = new WFS();
      const insertFeature = new Feature({
        the_geom: new MultiPoint([[1, 2]]),
        foo: 'bar',
        nul: null,
      });
      insertFeature.setGeometryName('the_geom');
      const inserts = [insertFeature];
      const updateFeature = new Feature({
        the_geom: new MultiPoint([[1, 2]]),
        foo: 'bar',
        // null value gets Property element with no Value
        nul: null,
        // undefined value means don't create a Property element
        unwritten: undefined,
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
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', function () {
    let text;
    before(function (done) {
      afterLoadText('spec/ol/format/wfs/Native.xml', function (xml) {
        text = xml;
        done();
      });
    });

    it('handles writing out Native', function () {
      const format = new WFS();
      const serialized = format.writeTransaction(null, null, null, {
        nativeElements: [
          {
            vendorId: 'ORACLE',
            safeToIgnore: true,
            value: 'ALTER SESSION ENABLE PARALLEL DML',
          },
          {
            vendorId: 'ORACLE',
            safeToIgnore: false,
            value: 'Another native line goes here',
          },
        ],
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', function () {
    let text;
    const filename = 'spec/ol/format/wfs/TransactionMultiVersion100.xml';
    before(function (done) {
      afterLoadText(filename, function (xml) {
        text = xml;
        done();
      });
    });

    it('handles the WFS version', function () {
      const format = new WFS();
      const insertFeature = new Feature({
        the_geom: new LineString([
          [1.1, 2],
          [3, 4.2],
        ]),
        foo: 'bar',
        nul: null,
      });
      insertFeature.setGeometryName('the_geom');
      const inserts = [insertFeature];
      const updateFeature = new Feature({
        the_geom: new LineString([
          [1.1, 2],
          [3, 4.2],
        ]),
        foo: 'bar',
        // null value gets Property element with no Value
        nul: null,
        // undefined value means don't create a Property element
        unwritten: undefined,
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
        version: '1.0.0',
      });

      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', function () {
    let text;
    before(function (done) {
      afterLoadText('spec/ol/format/wfs/TransactionMulti.xml', function (xml) {
        text = xml;
        done();
      });
    });

    it('do not add feature prefix twice', function () {
      const format = new WFS();
      const insertFeature = new Feature({
        the_geom: new MultiPoint([[1, 2]]),
        foo: 'bar',
        nul: null,
      });
      insertFeature.setGeometryName('the_geom');
      const inserts = [insertFeature];
      const updateFeature = new Feature({
        the_geom: new MultiPoint([[1, 2]]),
        foo: 'bar',
        // null value gets Property element with no Value
        nul: null,
        // undefined value means don't create a Property element
        unwritten: undefined,
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
        featurePrefix: 'topp',
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a transaction request', function () {
    let text;
    const filename = 'spec/ol/format/wfs/TransactionMultiVersion100_3D.xml';
    before(function (done) {
      afterLoadText(filename, function (xml) {
        text = xml;
        done();
      });
    });

    it('handles 3D in WFS 1.0.0', function () {
      const format = new WFS();
      const insertFeature = new Feature({
        the_geom: new LineString([
          [1.1, 2, 4],
          [3, 4.2, 5],
        ]),
        foo: 'bar',
        nul: null,
      });
      insertFeature.setGeometryName('the_geom');
      const inserts = [insertFeature];
      const updateFeature = new Feature({
        the_geom: new LineString([
          [1.1, 2, 6],
          [3, 4.2, 7],
        ]),
        foo: 'bar',
        // null value gets Property element with no Value
        nul: null,
        // undefined value means don't create a Property element
        unwritten: undefined,
      });
      updateFeature.setGeometryName('the_geom');
      updateFeature.setId('fid.42');
      const updates = [updateFeature];

      const serialized = format.writeTransaction(inserts, updates, null, {
        featureNS: 'http://www.openplans.org/topp',
        featureType: 'states',
        featurePrefix: 'topp',
        hasZ: true,
        version: '1.0.0',
      });

      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a Transaction request', function () {
    let text;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/wfs/TransactionMulti_3D.xml',
        function (xml) {
          text = xml;
          done();
        }
      );
    });

    it('handles 3D in WFS 1.1.0', function () {
      const format = new WFS();
      const insertFeature = new Feature({
        the_geom: new MultiPoint([[1, 2, 3]]),
        foo: 'bar',
        nul: null,
      });
      insertFeature.setGeometryName('the_geom');
      const inserts = [insertFeature];
      const updateFeature = new Feature({
        the_geom: new MultiPoint([[1, 2, 3]]),
        foo: 'bar',
        // null value gets Property element with no Value
        nul: null,
        // undefined value means don't create a Property element
        unwritten: undefined,
      });
      updateFeature.setGeometryName('the_geom');
      updateFeature.setId('fid.42');
      const updates = [updateFeature];

      const serialized = format.writeTransaction(inserts, updates, null, {
        featureNS: 'http://www.openplans.org/topp',
        featureType: 'states',
        hasZ: true,
        featurePrefix: 'topp',
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when writing out a GetFeature request', function () {
    let text;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/wfs/GetFeatureMultiple.xml',
        function (xml) {
          text = xml;
          done();
        }
      );
    });

    it('handles writing multiple Query elements', function () {
      const format = new WFS();
      const serialized = format.writeGetFeature({
        featureNS: 'http://www.openplans.org/topp',
        featureTypes: ['states', 'cities'],
        featurePrefix: 'topp',
      });
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('when parsing GML from MapServer', function () {
    let features, feature;
    before(function (done) {
      afterLoadText('spec/ol/format/wfs/mapserver.xml', function (xml) {
        try {
          const config = {
            'featureNS': 'http://mapserver.gis.umn.edu/mapserver',
            'featureType': 'Historische_Messtischblaetter_WFS',
          };
          features = new WFS(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 7 features', function () {
      expect(features).to.have.length(7);
    });

    it('creates a polygon for Arnstadt', function () {
      feature = features[0];
      const fid = 'Historische_Messtischblaetter_WFS.71055885';
      expect(feature.getId()).to.equal(fid);
      expect(feature.get('titel')).to.equal('Arnstadt');
      expect(feature.getGeometry()).to.be.an(Polygon);
    });
  });

  describe('when parsing multiple feature types', function () {
    let features;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/gml/multiple-typenames.xml',
        function (xml) {
          try {
            features = new WFS({
              featureNS: 'http://localhost:8080/official',
              featureType: ['planet_osm_polygon', 'planet_osm_line'],
            }).readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('reads all features', function () {
      expect(features.length).to.be(12);
    });
  });

  describe('when parsing multiple feature types separately', function () {
    let lineFeatures, polygonFeatures;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/gml/multiple-typenames.xml',
        function (xml) {
          try {
            lineFeatures = new WFS({
              featureNS: 'http://localhost:8080/official',
              featureType: ['planet_osm_line'],
            }).readFeatures(xml);
            polygonFeatures = new WFS({
              featureNS: 'http://localhost:8080/official',
              featureType: ['planet_osm_polygon'],
            }).readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('reads all features', function () {
      expect(lineFeatures.length).to.be(3);
      expect(polygonFeatures.length).to.be(9);
    });
  });

  describe('when parsing multiple feature types', function () {
    let features;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/gml/multiple-typenames.xml',
        function (xml) {
          try {
            features = new WFS().readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('reads all features with autoconfigure', function () {
      expect(features.length).to.be(12);
    });
  });

  describe('when parsing multiple feature types (MapServer)', function () {
    let features;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/gml/multiple-typenames-mapserver.xml',
        function (xml) {
          try {
            features = new WFS().readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('reads all features', function () {
      expect(features.length).to.be(5);
      features.forEach(function (feature) {
        expect(feature instanceof Feature).to.be(true);
      });
    });
  });

  describe('when parsing multiple feature types separately (MapServer)', function () {
    let busFeatures, infoFeatures;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/gml/multiple-typenames-mapserver.xml',
        function (xml) {
          try {
            busFeatures = new WFS({
              featureNS: 'http://mapserver.gis.umn.edu/mapserver',
              featureType: ['bus_stop'],
            }).readFeatures(xml);
            infoFeatures = new WFS({
              featureNS: 'http://mapserver.gis.umn.edu/mapserver',
              featureType: ['information'],
            }).readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('reads all features', function () {
      expect(busFeatures.length).to.be(3);
      expect(infoFeatures.length).to.be(2);
    });
  });

  describe('when writing out a WFS Filter', function () {
    const wfs1Filter =
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
    const wfs2Filter =
      '<Filter xmlns="http://www.opengis.net/fes/2.0">' +
      '  <And>' +
      '    <PropertyIsLike wildCard="*" singleChar="." escapeChar="!">' +
      '      <ValueReference>name</ValueReference>' +
      '      <Literal>Mississippi*</Literal>' +
      '    </PropertyIsLike>' +
      '    <PropertyIsEqualTo>' +
      '      <ValueReference>waterway</ValueReference>' +
      '      <Literal>riverbank</Literal>' +
      '    </PropertyIsEqualTo>' +
      '  </And>' +
      '</Filter>';
    it('creates a WFS 1.x.x filter', function () {
      const serialized = writeFilter(
        andFilter(
          likeFilter('name', 'Mississippi*'),
          equalToFilter('waterway', 'riverbank')
        ),
        '1.1.0'
      );
      expect(serialized).to.xmleql(parse(wfs1Filter));
    });
    it('defaults to creating a WFS 1.x.x filter if no version specified', function () {
      const serialized = writeFilter(
        andFilter(
          likeFilter('name', 'Mississippi*'),
          equalToFilter('waterway', 'riverbank')
        )
      );
      expect(serialized).to.xmleql(parse(wfs1Filter));
    });
    it('creates a WFS 2.x.x filter', function () {
      const serialized = writeFilter(
        andFilter(
          likeFilter('name', 'Mississippi*'),
          equalToFilter('waterway', 'riverbank')
        ),
        '2.0.0'
      );
      expect(serialized).to.xmleql(parse(wfs2Filter));
    });
  });

  describe('WFS 2.0.0', function () {
    before(function (done) {
      proj4.defs(
        'http://www.opengis.net/def/crs/EPSG/0/26713',
        '+proj=utm +zone=13 +ellps=clrk66 +datum=NAD27 +units=m +no_defs'
      );
      proj4.defs(
        'urn:ogc:def:crs:EPSG::26713',
        '+proj=utm +zone=13 +ellps=clrk66 +datum=NAD27 +units=m +no_defs'
      );
      register(proj4);
      done();
    });

    after(function () {
      delete proj4.defs['http://www.opengis.net/def/crs/EPSG/0/26713'];
      delete proj4.defs['urn:ogc:def:crs:EPSG::26713'];
      clearAllProjections();
      addCommon();
    });

    it('can writeGetFeature query with simple resourceId filter', function () {
      const getFeatureXml = `
<?xml version="1.0" encoding="UTF-8"?>
<!--
    This example demonstrates a WFS 2.0 GetFeature POST request.

    This filter selects a single feature with id "bugsites.3".

    See also:
    WFS Standard: http://www.opengeospatial.org/standards/wfs
    Filter Encoding Standard: http://www.opengeospatial.org/standards/filter
-->
<wfs:GetFeature service="WFS" version="2.0.0"
    xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:fes="http://www.opengis.net/fes/2.0"
    xmlns:sf="http://www.openplans.org/spearfish" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd">
    <wfs:Query typeNames="sf:bugsites">
        <fes:Filter>
            <fes:ResourceId rid="bugsites.3"/>
        </fes:Filter>
    </wfs:Query>
</wfs:GetFeature>
    `.trim();
      const wfs = new WFS({
        version: '2.0.0',
      });
      const filter = resourceIdFilter('bugsites.3');
      const serialized = wfs.writeGetFeature({
        featureNS: 'http://www.openplans.org/spearfish',
        featureTypes: ['bugsites'],
        featurePrefix: 'sf',
        filter,
      });
      expect(serialized).to.xmleql(parse(getFeatureXml));
    });

    it('can writeGetFeature query with negated disjoint spatial filter', function () {
      const geometryXml = `
<gml:Polygon xmlns:gml="http://www.opengis.net/gml/3.2">
  <gml:exterior>
      <gml:LinearRing>
          <!-- pairs must form a closed ring -->
          <gml:posList srsDimension="2">590431 4915204 590430
              4915205 590429 4915204 590430
              4915203 590431 4915204</gml:posList>
      </gml:LinearRing>
  </gml:exterior>
</gml:Polygon>
  `.trim();
      const getFeatureXml = `
<?xml version="1.0" encoding="UTF-8"?>
<!--
    This example demonstrates a WFS 2.0 GetFeature POST request.

    WFS 2.0 does not depend on any one GML version and thus
    requires an explicit namespace and schemaLocation for GML.

    This spatial filter selects a single feature with
    gml:id="bugsites.2".

    See also:
    WFS Standard: http://www.opengeospatial.org/standards/wfs
    Filter Encoding Standard: http://www.opengeospatial.org/standards/filter
-->
<wfs:GetFeature service="WFS" version="2.0.0"
    xmlns:wfs="http://www.opengis.net/wfs/2.0"
    xmlns:fes="http://www.opengis.net/fes/2.0"
    xmlns:sf="http://www.openplans.org/spearfish"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd">
    <wfs:Query typeNames="sf:bugsites">
        <fes:Filter>
            <fes:Not>
                <fes:Disjoint>
                    <fes:ValueReference>sf:the_geom</fes:ValueReference>
                    ${geometryXml}
                </fes:Disjoint>
            </fes:Not>
        </fes:Filter>
    </wfs:Query>
</wfs:GetFeature>
    `.trim();
      const wfs = new WFS({
        version: '2.0.0',
      });
      const geometryNode = parse(geometryXml);
      const geometry = new GML32().readGeometryElement(geometryNode, [{}]);
      const filter = notFilter(disjointFilter('sf:the_geom', geometry));
      const serialized = wfs.writeGetFeature({
        featureNS: 'http://www.openplans.org/spearfish',
        featureTypes: ['bugsites'],
        featurePrefix: 'sf',
        filter,
      });
      expect(serialized).to.xmleql(parse(getFeatureXml));
    });

    it('can parse basic GetFeature response', function () {
      const response = `
<?xml version="1.0" encoding="UTF-8"?>
<wfs:FeatureCollection xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:sf="http://www.openplans.org/spearfish"
    xmlns:wfs="http://www.opengis.net/wfs/2.0"
    xmlns:gml="http://www.opengis.net/gml/3.2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" numberMatched="1" numberReturned="1" timeStamp="2020-08-11T12:18:35.474Z" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://localhost:8080/geoserver/schemas/wfs/2.0/wfs.xsd http://www.openplans.org/spearfish http://localhost:8080/geoserver/wfs?service=WFS&amp;version=2.0.0&amp;request=DescribeFeatureType&amp;typeName=sf%3Abugsites http://www.opengis.net/gml/3.2 http://localhost:8080/geoserver/schemas/gml/3.2.1/gml.xsd">
    <wfs:member>
        <sf:bugsites gml:id="bugsites.3">
            <sf:the_geom>
                <gml:Point srsName="urn:ogc:def:crs:EPSG::26713" srsDimension="2" gml:id="bugsites.3.the_geom">
                    <gml:pos>590529 4914625</gml:pos>
                </gml:Point>
            </sf:the_geom>
            <sf:cat>3</sf:cat>
            <sf:str1>Beetle site</sf:str1>
        </sf:bugsites>
    </wfs:member>
</wfs:FeatureCollection>
    `.trim();
      const wfs = new WFS({
        version: '2.0.0',
      });
      const features = wfs.readFeatures(parse(response));
      expect(features.length).to.be(1);
      expect(features[0]).to.be.an(Feature);
    });

    describe('when writing out a Transaction request', function () {
      it('creates a handle', function () {
        const text =
          '<wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs/2.0" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'service="WFS" version="2.0.0" handle="handle_t" ' +
          'xsi:schemaLocation="http://www.opengis.net/wfs/2.0 ' +
          'http://schemas.opengis.net/wfs/2.0/wfs.xsd"/>';
        const serialized = new WFS({
          version: '2.0.0',
        }).writeTransaction(null, null, null, {
          handle: 'handle_t',
        });
        expect(serialized).to.xmleql(parse(text));
      });
    });

    describe('when writing out a Transaction request', function () {
      it('creates the correct srsName', function () {
        const text = `
<wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs/2.0" service="WFS" version="2.0.0" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<wfs:Insert>
    <feature:FAULTS xmlns:feature="http://foo">
        <feature:the_geom>
            <gml:MultiCurve xmlns:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:900913">
                <gml:curveMember>
                    <gml:LineString srsName="EPSG:900913">
                        <gml:posList srsDimension="2">-5178372.1885436 1992365.7775042 -4434792.7774889 1601008.1927386 -4043435.1927233 2148908.8114105</gml:posList>
                    </gml:LineString>
                </gml:curveMember>
            </gml:MultiCurve>
        </feature:the_geom>
        <feature:TYPE>xyz</feature:TYPE>
    </feature:FAULTS>
</wfs:Insert>
</wfs:Transaction>
        `.trim();
        const format = new WFS({
          version: '2.0.0',
        });
        const insertFeature = new Feature({
          the_geom: new MultiLineString([
            [
              [-5178372.1885436, 1992365.7775042],
              [-4434792.7774889, 1601008.1927386],
              [-4043435.1927233, 2148908.8114105],
            ],
          ]),
          TYPE: 'xyz',
        });
        insertFeature.setGeometryName('the_geom');
        const inserts = [insertFeature];
        const serialized = format.writeTransaction(inserts, null, null, {
          featureNS: 'http://foo',
          featureType: 'FAULTS',
          featurePrefix: 'feature',
          gmlOptions: {multiCurve: true, srsName: 'EPSG:900913'},
        });
        expect(serialized).to.xmleql(parse(text));
      });
    });

    it('creates a dwithin filter', function () {
      const text =
        '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs/2.0" ' +
        '    typeNames="area" srsName="EPSG:4326" ' +
        '    xmlns:topp="http://www.openplans.org/topp">' +
        '  <fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0">' +
        '    <fes:DWithin>' +
        '      <fes:ValueReference>the_geom</fes:ValueReference>' +
        '      <gml:Polygon xmlns:gml="http://www.opengis.net/gml/3.2">' +
        '        <gml:exterior>' +
        '          <gml:LinearRing>' +
        '            <gml:posList srsDimension="2">' +
        '              10 20 10 25 15 25 15 20 10 20' +
        '            </gml:posList>' +
        '          </gml:LinearRing>' +
        '        </gml:exterior>' +
        '      </gml:Polygon>' +
        '      <fes:Distance uom="m">10</fes:Distance>' +
        '    </fes:DWithin>' +
        '  </fes:Filter>' +
        '</wfs:Query>';
      const serialized = new WFS({version: '2.0.0'}).writeGetFeature({
        srsName: 'EPSG:4326',
        featureTypes: ['area'],
        filter: dwithinFilter(
          'the_geom',
          new Polygon([
            [
              [10, 20],
              [10, 25],
              [15, 25],
              [15, 20],
              [10, 20],
            ],
          ]),
          10,
          'm'
        ),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates isLike property filter', function () {
      const text =
        '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs/2.0" ' +
        '    typeNames="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
        '    xmlns:topp="http://www.openplans.org/topp">' +
        '  <fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0">' +
        '    <fes:PropertyIsLike wildCard="*" singleChar="." escapeChar="!">' +
        '      <fes:ValueReference>name</fes:ValueReference>' +
        '      <fes:Literal>New*</fes:Literal>' +
        '    </fes:PropertyIsLike>' +
        '  </fes:Filter>' +
        '</wfs:Query>';
      const serialized = new WFS({version: '2.0.0'}).writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        filter: likeFilter('name', 'New*'),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates isBetween property filter', function () {
      const text =
        '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs/2.0" ' +
        '    typeNames="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
        '    xmlns:topp="http://www.openplans.org/topp">' +
        '  <fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0">' +
        '    <fes:PropertyIsBetween>' +
        '      <fes:ValueReference>area</fes:ValueReference>' +
        '      <fes:LowerBoundary><fes:Literal>100</fes:Literal></fes:LowerBoundary>' +
        '      <fes:UpperBoundary><fes:Literal>1000</fes:Literal></fes:UpperBoundary>' +
        '    </fes:PropertyIsBetween>' +
        '  </fes:Filter>' +
        '</wfs:Query>';
      const serialized = new WFS({version: '2.0.0'}).writeGetFeature({
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'topp',
        featureTypes: ['states'],
        filter: betweenFilter('area', 100, 1000),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates greater/less than property filters', function () {
      const text =
        '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs/2.0" ' +
        '    typeNames="topp:states" srsName="urn:ogc:def:crs:EPSG::4326" ' +
        '    xmlns:topp="http://www.openplans.org/topp">' +
        '  <fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0">' +
        '    <fes:Or>' +
        '      <fes:And>' +
        '        <fes:PropertyIsGreaterThan>' +
        '          <fes:ValueReference>area</fes:ValueReference>' +
        '          <fes:Literal>100</fes:Literal>' +
        '        </fes:PropertyIsGreaterThan>' +
        '        <fes:PropertyIsGreaterThanOrEqualTo>' +
        '          <fes:ValueReference>pop</fes:ValueReference>' +
        '          <fes:Literal>20000</fes:Literal>' +
        '        </fes:PropertyIsGreaterThanOrEqualTo>' +
        '      </fes:And>' +
        '      <fes:And>' +
        '        <fes:PropertyIsLessThan>' +
        '          <fes:ValueReference>area</fes:ValueReference>' +
        '          <fes:Literal>100</fes:Literal>' +
        '        </fes:PropertyIsLessThan>' +
        '        <fes:PropertyIsLessThanOrEqualTo>' +
        '          <fes:ValueReference>pop</fes:ValueReference>' +
        '          <fes:Literal>20000</fes:Literal>' +
        '        </fes:PropertyIsLessThanOrEqualTo>' +
        '      </fes:And>' +
        '    </fes:Or>' +
        '  </fes:Filter>' +
        '</wfs:Query>';
      const serialized = new WFS({version: '2.0.0'}).writeGetFeature({
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
        ),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });

    it('creates During property filter', function () {
      const text =
        '<wfs:Query xmlns:wfs="http://www.opengis.net/wfs/2.0" ' +
        '    typeNames="states" srsName="EPSG:4326">' +
        '  <fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0">' +
        '    <fes:During>' +
        '      <fes:ValueReference>date_prop</fes:ValueReference>' +
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
        '    </fes:During>' +
        '  </fes:Filter>' +
        '</wfs:Query>';

      const serialized = new WFS({version: '2.0.0'}).writeGetFeature({
        srsName: 'EPSG:4326',
        featureTypes: ['states'],
        filter: duringFilter(
          'date_prop',
          '2010-01-20T00:00:00Z',
          '2012-12-31T00:00:00Z'
        ),
      });
      expect(serialized.firstElementChild).to.xmleql(parse(text));
    });
  });
});
