goog.provide('ol.test.format.GML');

var readGeometry = function(format, text, opt_options) {
  var doc = ol.xml.load(text);
  // we need an intermediate node for testing purposes
  var node = goog.dom.createElement(goog.dom.TagName.PRE);
  node.appendChild(doc.documentElement);
  return format.readGeometryFromNode(node, opt_options);
};

describe('ol.format.GML', function() {

  var format, formatWGS84, formatNoSrs;
  beforeEach(function() {
    format = new ol.format.GML({srsName: 'CRS:84'});
    formatWGS84 = new ol.format.GML({srsName: 'urn:x-ogc:def:crs:EPSG:4326'});
    formatNoSrs = new ol.format.GML();
  });

  describe('#readGeometry', function() {

    describe('point', function() {

      it('can read and write a point geometry', function() {
        var text =
            '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:pos>1 2</gml:pos>' +
            '</gml:Point>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.Point);
        expect(g.getCoordinates()).to.eql([1, 2, 0]);
        var serialized = format.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

      it('can read, transform and write a point geometry', function() {
        var config = {
          featureProjection: 'EPSG:3857'
        };
        var text =
            '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:pos>1 2</gml:pos>' +
            '</gml:Point>';
        var g = readGeometry(format, text, config);
        expect(g).to.be.an(ol.geom.Point);
        var coordinates = g.getCoordinates();
        expect(coordinates.splice(0, 2)).to.eql(
            ol.proj.transform([1, 2], 'CRS:84', 'EPSG:3857'));
        config.dataProjection = 'CRS:84';
        var serialized = format.writeGeometry(g, config);
        var pos = serialized.firstElementChild.firstElementChild.textContent;
        var coordinate = pos.split(' ');
        expect(coordinate[0]).to.roughlyEqual(1, 1e-9);
        expect(coordinate[1]).to.roughlyEqual(2, 1e-9);
      });

      it('can detect SRS, read and transform a point geometry', function() {
        var config = {
          featureProjection: 'EPSG:3857'
        };
        var text =
            '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:pos>1 2</gml:pos>' +
            '</gml:Point>';
        var g = readGeometry(formatNoSrs, text, config);
        expect(g).to.be.an(ol.geom.Point);
        var coordinates = g.getCoordinates();
        expect(coordinates.splice(0, 2)).to.eql(
            ol.proj.transform([1, 2], 'CRS:84', 'EPSG:3857'));
      });

      it('can read and write a point geometry in EPSG:4326', function() {
        var text =
            '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
            '  <gml:pos>2 1</gml:pos>' +
            '</gml:Point>';
        var g = readGeometry(formatWGS84, text);
        expect(g).to.be.an(ol.geom.Point);
        expect(g.getCoordinates()).to.eql([1, 2, 0]);
        var serialized = formatWGS84.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

    });

    describe('linestring', function() {

      it('can read and write a linestring geometry', function() {
        var text =
            '<gml:LineString xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:posList>1 2 3 4</gml:posList>' +
            '</gml:LineString>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.LineString);
        expect(g.getCoordinates()).to.eql([[1, 2, 0], [3, 4, 0]]);
        var serialized = format.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

      it('can read, transform and write a linestring geometry', function() {
        var config = {
          dataProjection: 'CRS:84',
          featureProjection: 'EPSG:3857'
        };
        var text =
            '<gml:LineString xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:posList>1 2 3 4</gml:posList>' +
            '</gml:LineString>';
        var g = readGeometry(format, text, config);
        expect(g).to.be.an(ol.geom.LineString);
        var coordinates = g.getCoordinates();
        expect(coordinates[0].slice(0, 2)).to.eql(
            ol.proj.transform([1, 2], 'CRS:84', 'EPSG:3857'));
        expect(coordinates[1].slice(0, 2)).to.eql(
            ol.proj.transform([3, 4], 'CRS:84', 'EPSG:3857'));
        var serialized = format.writeGeometry(g, config);
        var poss = serialized.firstElementChild.firstElementChild.textContent;
        var coordinate = poss.split(' ');
        expect(coordinate[0]).to.roughlyEqual(1, 1e-9);
        expect(coordinate[1]).to.roughlyEqual(2, 1e-9);
        expect(coordinate[2]).to.roughlyEqual(3, 1e-9);
        expect(coordinate[3]).to.roughlyEqual(4, 1e-9);
      });

      it('can read and write a linestring geometry in EPSG:4326', function() {
        var text =
            '<gml:LineString xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
            '  <gml:posList>2 1 4 3</gml:posList>' +
            '</gml:LineString>';
        var g = readGeometry(formatWGS84, text);
        expect(g).to.be.an(ol.geom.LineString);
        expect(g.getCoordinates()).to.eql([[1, 2, 0], [3, 4, 0]]);
        var serialized = formatWGS84.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

    });

    describe('axis order', function() {

      it('can read and write a linestring geometry with ' +
          'correct axis order', function() {
            var text =
                '<gml:LineString xmlns:gml="http://www.opengis.net/gml" ' +
                '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
                '  <gml:posList>-90 -180 90 180</gml:posList>' +
                '</gml:LineString>';
            var g = readGeometry(format, text);
            expect(g).to.be.an(ol.geom.LineString);
            expect(g.getCoordinates()).to.eql([[-180, -90, 0], [180, 90, 0]]);
            var serialized = formatWGS84.writeGeometry(g);
            expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
          });

      it('can read and write a point geometry with correct axis order',
          function() {
            var text =
                '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
                '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
                '  <gml:pos>-90 -180</gml:pos>' +
                '</gml:Point>';
            var g = readGeometry(format, text);
            expect(g).to.be.an(ol.geom.Point);
            expect(g.getCoordinates()).to.eql([-180, -90, 0]);
            var serialized = formatWGS84.writeGeometry(g);
            expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
          });

      it('can read and write a surface geometry with right axis order',
          function() {
            var text =
                '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml" ' +
                '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
                '  <gml:surfaceMember>' +
                '    <gml:Polygon srsName="urn:x-ogc:def:crs:EPSG:4326">' +
                '      <gml:exterior>' +
                '        <gml:LinearRing srsName=' +
                '          "urn:x-ogc:def:crs:EPSG:4326">' +
                '          <gml:posList>38.9661 -77.0081 38.9931 -77.0421 ' +
                '          38.9321 -77.1221 38.9151 -77.0781 38.8861 ' +
                '          -77.0671 38.8621 -77.0391 38.8381 -77.0401 ' +
                '          38.8291 -77.0451 38.8131 -77.0351 38.7881 ' +
                '          -77.0451 38.8891 -76.9111 38.9661 -77.0081' +
                '          </gml:posList>' +
                '        </gml:LinearRing>' +
                '      </gml:exterior>' +
                '    </gml:Polygon>' +
                '  </gml:surfaceMember>' +
                '</gml:MultiSurface>';
            var g = readGeometry(format, text);
            expect(g.getCoordinates()[0][0][0][0]).to.equal(-77.0081);
            expect(g.getCoordinates()[0][0][0][1]).to.equal(38.9661);
            format = new ol.format.GML({srsName: 'urn:x-ogc:def:crs:EPSG:4326',
              surface: false});
            var serialized = format.writeGeometry(g);
            expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
          });

    });

    describe('linestring 3D', function() {

      it('can read a linestring 3D geometry', function() {
        var text =
            '<gml:LineString xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84" srsDimension="3">' +
            '  <gml:posList>1 2 3 4 5 6</gml:posList>' +
            '</gml:LineString>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.LineString);
        expect(g.getCoordinates()).to.eql([[1, 2, 3], [4, 5, 6]]);
      });

    });

    describe('linearring', function() {

      it('can read and write a linearring geometry', function() {
        var text =
            '<gml:LinearRing xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:posList>1 2 3 4 5 6 1 2</gml:posList>' +
            '</gml:LinearRing>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.LinearRing);
        expect(g.getCoordinates()).to.eql(
            [[1, 2, 0], [3, 4, 0], [5, 6, 0], [1, 2, 0]]);
        var serialized = format.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

    });

    describe('polygon', function() {

      it('can read and write a polygon geometry', function() {
        var text =
            '<gml:Polygon xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:exterior>' +
            '    <gml:LinearRing srsName="CRS:84">' +
            '      <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '    </gml:LinearRing>' +
            '  </gml:exterior>' +
            '  <gml:interior>' +
            '    <gml:LinearRing srsName="CRS:84">' +
            '      <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
            '    </gml:LinearRing>' +
            '  </gml:interior>' +
            '  <gml:interior>' +
            '    <gml:LinearRing srsName="CRS:84">' +
            '      <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
            '    </gml:LinearRing>' +
            '  </gml:interior>' +
            '</gml:Polygon>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.Polygon);
        expect(g.getCoordinates()).to.eql([[[1, 2, 0], [3, 2, 0], [3, 4, 0],
                [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
              [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]]);
        var serialized = format.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

    });

    describe('surface', function() {

      it('can read and write a surface geometry', function() {
        var text =
            '<gml:Surface xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:patches>' +
            '    <gml:PolygonPatch>' +
            '      <gml:exterior>' +
            '        <gml:LinearRing srsName="CRS:84">' +
            '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:exterior>' +
            '      <gml:interior>' +
            '        <gml:LinearRing srsName="CRS:84">' +
            '          <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:interior>' +
            '      <gml:interior>' +
            '        <gml:LinearRing srsName="CRS:84">' +
            '          <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:interior>' +
            '    </gml:PolygonPatch>' +
            '  </gml:patches>' +
            '</gml:Surface>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.Polygon);
        expect(g.getCoordinates()).to.eql([[[1, 2, 0], [3, 2, 0], [3, 4, 0],
                [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
              [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]]);
        format = new ol.format.GML({srsName: 'CRS:84', surface: true});
        var serialized = format.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

    });

    describe('curve', function() {

      it('can read and write a curve geometry', function() {
        var text =
            '<gml:Curve xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:segments>' +
            '    <gml:LineStringSegment>' +
            '      <gml:posList>1 2 3 4</gml:posList>' +
            '    </gml:LineStringSegment>' +
            '  </gml:segments>' +
            '</gml:Curve>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.LineString);
        expect(g.getCoordinates()).to.eql([[1, 2, 0], [3, 4, 0]]);
        format = new ol.format.GML({srsName: 'CRS:84', curve: true});
        var serialized = format.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

    });

    describe('envelope', function() {

      it('can read an envelope geometry', function() {
        var text =
            '<gml:Envelope xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:lowerCorner>1 2</gml:lowerCorner>' +
            '  <gml:upperCorner>3 4</gml:upperCorner>' +
            '</gml:Envelope>';
        var g = readGeometry(format, text);
        expect(g).to.eql([1, 2, 3, 4]);
      });

    });

    describe('multipoint', function() {

      it('can read and write a singular multipoint geometry', function() {
        var text =
            '<gml:MultiPoint xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:pointMember>' +
            '    <gml:Point srsName="CRS:84">' +
            '      <gml:pos>1 2</gml:pos>' +
            '    </gml:Point>' +
            '  </gml:pointMember>' +
            '  <gml:pointMember>' +
            '    <gml:Point srsName="CRS:84">' +
            '      <gml:pos>2 3</gml:pos>' +
            '    </gml:Point>' +
            '  </gml:pointMember>' +
            '  <gml:pointMember>' +
            '    <gml:Point srsName="CRS:84">' +
            '      <gml:pos>3 4</gml:pos>' +
            '    </gml:Point>' +
            '  </gml:pointMember>' +
            '</gml:MultiPoint>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.MultiPoint);
        expect(g.getCoordinates()).to.eql([[1, 2, 0], [2, 3, 0], [3, 4, 0]]);
        var serialized = format.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

      it('can read a plural multipoint geometry', function() {
        var text =
            '<gml:MultiPoint xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:pointMembers>' +
            '    <gml:Point>' +
            '      <gml:pos>1 2</gml:pos>' +
            '    </gml:Point>' +
            '    <gml:Point>' +
            '      <gml:pos>2 3</gml:pos>' +
            '    </gml:Point>' +
            '    <gml:Point>' +
            '      <gml:pos>3 4</gml:pos>' +
            '    </gml:Point>' +
            '  </gml:pointMembers>' +
            '</gml:MultiPoint>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.MultiPoint);
        expect(g.getCoordinates()).to.eql([[1, 2, 0], [2, 3, 0], [3, 4, 0]]);
      });

    });

    describe('multilinestring', function() {

      it('can read and write a singular multilinestring geometry', function() {
        var text =
            '<gml:MultiLineString xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:lineStringMember>' +
            '    <gml:LineString srsName="CRS:84">' +
            '      <gml:posList>1 2 2 3</gml:posList>' +
            '    </gml:LineString>' +
            '  </gml:lineStringMember>' +
            '  <gml:lineStringMember>' +
            '    <gml:LineString srsName="CRS:84">' +
            '      <gml:posList>3 4 4 5</gml:posList>' +
            '    </gml:LineString>' +
            '  </gml:lineStringMember>' +
            '</gml:MultiLineString>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.MultiLineString);
        expect(g.getCoordinates()).to.eql(
            [[[1, 2, 0], [2, 3, 0]], [[3, 4, 0], [4, 5, 0]]]);
        format = new ol.format.GML({srsName: 'CRS:84', multiCurve: false});
        var serialized = format.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

      it('can read a plural multilinestring geometry', function() {
        var text =
            '<gml:MultiLineString xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:lineStringMembers>' +
            '    <gml:LineString>' +
            '      <gml:posList>1 2 2 3</gml:posList>' +
            '    </gml:LineString>' +
            '    <gml:LineString>' +
            '      <gml:posList>3 4 4 5</gml:posList>' +
            '    </gml:LineString>' +
            '  </gml:lineStringMembers>' +
            '</gml:MultiLineString>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.MultiLineString);
        expect(g.getCoordinates()).to.eql(
            [[[1, 2, 0], [2, 3, 0]], [[3, 4, 0], [4, 5, 0]]]);
      });

    });

    describe('multipolygon', function() {

      it('can read and write a singular multipolygon geometry', function() {
        var text =
            '<gml:MultiPolygon xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:polygonMember>' +
            '    <gml:Polygon srsName="CRS:84">' +
            '      <gml:exterior>' +
            '        <gml:LinearRing srsName="CRS:84">' +
            '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:exterior>' +
            '      <gml:interior>' +
            '        <gml:LinearRing srsName="CRS:84">' +
            '          <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:interior>' +
            '      <gml:interior>' +
            '        <gml:LinearRing srsName="CRS:84">' +
            '          <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:interior>' +
            '    </gml:Polygon>' +
            '  </gml:polygonMember>' +
            '  <gml:polygonMember>' +
            '    <gml:Polygon srsName="CRS:84">' +
            '      <gml:exterior>' +
            '        <gml:LinearRing srsName="CRS:84">' +
            '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:exterior>' +
            '    </gml:Polygon>' +
            '  </gml:polygonMember>' +
            '</gml:MultiPolygon>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0],
            [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
            [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]],
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0], [1, 2, 0]]]]);
        format = new ol.format.GML({srsName: 'CRS:84', multiSurface: false});
        var serialized = format.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

      it('can read a plural multipolygon geometry', function() {
        var text =
            '<gml:MultiPolygon xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:polygonMembers>' +
            '    <gml:Polygon>' +
            '      <gml:exterior>' +
            '        <gml:LinearRing>' +
            '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:exterior>' +
            '      <gml:interior>' +
            '        <gml:LinearRing>' +
            '          <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:interior>' +
            '      <gml:interior>' +
            '        <gml:LinearRing>' +
            '          <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:interior>' +
            '    </gml:Polygon>' +
            '    <gml:Polygon>' +
            '      <gml:exterior>' +
            '        <gml:LinearRing>' +
            '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:exterior>' +
            '    </gml:Polygon>' +
            '  </gml:polygonMembers>' +
            '</gml:MultiPolygon>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0],
            [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
            [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]],
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0], [1, 2, 0]]]]);
      });

    });

    describe('multicurve', function() {

      it('can read and write a singular multicurve-linestring geometry',
          function() {
            var text =
                '<gml:MultiCurve xmlns:gml="http://www.opengis.net/gml" ' +
                '    srsName="CRS:84">' +
                '  <gml:curveMember>' +
                '    <gml:LineString srsName="CRS:84">' +
                '      <gml:posList>1 2 2 3</gml:posList>' +
                '    </gml:LineString>' +
                '  </gml:curveMember>' +
                '  <gml:curveMember>' +
                '    <gml:LineString srsName="CRS:84">' +
                '      <gml:posList>3 4 4 5</gml:posList>' +
                '    </gml:LineString>' +
                '  </gml:curveMember>' +
                '</gml:MultiCurve>';
            var g = readGeometry(format, text);
            expect(g).to.be.an(ol.geom.MultiLineString);
            expect(g.getCoordinates()).to.eql(
                [[[1, 2, 0], [2, 3, 0]], [[3, 4, 0], [4, 5, 0]]]);
            var serialized = format.writeGeometry(g);
            expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
          });

      it('can read and write a singular multicurve-curve geometry', function() {
        var text =
            '<gml:MultiCurve xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:curveMember>' +
            '    <gml:Curve srsName="CRS:84">' +
            '      <gml:segments>' +
            '        <gml:LineStringSegment>' +
            '          <gml:posList>1 2 2 3</gml:posList>' +
            '        </gml:LineStringSegment>' +
            '      </gml:segments>' +
            '    </gml:Curve>' +
            '  </gml:curveMember>' +
            '  <gml:curveMember>' +
            '    <gml:Curve srsName="CRS:84">' +
            '      <gml:segments>' +
            '        <gml:LineStringSegment>' +
            '          <gml:posList>3 4 4 5</gml:posList>' +
            '        </gml:LineStringSegment>' +
            '      </gml:segments>' +
            '    </gml:Curve>' +
            '  </gml:curveMember>' +
            '</gml:MultiCurve>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.MultiLineString);
        expect(g.getCoordinates()).to.eql(
            [[[1, 2, 0], [2, 3, 0]], [[3, 4, 0], [4, 5, 0]]]);
        format = new ol.format.GML({srsName: 'CRS:84', curve: true});
        var serialized = format.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

    });

    describe('multisurface', function() {

      it('can read and write a singular multisurface geometry', function() {
        var text =
            '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:surfaceMember>' +
            '    <gml:Polygon srsName="CRS:84">' +
            '      <gml:exterior>' +
            '        <gml:LinearRing srsName="CRS:84">' +
            '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:exterior>' +
            '      <gml:interior>' +
            '        <gml:LinearRing srsName="CRS:84">' +
            '          <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:interior>' +
            '      <gml:interior>' +
            '        <gml:LinearRing srsName="CRS:84">' +
            '          <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:interior>' +
            '    </gml:Polygon>' +
            '  </gml:surfaceMember>' +
            '  <gml:surfaceMember>' +
            '    <gml:Polygon srsName="CRS:84">' +
            '      <gml:exterior>' +
            '        <gml:LinearRing srsName="CRS:84">' +
            '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:exterior>' +
            '    </gml:Polygon>' +
            '  </gml:surfaceMember>' +
            '</gml:MultiSurface>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0],
            [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
            [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]],
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0], [1, 2, 0]]]]);
        var serialized = format.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

      it('can read a plural multisurface geometry', function() {
        var text =
            '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:surfaceMembers>' +
            '    <gml:Polygon>' +
            '      <gml:exterior>' +
            '        <gml:LinearRing>' +
            '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:exterior>' +
            '      <gml:interior>' +
            '        <gml:LinearRing>' +
            '          <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:interior>' +
            '      <gml:interior>' +
            '        <gml:LinearRing>' +
            '          <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:interior>' +
            '    </gml:Polygon>' +
            '  </gml:surfaceMembers>' +
            '  <gml:surfaceMembers>' +
            '    <gml:Polygon>' +
            '      <gml:exterior>' +
            '        <gml:LinearRing>' +
            '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:exterior>' +
            '    </gml:Polygon>' +
            '  </gml:surfaceMembers>' +
            '</gml:MultiSurface>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0],
            [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
            [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]],
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0], [1, 2, 0]]]]);
      });

      it('can read and write a multisurface-surface geometry', function() {
        var text =
            '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="CRS:84">' +
            '  <gml:surfaceMember>' +
            '    <gml:Surface srsName="CRS:84">' +
            '      <gml:patches>' +
            '        <gml:PolygonPatch>' +
            '          <gml:exterior>' +
            '            <gml:LinearRing srsName="CRS:84">' +
            '              <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '            </gml:LinearRing>' +
            '          </gml:exterior>' +
            '          <gml:interior>' +
            '            <gml:LinearRing srsName="CRS:84">' +
            '              <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
            '            </gml:LinearRing>' +
            '          </gml:interior>' +
            '          <gml:interior>' +
            '            <gml:LinearRing srsName="CRS:84">' +
            '              <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
            '            </gml:LinearRing>' +
            '          </gml:interior>' +
            '        </gml:PolygonPatch>' +
            '      </gml:patches>' +
            '    </gml:Surface>' +
            '  </gml:surfaceMember>' +
            '  <gml:surfaceMember>' +
            '    <gml:Surface srsName="CRS:84">' +
            '      <gml:patches>' +
            '        <gml:PolygonPatch>' +
            '          <gml:exterior>' +
            '            <gml:LinearRing srsName="CRS:84">' +
            '              <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '            </gml:LinearRing>' +
            '          </gml:exterior>' +
            '        </gml:PolygonPatch>' +
            '      </gml:patches>' +
            '    </gml:Surface>' +
            '  </gml:surfaceMember>' +
            '</gml:MultiSurface>';
        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0],
            [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
            [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]],
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0], [1, 2, 0]]]]);
        format = new ol.format.GML({srsName: 'CRS:84', surface: true});
        var serialized = format.writeGeometry(g);
        expect(serialized.firstElementChild).to.xmleql(ol.xml.load(text));
      });

    });

  });

  describe('when parsing empty attribute', function() {
    it('generates undefined value', function() {
      var text =
          '<gml:featureMembers xmlns:gml="http://www.opengis.net/gml">' +
          '  <topp:gnis_pop gml:id="gnis_pop.148604" xmlns:topp="' +
          'http://www.openplans.org/topp">' +
          '    <gml:name>Aflu</gml:name>' +
          '    <topp:the_geom>' +
          '      <gml:Point srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '        <gml:pos>34.12 2.09</gml:pos>' +
          '      </gml:Point>' +
          '    </topp:the_geom>' +
          '    <topp:population>84683</topp:population>' +
          '    <topp:country>Algeria</topp:country>' +
          '    <topp:type>place</topp:type>' +
          '    <topp:name>Aflu</topp:name>' +
          '    <topp:empty></topp:empty>' +
          '  </topp:gnis_pop>' +
          '</gml:featureMembers>';
      var config = {
        'featureNS': 'http://www.openplans.org/topp',
        'featureType': 'gnis_pop'
      };
      var features = new ol.format.GML(config).readFeatures(text);
      var feature = features[0];
      expect(feature.get('empty')).to.be(undefined);
    });
  });

  describe('when parsing TOPP states GML', function() {

    var features, text, gmlFormat;
    before(function(done) {
      afterLoadText('spec/ol/format/gml/topp-states-gml.xml', function(xml) {
        try {
          var schemaLoc = 'http://www.openplans.org/topp ' +
              'http://demo.opengeo.org/geoserver/wfs?service=WFS&version=' +
              '1.1.0&request=DescribeFeatureType&typeName=topp:states ' +
              'http://www.opengis.net/gml ' +
              'http://schemas.opengis.net/gml/3.2.1/gml.xsd';
          var config = {
            'featureNS': 'http://www.openplans.org/topp',
            'featureType': 'states',
            'multiSurface': true,
            'srsName': 'urn:x-ogc:def:crs:EPSG:4326',
            'schemaLocation': schemaLoc
          };
          text = xml;
          gmlFormat = new ol.format.GML(config);
          features = gmlFormat.readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 10 features', function() {
      expect(features).to.have.length(10);
    });

    it('creates the right id for the feature', function() {
      expect(features[0].getId()).to.equal('states.1');
    });

    it('writes back features as GML', function() {
      var serialized = gmlFormat.writeFeatures(features);
      expect(serialized).to.xmleql(ol.xml.load(text));
    });

  });

  describe('when parsing TOPP states GML from WFS', function() {

    var features, feature;
    before(function(done) {
      afterLoadText('spec/ol/format/gml/topp-states-wfs.xml', function(xml) {
        try {
          var config = {
            'featureNS': 'http://www.openplans.org/topp',
            'featureType': 'states'
          };
          features = new ol.format.GML(config).readFeatures(xml);
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

  });

  describe('when parsing more than one geometry', function() {

    var features;
    before(function(done) {
      afterLoadText('spec/ol/format/gml/more-geoms.xml', function(xml) {
        try {
          var config = {
            'featureNS': 'http://opengeo.org/#medford',
            'featureType': 'zoning'
          };
          features = new ol.format.GML(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 2 geometries', function() {
      var feature = features[0];
      expect(feature.get('center')).to.be.a(ol.geom.Point);
      expect(feature.get('the_geom')).to.be.a(ol.geom.MultiPolygon);
    });

  });

  describe('when parsing an attribute name equal to featureType', function() {

    var features;
    before(function(done) {
      afterLoadText('spec/ol/format/gml/repeated-name.xml', function(xml) {
        try {
          var config = {
            'featureNS': 'http://opengeo.org/#medford',
            'featureType': 'zoning'
          };
          features = new ol.format.GML(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates the correct attribute value', function() {
      var feature = features[0];
      expect(feature.get('zoning')).to.equal('I-L');
    });

  });

});


goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol.format.GML');
goog.require('ol.geom.LineString');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.xml');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
