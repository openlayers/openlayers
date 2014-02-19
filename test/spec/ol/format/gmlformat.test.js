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

  });

});


goog.require('ol.format.GML');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
