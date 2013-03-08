goog.provide('ol.test.layer.Vector');

describe('ol.layer.Vector', function() {

  describe('#addFeatures()', function() {

    it('allows adding features', function() {
      var layer = new ol.layer.Vector({
        source: new ol.source.Vector({})
      });
      layer.addFeatures([new ol.Feature(), new ol.Feature()]);
      expect(layer.getFeatures().length).toEqual(2);
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

    var geomFilter = new ol.filter.Geometry(ol.geom.GeometryType.LINESTRING);
    var extentFilter = new ol.filter.Extent(new ol.Extent(16, 48, 16.3, 48.3));

    it('can filter by geometry type using its GeometryType index', function() {
      spyOn(geomFilter, 'applies');
      var lineStrings = layer.getFeatures(geomFilter);
      expect(geomFilter.applies).not.toHaveBeenCalled();
      expect(lineStrings.length).toEqual(4);
      expect(lineStrings).toContain(features[4]);
    });

    it('can filter by extent using its RTree', function() {
      spyOn(extentFilter, 'applies');
      var subset = layer.getFeatures(extentFilter);
      expect(extentFilter.applies).not.toHaveBeenCalled();
      expect(subset.length).toEqual(4);
      expect(subset).not.toContain(features[7]);
    });

    it('can filter by extent and geometry type using its index', function() {
      var filter1 = new ol.filter.Logical([geomFilter, extentFilter],
          ol.filter.LogicalOperator.AND);
      var filter2 = new ol.filter.Logical([extentFilter, geomFilter],
          ol.filter.LogicalOperator.AND);
      spyOn(filter1, 'applies');
      spyOn(filter2, 'applies');
      var subset1 = layer.getFeatures(filter1);
      var subset2 = layer.getFeatures(filter2);
      expect(filter1.applies).not.toHaveBeenCalled();
      expect(filter2.applies).not.toHaveBeenCalled();
      expect(subset1.length).toEqual(0);
      expect(subset2.length).toEqual(0);
    });

    it('can handle query using the filter\'s applies function', function() {
      var filter = new ol.filter.Logical([geomFilter, extentFilter],
          ol.filter.LogicalOperator.OR);
      spyOn(filter, 'applies').andCallThrough();
      var subset = layer.getFeatures(filter);
      expect(filter.applies).toHaveBeenCalled();
      expect(subset.length).toEqual(8);
    });

  });

  describe('#groupFeaturesBySymbolizerLiteral()', function() {

    var layer = new ol.layer.Vector({
      source: new ol.source.Vector({
        projection: ol.projection.getFromCode('EPSG:4326')
      }),
      style: new ol.style.Style({
        rules: [
          new ol.style.Rule({
            symbolizers: [
              new ol.style.Line({
                strokeWidth: 2,
                strokeColor: new ol.Expression('colorProperty'),
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
      expect(groups.length).toBe(2);
      expect(groups[0][0].length).toBe(1);
      expect(groups[0][1].strokeColor).toBe('#BADA55');
      expect(groups[1][0].length).toBe(2);
      expect(groups[1][1].strokeColor).toBe('#013');
    });

    it('groups equal symbolizers also when defined on features', function() {
      var symbolizer = new ol.style.Line({
        strokeWidth: 3,
        strokeColor: new ol.Expression('colorProperty'),
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
      expect(groups.length).toBe(3);
      expect(groups[2][0].length).toBe(2);
      expect(groups[2][1].strokeWidth).toBe(3);

    });

    layer.dispose();

  });

});

goog.require('ol.Expression');
goog.require('ol.Extent');
goog.require('ol.Feature');
goog.require('ol.Projection');
goog.require('ol.filter.Extent');
goog.require('ol.filter.Geometry');
goog.require('ol.filter.Logical');
goog.require('ol.filter.LogicalOperator');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.projection');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Line');
goog.require('ol.style.Rule');
goog.require('ol.style.Style');
