

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.RegularShape');
goog.require('ol.style.Style');
goog.require('ol.style.Stroke');


describe('ol.rendering.style.RegularShape', function() {

  var map, vectorSource;

  function createMap(renderer) {
    vectorSource = new ol.source.Vector();
    var vectorLayer = new ol.layer.Vector({
      source: vectorSource
    });

    map = new ol.Map({
      pixelRatio: 1,
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

  function createFeatures(stroke, fill) {
    var feature;
    feature = new ol.Feature({
      geometry: new ol.geom.Point([-15, 15])
    });
    // square
    feature.setStyle(new ol.style.Style({
      image: new ol.style.RegularShape({
        fill: fill,
        stroke: stroke,
        points: 4,
        radius: 10,
        angle: Math.PI / 4
      })
    }));
    vectorSource.addFeature(feature);

    feature = new ol.Feature({
      geometry: new ol.geom.Point([8, 15])
    });
    // triangle
    feature.setStyle(new ol.style.Style({
      image: new ol.style.RegularShape({
        fill: fill,
        stroke: stroke,
        points: 3,
        radius: 10,
        rotation: Math.PI / 4,
        angle: 0
      })
    }));
    vectorSource.addFeature(feature);

    feature = new ol.Feature({
      geometry: new ol.geom.Point([-10, -8])
    });
    // star
    feature.setStyle(new ol.style.Style({
      image: new ol.style.RegularShape({
        fill: fill,
        stroke: stroke,
        points: 5,
        radius: 10,
        radius2: 4,
        angle: 0
      })
    }));
    vectorSource.addFeature(feature);

    feature = new ol.Feature({
      geometry: new ol.geom.Point([12, -8])
    });
    // cross
    feature.setStyle(new ol.style.Style({
      image: new ol.style.RegularShape({
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
    var stroke = new ol.style.Stroke({width: 2});
    var fill = new ol.style.Fill({color: 'red'});

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      createFeatures(stroke, fill);
      expectResemble(map, 'rendering/ol/style/expected/regularshape-canvas.png', 9.4, done);
    });

    it('supports lineDash', function(done) {
      createMap('canvas');
      createFeatures(new ol.style.Stroke({
        lineDash: [10, 5]
      }));
      expectResemble(map, 'rendering/ol/style/expected/regularshape-canvas-linedash.png', 5, done);
    });

    it('supports lineDashOffset', function(done) {
      createMap('canvas');
      createFeatures(new ol.style.Stroke({
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
    var stroke = new ol.style.Stroke();
    var fill = new ol.style.Fill();

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
