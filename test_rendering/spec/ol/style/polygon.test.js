goog.provide('ol.test.rendering.style.Polygon');

goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Style');
goog.require('ol.style.Stroke');


describe('ol.rendering.style.Polygon', function() {

  var target, map, vectorSource;

  function createMap(renderer, opt_size) {
    var size = opt_size || 50;
    target = createMapDiv(size, size);

    vectorSource = new ol.source.Vector();
    var vectorLayer = new ol.layer.Vector({
      source: vectorSource
    });

    map = new ol.Map({
      target: target,
      renderer: renderer,
      layers: [vectorLayer],
      view: new ol.View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
    return map;
  }

  describe('different types', function() {
    afterEach(function() {
      disposeMap(map);
    });

    function createFeatures() {
      var fill = new ol.style.Fill({color: 'red'});

      var feature;
      // rectangle
      feature = new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[-20, 10], [-20, 20], [-5, 20], [-5, 10], [-20, 10]]
        ])
      });
      feature.setStyle(new ol.style.Style({
        fill: fill
      }));
      vectorSource.addFeature(feature);

      // rectangle with 1 hole
      feature = new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[0, 10], [0, 20], [15, 20], [15, 10], [0, 10]],
          [[5, 13], [10, 13], [10, 17], [5, 17], [5, 13]]

        ])
      });
      feature.setStyle(new ol.style.Style({
        fill: fill
      }));
      vectorSource.addFeature(feature);

      // rectangle with 2 holes
      feature = new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[-20, -20], [-20, 5], [15, 5], [15, -20], [-20, -20]],
          [[-18, -18], [-12, -18], [-12, -12], [-18, -12], [-18, -18]],
          [[5, -18], [12, -18], [12, -12], [5, -12], [5, -18]]

        ])
      });
      feature.setStyle(new ol.style.Style({
        fill: fill
      }));
      vectorSource.addFeature(feature);
    }

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      createFeatures();
      expectResemble(map, 'spec/ol/style/expected/polygon-types-canvas.png',
          IMAGE_TOLERANCE, done);
    });
  });

  describe('different types with stroke', function() {
    afterEach(function() {
      disposeMap(map);
    });

    function createFeatures() {
      var stroke = new ol.style.Stroke({
        width: 10,
        color: '#000',
        lineJoin: 'round',
        lineCap: 'butt'
      });

      var feature;
      // rectangle
      feature = new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[-20, 10], [-20, 20], [-5, 20], [-5, 10], [-20, 10]]
        ])
      });
      feature.setStyle(new ol.style.Style({
        stroke: stroke
      }));
      vectorSource.addFeature(feature);

      // rectangle with 1 hole
      feature = new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[0, 10], [0, 20], [20, 20], [20, 10], [0, 10]],
          [[5, 13], [10, 13], [10, 17], [5, 17], [5, 13]]

        ])
      });
      feature.setStyle(new ol.style.Style({
        stroke: stroke
      }));
      vectorSource.addFeature(feature);

      // rectangle with 2 holes
      feature = new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[-20, -20], [-20, 5], [20, 5], [20, -20], [-20, -20]],
          [[-12, -12], [-8, -12], [-8, -3], [-12, -3], [-12, -3]],
          [[0, -12], [13, -12], [13, -3], [0, -3], [0, -12]]

        ])
      });
      feature.setStyle(new ol.style.Style({
        stroke: stroke
      }));
      vectorSource.addFeature(feature);
    }

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas', 100);
      map.getView().setResolution(0.5);
      createFeatures();
      expectResemble(map, 'spec/ol/style/expected/polygon-types-canvas-stroke.png',
          IMAGE_TOLERANCE, done);
    });
  });

  describe('z-index', function() {
    afterEach(function() {
      disposeMap(map);
    });

    function createFeatures() {
      var feature;
      // rectangle with z-index 2
      feature = new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[-20, 10], [-20, 20], [-0, 20], [-0, 10], [-20, 10]]
        ])
      });
      feature.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({color: '#E31E10'}),
        zIndex: 2
      }));
      vectorSource.addFeature(feature);

      // rectangle with z-index 3
      feature = new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[-15, 5], [-15, 15], [5, 15], [5, 5], [-15, 5]]
        ])
      });
      feature.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({color: '#1A5E42'}),
        zIndex: 3
      }));
      vectorSource.addFeature(feature);

      // rectangle with z-index 1
      feature = new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[-10, 0], [-10, 10], [10, 10], [10, 0], [-10, 0]]
        ])
      });
      feature.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({color: '#DEDE21'}),
        zIndex: 1
      }));
      vectorSource.addFeature(feature);

    }

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      createFeatures();
      expectResemble(map, 'spec/ol/style/expected/polygon-zindex-canvas.png',
          IMAGE_TOLERANCE, done);
    });
  });

  describe('different fills and strokes', function() {
    afterEach(function() {
      disposeMap(map);
    });

    function createFeatures() {
      var feature;
      // rectangle
      feature = new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[-20, 10], [-20, 20], [-5, 20], [-5, 10], [-20, 10]]
        ])
      });
      feature.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({color: '#9696EB'}),
        stroke: new ol.style.Stroke({color: '#9696EB', width: 1})
      }));
      vectorSource.addFeature(feature);

      // rectangle with 1 hole
      feature = new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[0, 10], [0, 20], [15, 20], [15, 10], [0, 10]]
        ])
      });
      feature.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({color: 'rgba(255, 0, 0, 0.1)'}),
        stroke: new ol.style.Stroke({color: '#DE213A', width: 3})
      }));
      vectorSource.addFeature(feature);

      // rectangle with 2 holes
      feature = new ol.Feature({
        geometry: new ol.geom.Polygon([
          [[-20, -20], [-20, 5], [15, 5], [15, -20], [-20, -20]]
        ])
      });
      feature.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({color: 'rgba(18, 204, 105, 0.3)'}),
        stroke: new ol.style.Stroke({color: '#032E17', width: 2})
      }));
      vectorSource.addFeature(feature);
    }

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      createFeatures();
      expectResemble(
          map, 'spec/ol/style/expected/polygon-fill-and-strokes-canvas.png',
          IMAGE_TOLERANCE, done);
    });
  });
});
