goog.provide('ol.test.layer.Vector');

describe('ol.layer.Vector', function() {

  describe('#addFeatures()', function() {

    it('allows adding features', function() {
      var layer = new ol.layer.Vector({
        source: new ol.source.Vector({})
      });
      layer.addFeatures([new ol.Feature(), new ol.Feature()]);
      expect(goog.object.getCount(layer.featureCache_.getFeaturesObject()))
          .to.eql(2);
    });
  });

  describe('ol.layer.FeatureCache#getFeaturesObject()', function() {

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

    var geomFilter = ol.expr.parse('geometryType("linestring")');
    var extentFilter = ol.expr.parse('extent(16, 48, 16.3, 48.3)');

    it('can filter by geometry type using its GeometryType index', function() {
      sinon.spy(geomFilter, 'evaluate');
      var lineStrings = layer.featureCache_.getFeaturesObject(geomFilter);
      expect(geomFilter.evaluate).to.not.be.called();
      expect(goog.object.getCount(lineStrings)).to.eql(4);
      expect(goog.object.getValues(lineStrings)).to.contain(features[4]);
    });

    it('can filter by extent using its RTree', function() {
      sinon.spy(extentFilter, 'evaluate');
      var subset = layer.featureCache_.getFeaturesObject(extentFilter);
      expect(extentFilter.evaluate).to.not.be.called();
      expect(goog.object.getCount(subset)).to.eql(4);
      expect(goog.object.getValues(subset)).not.to.contain(features[7]);
    });

    it('can filter by extent and geometry type using its index', function() {
      var filter1 = new ol.expr.Logical(
          ol.expr.LogicalOp.AND, geomFilter, extentFilter);
      var filter2 = new ol.expr.Logical(
          ol.expr.LogicalOp.AND, extentFilter, geomFilter);
      sinon.spy(filter1, 'evaluate');
      sinon.spy(filter2, 'evaluate');
      var subset1 = layer.featureCache_.getFeaturesObject(filter1);
      var subset2 = layer.featureCache_.getFeaturesObject(filter2);
      expect(filter1.evaluate).to.not.be.called();
      expect(filter2.evaluate).to.not.be.called();
      expect(goog.object.getCount(subset1)).to.eql(0);
      expect(goog.object.getCount(subset2)).to.eql(0);
    });

    it('can handle query using the filter\'s evaluate function', function() {
      var filter = new ol.expr.Logical(
          ol.expr.LogicalOp.OR, geomFilter, extentFilter);
      sinon.spy(filter, 'evaluate');
      var subset = layer.featureCache_.getFeaturesObject(filter);
      expect(filter.evaluate).to.be.called();
      expect(goog.object.getCount(subset)).to.eql(8);
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
              new ol.style.Stroke({
                width: 2,
                color: ol.expr.parse('colorProperty'),
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
      expect(groups[0][1].color).to.be('#BADA55');
      expect(groups[1][0].length).to.be(2);
      expect(groups[1][1].color).to.be('#013');
    });

    it('groups equal symbolizers also when defined on features', function() {
      var symbolizer = new ol.style.Stroke({
        width: 3,
        color: ol.expr.parse('colorProperty'),
        opacity: 1
      });
      var anotherSymbolizer = new ol.style.Stroke({
        width: 3,
        color: '#BADA55',
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
      expect(groups).to.have.length(3);
      expect(groups[2][0].length).to.be(2);
      expect(groups[2][1].width).to.be(3);

    });

    goog.dispose(layer);

  });

});

goog.require('goog.dispose');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.expr.Logical');
goog.require('ol.expr.LogicalOp');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.proj');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Rule');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
