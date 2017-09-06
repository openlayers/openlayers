

import _ol_Feature_ from '../../../../src/ol/feature';
import _ol_geom_MultiPolygon_ from '../../../../src/ol/geom/multipolygon';
import _ol_geom_Polygon_ from '../../../../src/ol/geom/polygon';
import _ol_format_Feature_ from '../../../../src/ol/format/feature';
import _ol_proj_ from '../../../../src/ol/proj';
import _ol_format_TopoJSON_ from '../../../../src/ol/format/topojson';

var aruba = {
  type: 'Topology',
  transform: {
    scale: [0.036003600360036005, 0.017361589674592462],
    translate: [-180, -89.99892578124998]
  },
  objects: {
    aruba: {
      type: 'Polygon',
      properties: {
        prop0: 'value0'
      },
      arcs: [[0]],
      id: 533
    }
  },
  arcs: [
    [[3058, 5901], [0, -2], [-2, 1], [-1, 3], [-2, 3], [0, 3], [1, 1], [1, -3],
      [2, -5], [1, -1]]
  ]
};

var zeroId = {
  type: 'Topology',
  objects: {
    foobar: {
      type: 'Point',
      id: 0,
      coordinates: [0, 42]
    }
  }
};

describe('ol.format.TopoJSON', function() {

  var format;
  before(function() {
    format = new _ol_format_TopoJSON_();
  });

  describe('constructor', function() {
    it('creates a new format', function() {
      expect(format).to.be.a(_ol_format_Feature_);
      expect(format).to.be.a(_ol_format_TopoJSON_);
    });
  });

  describe('#readFeaturesFromTopology_()', function() {

    it('creates an array of features from a topology', function() {
      var features = format.readFeaturesFromObject(aruba);
      expect(features).to.have.length(1);

      var feature = features[0];
      expect(feature).to.be.a(_ol_Feature_);

      var geometry = feature.getGeometry();
      expect(geometry).to.be.a(_ol_geom_Polygon_);

      // Parses identifier
      expect(feature.getId()).to.be(533);
      // Parses properties
      expect(feature.get('prop0')).to.be('value0');

      expect(geometry.getExtent()).to.eql([
        -70.08100810081008, 12.417091709170947,
        -69.9009900990099, 12.608069195591469
      ]);
    });

    it('can read a feature with id equal to 0', function() {
      var features = format.readFeaturesFromObject(zeroId);
      expect(features).to.have.length(1);

      var feature = features[0];
      expect(feature).to.be.a(_ol_Feature_);
      expect(feature.getId()).to.be(0);
    });

  });

  describe('#readFeatures()', function() {

    it('parses simple.json', function(done) {
      afterLoadText('spec/ol/format/topojson/simple.json', function(text) {
        var features = format.readFeatures(text);
        expect(features.length).to.be(3);

        var point = features[0].getGeometry();
        expect(point.getType()).to.be('Point');
        expect(point.getFlatCoordinates()).to.eql([102, 0.5]);

        var line = features[1].getGeometry();
        expect(line.getType()).to.be('LineString');
        expect(line.getFlatCoordinates()).to.eql([
          102, 0, 103, 1, 104, 0, 105, 1
        ]);

        var polygon = features[2].getGeometry();
        expect(polygon.getType()).to.be('Polygon');
        expect(polygon.getFlatCoordinates()).to.eql([
          100, 0, 100, 1, 101, 1, 101, 0, 100, 0
        ]);

        done();
      });
    });

    it('parses simple.json and transforms', function(done) {
      afterLoadText('spec/ol/format/topojson/simple.json', function(text) {
        var features = format.readFeatures(text, {
          featureProjection: 'EPSG:3857'
        });
        expect(features.length).to.be(3);

        var point = features[0].getGeometry();
        expect(point.getType()).to.be('Point');
        expect(features[0].getGeometry().getCoordinates()).to.eql(
            _ol_proj_.transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));

        var line = features[1].getGeometry();
        expect(line.getType()).to.be('LineString');
        expect(line.getCoordinates()).to.eql([
          _ol_proj_.transform([102.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
          _ol_proj_.transform([103.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
          _ol_proj_.transform([104.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
          _ol_proj_.transform([105.0, 1.0], 'EPSG:4326', 'EPSG:3857')
        ]);

        var polygon = features[2].getGeometry();
        expect(polygon.getType()).to.be('Polygon');
        expect(polygon.getCoordinates()).to.eql([[
          _ol_proj_.transform([100.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
          _ol_proj_.transform([100.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
          _ol_proj_.transform([101.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
          _ol_proj_.transform([101.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
          _ol_proj_.transform([100.0, 0.0], 'EPSG:4326', 'EPSG:3857')
        ]]);

        done();
      });
    });

    it('parses world-110m.json', function(done) {
      afterLoadText('spec/ol/format/topojson/world-110m.json', function(text) {

        var features = format.readFeatures(text);
        expect(features.length).to.be(178);

        var first = features[0];
        expect(first).to.be.a(_ol_Feature_);
        var firstGeom = first.getGeometry();
        expect(firstGeom).to.be.a(_ol_geom_MultiPolygon_);
        expect(firstGeom.getExtent()).to.eql(
            [-180, -85.60903777459777, 180, 83.64513000000002]);

        var last = features[177];
        expect(last).to.be.a(_ol_Feature_);
        var lastGeom = last.getGeometry();
        expect(lastGeom).to.be.a(_ol_geom_Polygon_);
        expect(lastGeom.getExtent()).to.eql([
          25.26325263252633, -22.271802279310577,
          32.848528485284874, -15.50833810039586
        ]);

        done();
      });
    });

    it('sets the topology\'s child names as feature property', function(done) {
      afterLoadText('spec/ol/format/topojson/world-110m.json', function(text) {
        var format = new _ol_format_TopoJSON_({
          layerName: 'layer'
        });
        var features = format.readFeatures(text);
        expect(features[0].get('layer')).to.be('land');
        expect(features[177].get('layer')).to.be('countries');
        done();
      });
    });

    it('only parses features from specified topology\'s children', function(done) {
      afterLoadText('spec/ol/format/topojson/world-110m.json', function(text) {
        var format = new _ol_format_TopoJSON_({
          layers: ['land']
        });
        var features = format.readFeatures(text);
        expect(features.length).to.be(1);
        done();
      });
    });

  });

});
