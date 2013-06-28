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
        -70.08100810081008,
        -69.9009900990099,
        12.417091709170947,
        12.608069195591469
      ]);
    });

  });

});

goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.Parser');
goog.require('ol.parser.TopoJSON');
