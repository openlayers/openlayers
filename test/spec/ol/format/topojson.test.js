goog.provide('ol.test.format.TopoJSON');

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


describe('ol.format.TopoJSON', function() {

  var format;
  before(function() {
    format = new ol.format.TopoJSON();
  });

  describe('constructor', function() {
    it('creates a new format', function() {
      expect(format).to.be.a(ol.format.Format);
      expect(format).to.be.a(ol.format.TopoJSON);
    });
  });

  describe('#readFeaturesFromTopology_()', function() {

    it('creates an array of features from a topology', function() {
      var features = format.readFeaturesFromObject(aruba);
      expect(features).to.have.length(1);

      var feature = features[0];
      expect(feature).to.be.a(ol.Feature);

      var geometry = feature.getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);

      expect(geometry.getExtent()).to.eql([
        -70.08100810081008, 12.417091709170947,
        -69.9009900990099, 12.608069195591469
      ]);
    });

  });

  describe('#readFeatures()', function() {

    it('parses world-110m.json', function(done) {
      afterLoadText('spec/ol/format/topojson/world-110m.json', function(text) {

        var features = format.readFeatures(text);
        expect(features.length).to.be(178);

        var first = features[0];
        expect(first).to.be.a(ol.Feature);
        var firstGeom = first.getGeometry();
        expect(firstGeom).to.be.a(ol.geom.MultiPolygon);
        expect(firstGeom.getExtent()).to.eql(
            [-180, -85.60903777459777, 180, 83.64513000000002]);

        var last = features[177];
        expect(last).to.be.a(ol.Feature);
        var lastGeom = last.getGeometry();
        expect(lastGeom).to.be.a(ol.geom.Polygon);
        expect(lastGeom.getExtent()).to.eql([
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
goog.require('ol.format.Format');
goog.require('ol.format.TopoJSON');
