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

  });

});


goog.require('ol.format.GML');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
