goog.provide('ol.test.format.GML');

describe('ol.format.GML', function() {

  var format;
  beforeEach(function() {
    format = new ol.format.GML();
  });

  describe('#readGeometry', function() {

    describe('point', function() {

      it('can read a point geometry', function() {
        var text =
            '<gml:Point xmlns:gml="http://www.opengis.net/gml" srsName="foo">' +
            '  <gml:pos>1 2</gml:pos>' +
            '</gml:Point>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.Point);
        expect(g.getCoordinates()).to.eql([1, 2, 0]);
      });

    });

    describe('linestring', function() {

      it('can read a linestring geometry', function() {
        var text =
            '<gml:LineString xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:posList>1 2 3 4</gml:posList>' +
            '</gml:LineString>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.LineString);
        expect(g.getCoordinates()).to.eql([[1, 2, 0], [3, 4, 0]]);
      });

    });

    describe('linestring 3D', function() {

      it('can read a linestring 3D geometry', function() {
        var text =
            '<gml:LineString xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo" srsDimension="3">' +
            '  <gml:posList>1 2 3 4 5 6</gml:posList>' +
            '</gml:LineString>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.LineString);
        expect(g.getCoordinates()).to.eql([[1, 2, 3], [4, 5, 6]]);
      });

    });

    describe('linearring', function() {

      it('can read a linearring geometry', function() {
        var text =
            '<gml:LinearRing xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:posList>1 2 3 4 5 6 1 2</gml:posList>' +
            '</gml:LinearRing>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.Polygon);
        expect(g.getCoordinates()).to.eql(
            [[[1, 2, 0], [3, 4, 0], [5, 6, 0], [1, 2, 0]]]);
      });

    });

    describe('polygon', function() {

      it('can read a polygon geometry', function() {
        var text =
            '<gml:Polygon xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:exterior>' +
            '    <gml:LinearRing>' +
            '      <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '    </gml:LinearRing>' +
            '  </gml:exterior>' +
            '  <gml:interior>' +
            '    <gml:LinearRing>' +
            '      <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
            '    </gml:LinearRing>' +
            '  </gml:interior>' +
            '  <gml:interior>' +
            '    <gml:LinearRing>' +
            '      <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
            '    </gml:LinearRing>' +
            '  </gml:interior>' +
            '</gml:Polygon>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.Polygon);
        expect(g.getCoordinates()).to.eql([[[1, 2, 0], [3, 2, 0], [3, 4, 0],
                [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
              [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]]);
      });

    });

    describe('surface', function() {

      it('can read a surface geometry', function() {
        var text =
            '<gml:Surface xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:patches>' +
            '    <gml:PolygonPatch interpolation="planar">' +
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
            '    </gml:PolygonPatch>' +
            '  </gml:patches>' +
            '</gml:Surface>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.Polygon);
        expect(g.getCoordinates()).to.eql([[[1, 2, 0], [3, 2, 0], [3, 4, 0],
                [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
              [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]]);
      });

    });

    describe('curve', function() {

      it('can read a curve geometry', function() {
        var text =
            '<gml:Curve xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:segments>' +
            '    <gml:LineStringSegment>' +
            '      <gml:posList>1 2 3 4</gml:posList>' +
            '    </gml:LineStringSegment>' +
            '  </gml:segments>' +
            '</gml:Curve>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.LineString);
        expect(g.getCoordinates()).to.eql([[1, 2, 0], [3, 4, 0]]);
      });

    });

    describe('envelope', function() {

      it('can read an envelope geometry', function() {
        var text =
            '<gml:Envelope xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:lowerCorner>1 2</gml:lowerCorner>' +
            '  <gml:upperCorner>3 4</gml:upperCorner>' +
            '</gml:Envelope>';
        var g = format.readGeometry(text);
        expect(g).to.eql([1, 2, 3, 4]);
      });

    });

    describe('multipoint', function() {

      it('can read a singular multipoint geometry', function() {
        var text =
            '<gml:MultiPoint xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:pointMember>' +
            '    <gml:Point>' +
            '      <gml:pos>1 2</gml:pos>' +
            '    </gml:Point>' +
            '  </gml:pointMember>' +
            '  <gml:pointMember>' +
            '    <gml:Point>' +
            '      <gml:pos>2 3</gml:pos>' +
            '    </gml:Point>' +
            '  </gml:pointMember>' +
            '  <gml:pointMember>' +
            '    <gml:Point>' +
            '      <gml:pos>3 4</gml:pos>' +
            '    </gml:Point>' +
            '  </gml:pointMember>' +
            '</gml:MultiPoint>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.MultiPoint);
        expect(g.getCoordinates()).to.eql([[1, 2, 0], [2, 3, 0], [3, 4, 0]]);
      });

      it('can read a plural multipoint geometry', function() {
        var text =
            '<gml:MultiPoint xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
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
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.MultiPoint);
        expect(g.getCoordinates()).to.eql([[1, 2, 0], [2, 3, 0], [3, 4, 0]]);
      });

    });

    describe('multilinestring', function() {

      it('can read a singular multilinestring geometry', function() {
        var text =
            '<gml:MultiLineString xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:lineStringMember>' +
            '    <gml:LineString>' +
            '      <gml:posList>1 2 2 3</gml:posList>' +
            '    </gml:LineString>' +
            '  </gml:lineStringMember>' +
            '  <gml:lineStringMember>' +
            '    <gml:LineString>' +
            '      <gml:posList>3 4 4 5</gml:posList>' +
            '    </gml:LineString>' +
            '  </gml:lineStringMember>' +
            '</gml:MultiLineString>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.MultiLineString);
        expect(g.getCoordinates()).to.eql(
            [[[1, 2, 0], [2, 3, 0]], [[3, 4, 0], [4, 5, 0]]]);
      });

      it('can read a plural multilinestring geometry', function() {
        var text =
            '<gml:MultiLineString xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:lineStringMembers>' +
            '    <gml:LineString>' +
            '      <gml:posList>1 2 2 3</gml:posList>' +
            '    </gml:LineString>' +
            '    <gml:LineString>' +
            '      <gml:posList>3 4 4 5</gml:posList>' +
            '    </gml:LineString>' +
            '  </gml:lineStringMembers>' +
            '</gml:MultiLineString>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.MultiLineString);
        expect(g.getCoordinates()).to.eql(
            [[[1, 2, 0], [2, 3, 0]], [[3, 4, 0], [4, 5, 0]]]);
      });

    });

    describe('multipolygon', function() {

      it('can read a singular multipolygon geometry', function() {
        var text =
            '<gml:MultiPolygon xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:polygonMember>' +
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
            '  </gml:polygonMember>' +
            '  <gml:polygonMember>' +
            '    <gml:Polygon>' +
            '      <gml:exterior>' +
            '        <gml:LinearRing>' +
            '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:exterior>' +
            '    </gml:Polygon>' +
            '  </gml:polygonMember>' +
            '</gml:MultiPolygon>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0],
            [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
            [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]],
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0], [1, 2, 0]]]]);
      });

      it('can read a plural multipolygon geometry', function() {
        var text =
            '<gml:MultiPolygon xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
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
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0],
            [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
            [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]],
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0], [1, 2, 0]]]]);
      });

    });

    describe('multicurve', function() {

      it('can read a singular multicurve-linestring geometry', function() {
        var text =
            '<gml:MultiCurve xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:curveMember>' +
            '    <gml:LineString>' +
            '      <gml:posList>1 2 2 3</gml:posList>' +
            '    </gml:LineString>' +
            '  </gml:curveMember>' +
            '  <gml:curveMember>' +
            '    <gml:LineString>' +
            '      <gml:posList>3 4 4 5</gml:posList>' +
            '    </gml:LineString>' +
            '  </gml:curveMember>' +
            '</gml:MultiCurve>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.MultiLineString);
        expect(g.getCoordinates()).to.eql(
            [[[1, 2, 0], [2, 3, 0]], [[3, 4, 0], [4, 5, 0]]]);
      });

      it('can read a singular multicurve-curve geometry', function() {
        var text =
            '<gml:MultiCurve xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:curveMember>' +
            '    <gml:Curve>' +
            '      <gml:segments>' +
            '        <gml:LineStringSegment>' +
            '          <gml:posList>1 2 2 3</gml:posList>' +
            '        </gml:LineStringSegment>' +
            '      </gml:segments>' +
            '    </gml:Curve>' +
            '  </gml:curveMember>' +
            '  <gml:curveMember>' +
            '    <gml:Curve>' +
            '      <gml:segments>' +
            '        <gml:LineStringSegment>' +
            '          <gml:posList>3 4 4 5</gml:posList>' +
            '        </gml:LineStringSegment>' +
            '      </gml:segments>' +
            '    </gml:Curve>' +
            '  </gml:curveMember>' +
            '</gml:MultiCurve>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.MultiLineString);
        expect(g.getCoordinates()).to.eql(
            [[[1, 2, 0], [2, 3, 0]], [[3, 4, 0], [4, 5, 0]]]);
      });

    });

    describe('multisurface', function() {

      it('can read a singular multisurface geometry', function() {
        var text =
            '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:surfaceMember>' +
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
            '  </gml:surfaceMember>' +
            '  <gml:surfaceMember>' +
            '    <gml:Polygon>' +
            '      <gml:exterior>' +
            '        <gml:LinearRing>' +
            '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '        </gml:LinearRing>' +
            '      </gml:exterior>' +
            '    </gml:Polygon>' +
            '  </gml:surfaceMember>' +
            '</gml:MultiSurface>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0],
            [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
            [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]],
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0], [1, 2, 0]]]]);
      });

      it('can read a plural multisurface geometry', function() {
        var text =
            '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
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
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0],
            [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
            [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]],
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0], [1, 2, 0]]]]);
      });

      it('can read a multisurface-surface geometry', function() {
        var text =
            '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="foo">' +
            '  <gml:surfaceMember>' +
            '    <gml:Surface>' +
            '      <gml:patches>' +
            '        <gml:PolygonPatch interpolation="planar">' +
            '          <gml:exterior>' +
            '            <gml:LinearRing>' +
            '              <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '            </gml:LinearRing>' +
            '          </gml:exterior>' +
            '          <gml:interior>' +
            '            <gml:LinearRing>' +
            '              <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
            '            </gml:LinearRing>' +
            '          </gml:interior>' +
            '          <gml:interior>' +
            '            <gml:LinearRing>' +
            '              <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
            '            </gml:LinearRing>' +
            '          </gml:interior>' +
            '        </gml:PolygonPatch>' +
            '      </gml:patches>' +
            '    </gml:Surface>' +
            '  </gml:surfaceMember>' +
            '  <gml:surfaceMember>' +
            '    <gml:Surface>' +
            '      <gml:patches>' +
            '        <gml:PolygonPatch interpolation="planar">' +
            '          <gml:exterior>' +
            '            <gml:LinearRing>' +
            '              <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
            '            </gml:LinearRing>' +
            '          </gml:exterior>' +
            '        </gml:PolygonPatch>' +
            '      </gml:patches>' +
            '    </gml:Surface>' +
            '  </gml:surfaceMember>' +
            '</gml:MultiSurface>';
        var g = format.readGeometry(text);
        expect(g).to.be.an(ol.geom.MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0],
            [1, 2, 0]], [[2, 3, 0], [2, 5, 0], [4, 5, 0], [2, 3, 0]],
            [[3, 4, 0], [3, 6, 0], [5, 6, 0], [3, 4, 0]]],
          [[[1, 2, 0], [3, 2, 0], [3, 4, 0], [1, 2, 0]]]]);
      });

    });

  });

  describe('when parsing TOPP states GML', function() {

    var features;
    before(function(done) {
      afterLoadText('spec/ol/format/gml/topp-states-gml.xml', function(xml) {
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

    it('creates 10 features', function() {
      expect(features).to.have.length(10);
    });

  });

});


goog.require('ol.format.GML');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
