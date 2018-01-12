import Feature from '../../../../src/ol/Feature.js';
import Point from '../../../../src/ol/geom/Point.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import RegularShape from '../../../../src/ol/style/RegularShape.js';
import Style from '../../../../src/ol/style/Style.js';
import Stroke from '../../../../src/ol/style/Stroke.js';


describe('ol.rendering.style.RegularShape', function() {

  let map, vectorSource;

  function createMap(renderer) {
    vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    map = new Map({
      pixelRatio: 1,
      target: createMapDiv(50, 50),
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

  function createFeatures(stroke, fill) {
    let feature;
    feature = new Feature({
      geometry: new Point([-15, 15])
    });
    // square
    feature.setStyle(new Style({
      image: new RegularShape({
        fill: fill,
        stroke: stroke,
        points: 4,
        radius: 10,
        angle: Math.PI / 4
      })
    }));
    vectorSource.addFeature(feature);

    feature = new Feature({
      geometry: new Point([8, 15])
    });
    // triangle
    feature.setStyle(new Style({
      image: new RegularShape({
        fill: fill,
        stroke: stroke,
        points: 3,
        radius: 10,
        rotation: Math.PI / 4,
        angle: 0
      })
    }));
    vectorSource.addFeature(feature);

    feature = new Feature({
      geometry: new Point([-10, -8])
    });
    // star
    feature.setStyle(new Style({
      image: new RegularShape({
        fill: fill,
        stroke: stroke,
        points: 5,
        radius: 10,
        radius2: 4,
        angle: 0
      })
    }));
    vectorSource.addFeature(feature);

    feature = new Feature({
      geometry: new Point([12, -8])
    });
    // cross
    feature.setStyle(new Style({
      image: new RegularShape({
        fill: fill,
        stroke: stroke,
        points: 4,
        radius: 10,
        radius2: 0,
        angle: 0
      })
    }));
    vectorSource.addFeature(feature);
  }


  describe('#render', function() {
    const stroke = new Stroke({width: 2});
    const fill = new Fill({color: 'red'});

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      createFeatures(stroke, fill);
      expectResemble(map, 'rendering/ol/style/expected/regularshape-canvas.png', 9.4, done);
    });

    it('supports lineDash', function(done) {
      createMap('canvas');
      createFeatures(new Stroke({
        lineDash: [10, 5]
      }));
      expectResemble(map, 'rendering/ol/style/expected/regularshape-canvas-linedash.png', 5, done);
    });

    it('supports lineDashOffset', function(done) {
      createMap('canvas');
      createFeatures(new Stroke({
        lineDash: [10, 5],
        lineDashOffset: 5
      }));
      expectResemble(map, 'rendering/ol/style/expected/regularshape-canvas-linedashoffset.png', 5, done);
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      createFeatures(stroke, fill);
      expectResemble(map, 'rendering/ol/style/expected/regularshape-webgl.png', 8.2, done);
    });
  });

  describe('uses the default fill and stroke color', function() {
    const stroke = new Stroke();
    const fill = new Fill();

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      createFeatures(stroke, fill);
      expectResemble(map, 'rendering/ol/style/expected/regularshape-canvas-default-style.png', 3.0, done);
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      createFeatures(stroke, fill);
      expectResemble(map, 'rendering/ol/style/expected/regularshape-webgl-default-style.png', 3.0, done);
    });
  });
});
