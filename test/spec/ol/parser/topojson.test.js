goog.provide('ol.test.parser.TopoJSON');

var aruba = {
  type: 'Topology',
  transform: {
    scale: [0.036003600360036005, 0.017361589674592462],
    translate: [-180, -89.99892578124998]
  },
  objects: {
    aruba: {
      type: 'Polygon',
      arcs: [[0]],
      id: 533
    }
  },
  arcs: [
    [[3058, 5901], [0, -2], [-2, 1], [-1, 3], [-2, 3], [0, 3], [1, 1], [1, -3],
      [2, -5], [1, -1]]
  ]
};


describe('ol.parser.TopoJSON', function() {

  var parser;
  before(function() {
    parser = new ol.parser.TopoJSON();
  });

  describe('constructor', function() {
    it('creates a new parser', function() {
      expect(parser).to.be.a(ol.parser.Parser);
      expect(parser).to.be.a(ol.parser.TopoJSON);
    });
  });

  describe('#readFeaturesFromTopology_()', function() {

    it('creates an array of features from a topology', function() {
      var features = parser.readFeaturesFromTopology_(aruba);
      expect(features).to.have.length(1);

      var feature = features[0];
      expect(feature).to.be.a(ol.Feature);

      var geometry = feature.getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      expect(geometry.getBounds()).to.eql([
        -70.08100810081008, 12.417091709170947,
        -69.9009900990099, 12.608069195591469
      ]);
    });

  });

  describe('#readFeaturesFromString()', function() {

    it('parses world-110m.geojson with shared vertices', function(done) {
      afterLoadText('spec/ol/parser/topojson/world-110m.json', function(text) {

        var pointVertices = new ol.geom.SharedVertices();
        var lineVertices = new ol.geom.SharedVertices();
        var polygonVertices = new ol.geom.SharedVertices();

        var lookup = {
          'point': pointVertices,
          'linestring': lineVertices,
          'polygon': polygonVertices,
          'multipoint': pointVertices,
          'multilinstring': lineVertices,
          'multipolygon': polygonVertices
        };

        var callback = function(feature, type) {
          return lookup[type];
        };

        var result = parser.readFeaturesFromString(text, {callback: callback});
        expect(result.features.length).to.be(178);

        expect(pointVertices.coordinates.length).to.be(0);
        expect(lineVertices.coordinates.length).to.be(0);
        expect(polygonVertices.coordinates.length).to.be(31400);

        var first = result.features[0];
        expect(first).to.be.a(ol.Feature);
        var firstGeom = first.getGeometry();
        expect(firstGeom).to.be.a(ol.geom.MultiPolygon);
        expect(firstGeom.getBounds()).to.eql(
            [-180, -85.60903777459777, 180, 83.64513000000002]);

        var last = result.features[177];
        expect(last).to.be.a(ol.Feature);
        var lastGeom = last.getGeometry();
        expect(lastGeom).to.be.a(ol.geom.Polygon);
        expect(lastGeom.getBounds()).to.eql([
          25.26325263252633, -22.271802279310577,
          32.848528485284874, -15.50833810039586
        ]);

        done();
      });
    });

  });

});

goog.require('ol.Feature');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.SharedVertices');
goog.require('ol.parser.Parser');
goog.require('ol.parser.TopoJSON');
