goog.provide('ol.test.rendering.Map');

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');


describe('ol.rendering.Map', function() {

  var target, map;

  function createMap(renderer) {
    target = createMapDiv(50, 50);

    var vectorLayer = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [new ol.Feature({
          geometry: new ol.geom.Point([0, 0])
        })]
      })
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

  describe('#updateSize()', function() {
    var map, target;

    function createMap(renderer) {
      target = document.createElement('div');
      document.body.appendChild(target);
      map = new ol.Map({
        renderer: renderer,
        controls: [],
        target: target,
        view: new ol.View({
          center: [0, 0],
          zoom: 2
        })
      });
      return map;
    }

    afterEach(function() {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      map.once('postrender', function() {
        var initialSize = map.getSize();
        map.updateSize();
        expect(map.getSize()).to.eql(initialSize);
        done();
      });
    });

    it('tests the WebGL renderer', function(done) {
      assertWebGL();
      map = createMap('webgl');
      map.once('postrender', function() {
        var initialSize = map.getSize();
        map.updateSize();
        expect(map.getSize()).to.eql(initialSize);
        done();
      });
    });
  });

  describe('#render()', function() {
    afterEach(function() {
      disposeMap(map);
    });

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      expectResemble(
          map, 'spec/ol/expected/render-canvas.png', IMAGE_TOLERANCE, done);
    });

    it('tests the WebGL renderer', function(done) {
      assertWebGL();
      map = createMap('webgl');
      expectResemble(
          map, 'spec/ol/expected/render-webgl.png', IMAGE_TOLERANCE, done);
    });
  });

  describe('#pan()', function() {
    afterEach(function() {
      disposeMap(map);
    });

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      map.getView().setCenter([10, 10]);
      expectResemble(
          map, 'spec/ol/expected/pan-canvas.png', IMAGE_TOLERANCE, done);
    });

    it('tests the WebGL renderer', function(done) {
      assertWebGL();
      map = createMap('webgl');
      map.getView().setCenter([10, 10]);
      expectResemble(
          map, 'spec/ol/expected/pan-webgl.png', IMAGE_TOLERANCE, done);
    });
  });

  describe('#rotate()', function() {
    afterEach(function() {
      disposeMap(map);
    });

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      map.getView().setRotation(90);
      map.getView().setCenter([10, 10]);
      expectResemble(
          map, 'spec/ol/expected/rotate-canvas.png', 2.8, done);
    });

    it('tests the WebGL renderer', function(done) {
      assertWebGL();
      map = createMap('webgl');
      map.getView().setRotation(90);
      map.getView().setCenter([10, 10]);
      expectResemble(
          map, 'spec/ol/expected/rotate-webgl.png', IMAGE_TOLERANCE, done);
    });
  });

  describe('#zoom()', function() {
    afterEach(function() {
      disposeMap(map);
    });

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      map.getView().setCenter([10, 10]);
      map.getView().setResolution(2);
      expectResemble(
          map, 'spec/ol/expected/zoom-canvas.png', IMAGE_TOLERANCE, done);
    });

    it('tests the WebGL renderer', function(done) {
      assertWebGL();
      map = createMap('webgl');
      map.getView().setCenter([10, 10]);
      map.getView().setResolution(2);
      expectResemble(
          map, 'spec/ol/expected/zoom-webgl.png', IMAGE_TOLERANCE, done);
    });
  });
});
