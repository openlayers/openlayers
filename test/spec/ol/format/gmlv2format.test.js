goog.provide('ol.test.format.GML.v2');

var readGeometry = function(format, text, opt_options) {
  var doc = ol.xml.load(text);
  // we need an intermediate node for testing purposes
  var node = goog.dom.createElement(goog.dom.TagName.PRE);
  node.appendChild(doc.documentElement);
  return format.readGeometryFromNode(node, opt_options);
};

describe('ol.format.GML.v2', function() {

  var format, formatWGS84, formatNoSrs;
  beforeEach(function() {
    format = new ol.format.GML.v2({srsName: 'CRS:84'});
    formatWGS84 = new ol.format.GML.v2({
      srsName: 'urn:x-ogc:def:crs:EPSG:4326'
    });
    formatNoSrs = new ol.format.GML.v2();
  });


  describe('#readGeometry', function() {

    describe('gml 2.1.2', function() {

      it('can read a point geometry', function() {
        var text = '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
            '  <gml:coordinates>-90,-180</gml:coordinates>' +
            '</gml:Point>';

        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.Point);
        expect(g.getCoordinates()).to.eql([-180, -90, 0]);
      });

      it('can read a multipolygon with gml:coordinates', function() {

        var text =
            '<gml:MultiPolygon xmlns:gml="http://www.opengis.net/gml" ' +
            '        srsName="EPSG:4326">' +
            '  <gml:polygonMember>' +
            '    <gml:Polygon>' +
            '      <gml:outerBoundaryIs>' +
            '        <gml:LinearRing>' +
            '          <gml:coordinates>-0.318987,47.003018 ' +
            '             -0.768746,47.358268 ' +
            '             -0.574463,47.684285 -0.347374,47.854602 ' +
            '             -0.006740,47.925567 ' +
            '             0.135191,47.726864 0.149384,47.599127 0.419052,' +
            '             47.670092 0.532597,47.428810 ' +
            '             0.305508,47.443003 0.475824,47.144948 0.064225,' +
            '             47.201721 ' +
            '             -0.318987,47.003018 </gml:coordinates>' +
            '        </gml:LinearRing>' +
            '      </gml:outerBoundaryIs>' +
            '      <gml:innerBoundaryIs>' +
            '        <gml:LinearRing>' +
            '          <gml:coordinates>-0.035126,47.485582 -0.035126,' +
            '             47.485582 ' +
            '             -0.049319,47.641706 -0.233829,47.655899 ' +
            '             -0.375760,47.457196 ' +
            '             -0.276408,47.286879 -0.035126,47.485582 ' +
            '          </gml:coordinates>' +
            '        </gml:LinearRing>' +
            '      </gml:innerBoundaryIs>' +
            '    </gml:Polygon>' +
            '  </gml:polygonMember>' +
            '</gml:MultiPolygon>';

        var g = readGeometry(format, text);
        expect(g).to.be.an(ol.geom.MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [
            [
              [47.003018, -0.318987, 0], [47.358268, -0.768746, 0],
              [47.684285, -0.574463, 0], [47.854602, -0.347374, 0],
              [47.925567, -0.00674, 0], [47.726864, 0.135191, 0],
              [47.599127, 0.149384, 0], [47.670092, 0.419052, 0],
              [47.42881, 0.532597, 0], [47.443003, 0.305508, 0],
              [47.144948, 0.475824, 0], [47.201721, 0.064225, 0],
              [47.003018, -0.318987, 0]
            ],
            [
              [47.485582, -0.035126, 0], [47.485582, -0.035126, 0],
              [47.641706, -0.049319, 0], [47.655899, -0.233829, 0],
              [47.457196, -0.37576, 0], [47.286879, -0.276408, 0],
              [47.485582, -0.035126, 0]
            ]
          ]
        ]);
      });
    });
  });
});

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol.format.GML');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.xml');
goog.require('ol.geom.Point');
