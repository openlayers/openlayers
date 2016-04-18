goog.provide('ol.test.rendering.layer.Vector');

describe('ol.rendering.layer.Vector', function() {

  var center, target, map;

  function createMap(renderer) {
    target = createMapDiv(80, 80);
    center = [1825927.7316762917, 6143091.089223046];

    map = new ol.Map({
      target: target,
      renderer: renderer,
      view: new ol.View({
        center: center,
        zoom: 13
      })
    });
    return map;
  }

  var source;

  function addCircle(r) {
    source.addFeature(new ol.Feature(new ol.geom.Circle(center, r)));
  }

  function addPolygon(r) {
    source.addFeature(new ol.Feature(new ol.geom.Polygon([
      [
        [center[0] - r, center[1] - r],
        [center[0] + r, center[1] - r],
        [center[0] + r, center[1] + r],
        [center[0] - r, center[1] + r],
        [center[0] - r, center[1] - r]
      ]
    ])));
  }

  describe('vector layer', function() {

    beforeEach(function() {
      source = new ol.source.Vector();
    });

    afterEach(function() {
      disposeMap(map);
    });

    it('renders opacity correctly with the canvas renderer', function(done) {
      map = createMap('canvas');
      var smallLine = new ol.Feature(new ol.geom.LineString([
        [center[0], center[1] - 1],
        [center[0], center[1] + 1]
      ]));
      smallLine.setStyle(new ol.style.Style({
        zIndex: -99,
        stroke: new ol.style.Stroke({width: 75, color: 'red'})
      }));
      source.addFeature(smallLine);
      addPolygon(100);
      addCircle(200);
      addPolygon(250);
      addCircle(500);
      addPolygon(600);
      addPolygon(720);
      map.addLayer(new ol.layer.Vector({
        source: source
      }));
      map.once('postrender', function() {
        expectResemble(map, 'spec/ol/layer/expected/vector-canvas.png',
            17, done);
      });
    });

    it('renders fill/stroke batches correctly with the canvas renderer', function(done) {
      map = createMap('canvas');
      source = new ol.source.Vector({
        overlaps: false
      });
      addPolygon(100);
      addCircle(200);
      addPolygon(250);
      addCircle(500);
      addPolygon(600);
      addPolygon(720);
      map.addLayer(new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: '#3399CC',
            width: 1.25
          })
        })
      }));
      map.once('postrender', function() {
        expectResemble(map, 'spec/ol/layer/expected/vector-canvas-opaque.png',
            17, done);
      })
    });

  });

});

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.Feature');
goog.require('ol.geom.Circle');
goog.require('ol.geom.Polygon');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
