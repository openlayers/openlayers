

import _ol_Feature_ from '../../../../src/ol/feature';
import _ol_geom_Polygon_ from '../../../../src/ol/geom/polygon';
import _ol_Map_ from '../../../../src/ol/map';
import _ol_View_ from '../../../../src/ol/view';
import _ol_layer_Vector_ from '../../../../src/ol/layer/vector';
import _ol_source_Vector_ from '../../../../src/ol/source/vector';
import _ol_style_Fill_ from '../../../../src/ol/style/fill';
import _ol_style_Style_ from '../../../../src/ol/style/style';
import _ol_style_Stroke_ from '../../../../src/ol/style/stroke';


describe('ol.rendering.style.Polygon', function() {

  var map, vectorSource;

  function createMap(renderer, opt_size) {
    var size = opt_size || 50;

    vectorSource = new _ol_source_Vector_();
    var vectorLayer = new _ol_layer_Vector_({
      source: vectorSource
    });

    map = new _ol_Map_({
      pixelRatio: 1,
      target: createMapDiv(size, size),
      renderer: renderer,
      layers: [vectorLayer],
      view: new _ol_View_({
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

  describe('different types', function() {

    function createFeatures() {
      var fill = new _ol_style_Fill_({color: 'red'});

      var feature;
      // rectangle
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[-20, 10], [-20, 20], [-5, 20], [-5, 10], [-20, 10]]
        ])
      });
      feature.setStyle(new _ol_style_Style_({
        fill: fill
      }));
      vectorSource.addFeature(feature);

      // rectangle with 1 hole
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[0, 10], [0, 20], [15, 20], [15, 10], [0, 10]],
          [[5, 13], [10, 13], [10, 17], [5, 17], [5, 13]]

        ])
      });
      feature.setStyle(new _ol_style_Style_({
        fill: fill
      }));
      vectorSource.addFeature(feature);

      // rectangle with 2 holes
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[-20, -20], [-20, 5], [15, 5], [15, -20], [-20, -20]],
          [[-18, -18], [-12, -18], [-12, -12], [-18, -12], [-18, -18]],
          [[5, -18], [12, -18], [12, -12], [5, -12], [5, -18]]

        ])
      });
      feature.setStyle(new _ol_style_Style_({
        fill: fill
      }));
      vectorSource.addFeature(feature);
    }

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      createFeatures();
      expectResemble(map, 'rendering/ol/style/expected/polygon-types-canvas.png',
          IMAGE_TOLERANCE, done);
    });

    where('WebGL').it('tests the webgl renderer', function(done) {
      createMap('webgl');
      createFeatures();
      expectResemble(map, 'rendering/ol/style/expected/polygon-types-webgl.png',
          IMAGE_TOLERANCE, done);
    });
  });

  describe('different types with stroke', function() {

    function createFeatures() {
      var stroke = new _ol_style_Stroke_({
        width: 10,
        color: '#000',
        lineJoin: 'round',
        lineCap: 'butt'
      });

      var feature;
      // rectangle
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[-20, 10], [-20, 20], [-5, 20], [-5, 10], [-20, 10]]
        ])
      });
      feature.setStyle(new _ol_style_Style_({
        stroke: stroke
      }));
      vectorSource.addFeature(feature);

      // rectangle with 1 hole
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[0, 10], [0, 20], [20, 20], [20, 10], [0, 10]],
          [[5, 13], [10, 13], [10, 17], [5, 17], [5, 13]]

        ])
      });
      feature.setStyle(new _ol_style_Style_({
        stroke: stroke
      }));
      vectorSource.addFeature(feature);

      // rectangle with 2 holes
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[-20, -20], [-20, 5], [20, 5], [20, -20], [-20, -20]],
          [[-12, -3], [-12, -12], [-8, -12], [-8, -3], [-12, -3]],
          [[0, -12], [13, -12], [13, -3], [0, -3], [0, -12]]

        ])
      });
      feature.setStyle(new _ol_style_Style_({
        stroke: stroke
      }));
      vectorSource.addFeature(feature);
    }

    it('tests the canvas renderer', function(done) {
      createMap('canvas', 100);
      map.getView().setResolution(0.5);
      createFeatures();
      expectResemble(map, 'rendering/ol/style/expected/polygon-types-canvas-stroke.png',
          IMAGE_TOLERANCE, done);
    });

    where('WebGL').it('tests the webgl renderer', function(done) {
      createMap('webgl', 100);
      map.getView().setResolution(0.5);
      createFeatures();
      expectResemble(map, 'rendering/ol/style/expected/polygon-types-webgl-stroke.png',
          IMAGE_TOLERANCE, done);
    });
  });

  describe('z-index', function() {

    function createFeatures() {
      var feature;
      // rectangle with z-index 2
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[-20, 10], [-20, 20], [-0, 20], [-0, 10], [-20, 10]]
        ])
      });
      feature.setStyle(new _ol_style_Style_({
        fill: new _ol_style_Fill_({color: '#E31E10'}),
        zIndex: 2
      }));
      vectorSource.addFeature(feature);

      // rectangle with z-index 3
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[-15, 5], [-15, 15], [5, 15], [5, 5], [-15, 5]]
        ])
      });
      feature.setStyle(new _ol_style_Style_({
        fill: new _ol_style_Fill_({color: '#1A5E42'}),
        zIndex: 3
      }));
      vectorSource.addFeature(feature);

      // rectangle with z-index 1
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[-10, 0], [-10, 10], [10, 10], [10, 0], [-10, 0]]
        ])
      });
      feature.setStyle(new _ol_style_Style_({
        fill: new _ol_style_Fill_({color: '#DEDE21'}),
        zIndex: 1
      }));
      vectorSource.addFeature(feature);

    }

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      createFeatures();
      expectResemble(map, 'rendering/ol/style/expected/polygon-zindex-canvas.png',
          IMAGE_TOLERANCE, done);
    });

    where('WebGL').it('tests the webgl renderer', function(done) {
      createMap('webgl');
      createFeatures();
      expectResemble(map, 'rendering/ol/style/expected/polygon-zindex-webgl.png',
          IMAGE_TOLERANCE, done);
    });
  });

  describe('different fills and strokes', function() {

    function createFeatures() {
      var feature;
      // rectangle
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[-20, 10], [-20, 20], [-5, 20], [-5, 10], [-20, 10]]
        ])
      });
      feature.setStyle(new _ol_style_Style_({
        fill: new _ol_style_Fill_({color: '#9696EB'}),
        stroke: new _ol_style_Stroke_({color: '#9696EB', width: 1})
      }));
      vectorSource.addFeature(feature);

      // rectangle with 1 hole
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[0, 10], [0, 20], [15, 20], [15, 10], [0, 10]]
        ])
      });
      feature.setStyle(new _ol_style_Style_({
        fill: new _ol_style_Fill_({color: 'rgba(255, 0, 0, 0.1)'}),
        stroke: new _ol_style_Stroke_({color: '#DE213A', width: 3})
      }));
      vectorSource.addFeature(feature);

      // rectangle with 2 holes
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[-20, -20], [-20, 5], [15, 5], [15, -20], [-20, -20]]
        ])
      });
      feature.setStyle(new _ol_style_Style_({
        fill: new _ol_style_Fill_({color: 'rgba(18, 204, 105, 0.3)'}),
        stroke: new _ol_style_Stroke_({color: '#032E17', width: 2})
      }));
      vectorSource.addFeature(feature);
    }

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      createFeatures();
      expectResemble(
          map, 'rendering/ol/style/expected/polygon-fill-and-strokes-canvas.png',
          IMAGE_TOLERANCE, done);
    });

    where('WebGL').it('tests the webgl renderer', function(done) {
      createMap('webgl');
      createFeatures();
      expectResemble(
          map, 'rendering/ol/style/expected/polygon-fill-and-strokes-webgl.png',
          5.76, done);
    });
  });

  describe('CanvasPattern and LinearGradient as fills and strokes', function() {

    function createRainbowGradient() {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      var gradient = context.createLinearGradient(0, 0, 30, 0);
      gradient.addColorStop(0, 'red');
      gradient.addColorStop(1 / 6, 'orange');
      gradient.addColorStop(2 / 6, 'yellow');
      gradient.addColorStop(3 / 6, 'green');
      gradient.addColorStop(4 / 6, 'aqua');
      gradient.addColorStop(5 / 6, 'blue');
      gradient.addColorStop(1, 'purple');
      return gradient;
    }

    function createPattern() {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = 11;
      canvas.height = 11;
      context.fillStyle = 'rgba(102, 0, 102, 0.5)';
      context.beginPath();
      context.arc(5, 5, 4, 0, 2 * Math.PI);
      context.fill();
      context.fillStyle = 'rgb(55, 0, 170)';
      context.beginPath();
      context.arc(5, 5, 2, 0, 2 * Math.PI);
      context.fill();
      return context.createPattern(canvas, 'repeat');
    }

    function createFeatures() {
      var feature = new _ol_Feature_({
        geometry: new _ol_geom_Polygon_([
          [[-20, -20], [-20, 20], [18, 20], [-20, -20]]
        ])
      });
      feature.setStyle(new _ol_style_Style_({
        fill: new _ol_style_Fill_({color: createPattern()}),
        stroke: new _ol_style_Stroke_({color: createRainbowGradient(), width: 3})
      }));
      vectorSource.addFeature(feature);
    }

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      createFeatures();
      expectResemble(
          map, 'rendering/ol/style/expected/polygon-pattern-gradient-canvas.png',
          2.75, done);
    });
  });

});
