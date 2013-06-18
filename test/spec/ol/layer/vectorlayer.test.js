goog.provide('ol.test.layer.Vector');

describe('ol.layer.Vector', function() {

  describe('#addFeatures()', function() {

    it('allows adding features', function() {
      var layer = new ol.layer.Vector({
        source: new ol.source.Vector({})
      });
      layer.addFeatures([new ol.Feature(), new ol.Feature()]);
      expect(layer.getFeatures().length).to.eql(2);
    });
  });

  describe('#getFeatures()', function() {

    var layer, features;

    beforeEach(function() {
      features = [
        new ol.Feature({
          g: new ol.geom.Point([16.0, 48.0])
        }),
        new ol.Feature({
          g: new ol.geom.Point([16.1, 48.1])
        }),
        new ol.Feature({
          g: new ol.geom.Point([16.2, 48.2])
        }),
        new ol.Feature({
          g: new ol.geom.Point([16.3, 48.3])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[16.4, 48.4], [16.5, 48.5]])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[16.6, 48.6], [16.7, 48.7]])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[16.8, 48.8], [16.9, 48.9]])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[17.0, 49.0], [17.1, 49.1]])
        })
      ];
      layer = new ol.layer.Vector({
        source: new ol.source.Vector({})
      });
      layer.addFeatures(features);
    });

    var geomFilter = ol.expression.parse('geometryType("linestring")');
    var extentFilter = ol.expression.parse('extent(16, 16.3, 48, 48.3)');

    it('can filter by geometry type using its GeometryType index', function() {
      sinon.spy(geomFilter, 'evaluate');
      var lineStrings = layer.getFeatures(geomFilter);
      expect(geomFilter.evaluate).to.not.be.called();
      expect(lineStrings.length).to.eql(4);
      expect(lineStrings).to.contain(features[4]);
    });

    it('can filter by extent using its RTree', function() {
      sinon.spy(extentFilter, 'evaluate');
      var subset = layer.getFeatures(extentFilter);
      expect(extentFilter.evaluate).to.not.be.called();
      expect(subset.length).to.eql(4);
      expect(subset).not.to.contain(features[7]);
    });

    it('can filter by extent and geometry type using its index', function() {
      var filter1 = new ol.expression.Logical(
          ol.expression.LogicalOp.AND, geomFilter, extentFilter);
      var filter2 = new ol.expression.Logical(
          ol.expression.LogicalOp.AND, extentFilter, geomFilter);
      sinon.spy(filter1, 'evaluate');
      sinon.spy(filter2, 'evaluate');
      var subset1 = layer.getFeatures(filter1);
      var subset2 = layer.getFeatures(filter2);
      expect(filter1.evaluate).to.not.be.called();
      expect(filter2.evaluate).to.not.be.called();
      expect(subset1.length).to.eql(0);
      expect(subset2.length).to.eql(0);
    });

    it('can handle query using the filter\'s evaluate function', function() {
      var filter = new ol.expression.Logical(
          ol.expression.LogicalOp.OR, geomFilter, extentFilter);
      sinon.spy(filter, 'evaluate');
      var subset = layer.getFeatures(filter);
      expect(filter.evaluate).to.be.called();
      expect(subset.length).to.eql(8);
    });

  });

  describe('#groupFeaturesBySymbolizerLiteral()', function() {

    var layer = new ol.layer.Vector({
      source: new ol.source.Vector({
        projection: ol.proj.get('EPSG:4326')
      }),
      style: new ol.style.Style({
        rules: [
          new ol.style.Rule({
            symbolizers: [
              new ol.style.Line({
                strokeWidth: 2,
                strokeColor: ol.expression.parse('colorProperty'),
                opacity: 1
              })
            ]
          })
        ]
      })
    });
    var features;

    it('groups equal symbolizers', function() {
      features = [
        new ol.Feature({
          g: new ol.geom.LineString([[-10, -10], [10, 10]]),
          colorProperty: '#BADA55'
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[-10, 10], [10, -10]]),
          colorProperty: '#013'
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[10, -10], [-10, -10]]),
          colorProperty: '#013'
        })
      ];

      var groups = layer.groupFeaturesBySymbolizerLiteral(features);
      expect(groups.length).to.be(2);
      expect(groups[0][0].length).to.be(1);
      expect(groups[0][1].strokeColor).to.be('#BADA55');
      expect(groups[1][0].length).to.be(2);
      expect(groups[1][1].strokeColor).to.be('#013');
    });

    it('groups equal symbolizers also when defined on features', function() {
      var symbolizer = new ol.style.Line({
        strokeWidth: 3,
        strokeColor: ol.expression.parse('colorProperty'),
        opacity: 1
      });
      var anotherSymbolizer = new ol.style.Line({
        strokeWidth: 3,
        strokeColor: '#BADA55',
        opacity: 1
      });
      var featureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, -10], [-10, 10]]),
        colorProperty: '#BADA55'
      });
      featureWithSymbolizers.setSymbolizers([symbolizer]);
      var anotherFeatureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, 10], [-10, -10]])
      });
      anotherFeatureWithSymbolizers.setSymbolizers([anotherSymbolizer]);
      features.push(featureWithSymbolizers, anotherFeatureWithSymbolizers);

      var groups = layer.groupFeaturesBySymbolizerLiteral(features);
      expect(groups.length).to.be(3);
      expect(groups[2][0].length).to.be(2);
      expect(groups[2][1].strokeWidth).to.be(3);

    });

    goog.dispose(layer);

  });

});

goog.require('goog.dispose');
goog.require('ol.Feature');
goog.require('ol.expression');
goog.require('ol.expression.Logical');
goog.require('ol.expression.LogicalOp');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.proj');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Line');
goog.require('ol.style.Rule');
goog.require('ol.style.Style');
