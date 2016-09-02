goog.provide('ol.test.rendering.layer.Vector');

goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Circle');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Polygon');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


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

  function addLineString(r) {
    source.addFeature(new ol.Feature(new ol.geom.LineString([
      [center[0] - r, center[1] - r],
      [center[0] + r, center[1] - r],
      [center[0] + r, center[1] + r],
      [center[0] - r, center[1] + r],
      [center[0] - r, center[1] - r]
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

    it('renders rotation correctly with the canvas renderer', function(done) {
      map = createMap('canvas');
      map.getView().setRotation(Math.PI + Math.PI / 4);
      addPolygon(300);
      addCircle(500);
      map.addLayer(new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            width: 2,
            color: 'black'
          })
        })
      }));
      map.once('postrender', function() {
        expectResemble(map, 'spec/ol/layer/expected/vector-canvas-rotated.png',
            1.7, done);
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
      });
    });

    it('renders stroke batches correctly with the canvas renderer', function(done) {
      map = createMap('canvas');
      source = new ol.source.Vector({
        overlaps: false
      });
      addLineString(100);
      addLineString(250);
      addLineString(600);
      addLineString(720);
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
        expectResemble(map, 'spec/ol/layer/expected/vector-canvas-stroke.png',
            7, done);
      });
    });

    it('interrupts fill/stroke batches correctly with the canvas renderer', function(done) {
      map = createMap('canvas');
      var color;
      function createSource(overlaps) {
        color = '#3399CC';
        source = new ol.source.Vector({
          overlaps: overlaps
        });
        addPolygon(720);
        addPolygon(600);
        addCircle(500);
        addPolygon(250);
        addCircle(200);
        addPolygon(100);
        return source;
      }
      function alternateColor() {
        if (color == '#3399CC') {
          color = '#CC9933';
        } else {
          color = '#3399CC';
        }
        return color;
      }
      var layer = new ol.layer.Vector({
        source: createSource(true),
        style: function(feature) {
          alternateColor();
          return new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: alternateColor(),
              width: 1.25
            }),
            fill: new ol.style.Fill({
              color: alternateColor()
            })
          });
        }
      });
      map.addLayer(layer);
      map.once('postrender', function() {
        var canvas = map.getRenderer().canvas_;
        // take a snapshot of this `overlaps: true` image
        var referenceImage = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        // now render the same with `overlaps: false`
        layer.setSource(createSource(false));
        // result should be exactly the same as with `overlaps: true`
        map.once('postrender', function() {
          expectResemble(map, referenceImage, 0, done);
        });
      });
    });

    it('interrupts stroke batches correctly with the canvas renderer', function(done) {
      map = createMap('canvas');
      var color;
      function createSource(overlaps) {
        color = '#3399CC';
        source = new ol.source.Vector({
          overlaps: overlaps
        });
        addLineString(720);
        addLineString(600);
        addLineString(250);
        addLineString(100);
        return source;
      }
      function alternateColor() {
        if (color == '#3399CC') {
          color = '#CC9933';
        } else {
          color = '#3399CC';
        }
        return color;
      }
      var layer = new ol.layer.Vector({
        source: createSource(true),
        style: function(feature) {
          alternateColor();
          return new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: alternateColor(),
              width: 1.25
            }),
            fill: new ol.style.Fill({
              color: alternateColor()
            })
          });
        }
      });
      map.addLayer(layer);
      map.once('postrender', function() {
        var canvas = map.getRenderer().canvas_;
        // take a snapshot of this `overlaps: true` image
        var referenceImage = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        // now render the same with `overlaps: false`
        layer.setSource(createSource(false));
        // result should be exactly the same as with `overlaps: true`
        map.once('postrender', function() {
          expectResemble(map, referenceImage, 0, done);
        });
      });
    });
  });

});
