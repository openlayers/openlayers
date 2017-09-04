

goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');
goog.require('ol.style.Stroke');


describe('ol.rendering.style.LineString', function() {

  var map, vectorSource;

  function createMap(renderer, opt_pixelRatio) {
    vectorSource = new ol.source.Vector();
    var vectorLayer = new ol.layer.Vector({
      source: vectorSource
    });

    map = new ol.Map({
      pixelRatio: opt_pixelRatio || 1,
      target: createMapDiv(50, 50),
      renderer: renderer,
      layers: [vectorLayer],
      view: new ol.View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
  }

  afterEach(function() {
    if (map) {
      disposeMap(map);
      map = null;
    }
  });

  describe('different strokes', function() {

    function createFeatures() {
      var feature;

      feature = new ol.Feature({
        geometry: new ol.geom.LineString(
            [[-20, 20], [15, 20]]
        )
      });
      feature.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({color: '#DE213A', width: 3})
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.LineString(
            [[-20, 15], [15, 15]]
        )
      });
      feature.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({color: '#9696EB', width: 1})
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.LineString(
            [[-20, 10], [15, 10]]
        )
      });
      feature.setStyle([new ol.style.Style({
        stroke: new ol.style.Stroke({color: '#F2F211', width: 5})
      }), new ol.style.Style({
        stroke: new ol.style.Stroke({color: '#292921', width: 1})
      })]);
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.LineString(
            [[-20, -20], [-2, 0], [15, -20]]
        )
      });
      feature.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#000000',
          width: 2,
          lineCap: 'square',
          lineDash: [4, 8],
          lineJoin: 'round'
        })
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.LineString(
            [[-20, -15], [-2, 5], [15, -15]]
        )
      });
      feature.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#000000',
          width: 2,
          lineCap: 'square',
          lineDash: [4, 8],
          lineDashOffset: 6,
          lineJoin: 'round'
        })
      }));
      vectorSource.addFeature(feature);
    }

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      createFeatures();
      expectResemble(
          map, 'rendering/ol/style/expected/linestring-strokes-canvas.png',
          3.0, done);
    });
    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      createFeatures();
      expectResemble(map, 'rendering/ol/style/expected/linestring-strokes-webgl.png',
          14.6, done);
    });

    it('tests the canvas renderer (HiDPI)', function(done) {
      createMap('canvas', 2);
      createFeatures();
      expectResemble(
          map, 'rendering/ol/style/expected/linestring-strokes-canvas-hidpi.png',
          3.0, done);
    });
  });
});
