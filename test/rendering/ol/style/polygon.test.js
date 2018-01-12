import Feature from '../../../../src/ol/Feature.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Style from '../../../../src/ol/style/Style.js';
import Stroke from '../../../../src/ol/style/Stroke.js';


describe('ol.rendering.style.Polygon', function() {

  let map, vectorSource;

  function createMap(renderer, opt_size) {
    const size = opt_size || 50;

    vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    map = new Map({
      pixelRatio: 1,
      target: createMapDiv(size, size),
      renderer: renderer,
      layers: [vectorLayer],
      view: new View({
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
      const fill = new Fill({color: 'red'});

      let feature;
      // rectangle
      feature = new Feature({
        geometry: new Polygon([
          [[-20, 10], [-20, 20], [-5, 20], [-5, 10], [-20, 10]]
        ])
      });
      feature.setStyle(new Style({
        fill: fill
      }));
      vectorSource.addFeature(feature);

      // rectangle with 1 hole
      feature = new Feature({
        geometry: new Polygon([
          [[0, 10], [0, 20], [15, 20], [15, 10], [0, 10]],
          [[5, 13], [10, 13], [10, 17], [5, 17], [5, 13]]

        ])
      });
      feature.setStyle(new Style({
        fill: fill
      }));
      vectorSource.addFeature(feature);

      // rectangle with 2 holes
      feature = new Feature({
        geometry: new Polygon([
          [[-20, -20], [-20, 5], [15, 5], [15, -20], [-20, -20]],
          [[-18, -18], [-12, -18], [-12, -12], [-18, -12], [-18, -18]],
          [[5, -18], [12, -18], [12, -12], [5, -12], [5, -18]]

        ])
      });
      feature.setStyle(new Style({
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
      const stroke = new Stroke({
        width: 10,
        color: '#000',
        lineJoin: 'round',
        lineCap: 'butt'
      });

      let feature;
      // rectangle
      feature = new Feature({
        geometry: new Polygon([
          [[-20, 10], [-20, 20], [-5, 20], [-5, 10], [-20, 10]]
        ])
      });
      feature.setStyle(new Style({
        stroke: stroke
      }));
      vectorSource.addFeature(feature);

      // rectangle with 1 hole
      feature = new Feature({
        geometry: new Polygon([
          [[0, 10], [0, 20], [20, 20], [20, 10], [0, 10]],
          [[5, 13], [10, 13], [10, 17], [5, 17], [5, 13]]

        ])
      });
      feature.setStyle(new Style({
        stroke: stroke
      }));
      vectorSource.addFeature(feature);

      // rectangle with 2 holes
      feature = new Feature({
        geometry: new Polygon([
          [[-20, -20], [-20, 5], [20, 5], [20, -20], [-20, -20]],
          [[-12, -3], [-12, -12], [-8, -12], [-8, -3], [-12, -3]],
          [[0, -12], [13, -12], [13, -3], [0, -3], [0, -12]]

        ])
      });
      feature.setStyle(new Style({
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
      let feature;
      // rectangle with z-index 2
      feature = new Feature({
        geometry: new Polygon([
          [[-20, 10], [-20, 20], [-0, 20], [-0, 10], [-20, 10]]
        ])
      });
      feature.setStyle(new Style({
        fill: new Fill({color: '#E31E10'}),
        zIndex: 2
      }));
      vectorSource.addFeature(feature);

      // rectangle with z-index 3
      feature = new Feature({
        geometry: new Polygon([
          [[-15, 5], [-15, 15], [5, 15], [5, 5], [-15, 5]]
        ])
      });
      feature.setStyle(new Style({
        fill: new Fill({color: '#1A5E42'}),
        zIndex: 3
      }));
      vectorSource.addFeature(feature);

      // rectangle with z-index 1
      feature = new Feature({
        geometry: new Polygon([
          [[-10, 0], [-10, 10], [10, 10], [10, 0], [-10, 0]]
        ])
      });
      feature.setStyle(new Style({
        fill: new Fill({color: '#DEDE21'}),
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
      let feature;
      // rectangle
      feature = new Feature({
        geometry: new Polygon([
          [[-20, 10], [-20, 20], [-5, 20], [-5, 10], [-20, 10]]
        ])
      });
      feature.setStyle(new Style({
        fill: new Fill({color: '#9696EB'}),
        stroke: new Stroke({color: '#9696EB', width: 1})
      }));
      vectorSource.addFeature(feature);

      // rectangle with 1 hole
      feature = new Feature({
        geometry: new Polygon([
          [[0, 10], [0, 20], [15, 20], [15, 10], [0, 10]]
        ])
      });
      feature.setStyle(new Style({
        fill: new Fill({color: 'rgba(255, 0, 0, 0.1)'}),
        stroke: new Stroke({color: '#DE213A', width: 3})
      }));
      vectorSource.addFeature(feature);

      // rectangle with 2 holes
      feature = new Feature({
        geometry: new Polygon([
          [[-20, -20], [-20, 5], [15, 5], [15, -20], [-20, -20]]
        ])
      });
      feature.setStyle(new Style({
        fill: new Fill({color: 'rgba(18, 204, 105, 0.3)'}),
        stroke: new Stroke({color: '#032E17', width: 2})
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
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const gradient = context.createLinearGradient(0, 0, 30, 0);
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
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
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
      const feature = new Feature({
        geometry: new Polygon([
          [[-20, -20], [-20, 20], [18, 20], [-20, -20]]
        ])
      });
      feature.setStyle(new Style({
        fill: new Fill({color: createPattern()}),
        stroke: new Stroke({color: createRainbowGradient(), width: 3})
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
