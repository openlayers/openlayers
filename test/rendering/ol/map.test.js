

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');


describe('ol.rendering.Map', function() {

  var map;
  function createMap(renderer) {
    var vectorLayer = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [new ol.Feature({
          geometry: new ol.geom.Point([0, 0])
        })]
      })
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
    }
    map = null;
  });

  describe('#updateSize()', function() {

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      map.once('postrender', function() {
        var initialSize = map.getSize();
        map.updateSize();
        expect(map.getSize()).to.eql(initialSize);
        done();
      });
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      map.once('postrender', function() {
        var initialSize = map.getSize();
        map.updateSize();
        expect(map.getSize()).to.eql(initialSize);
        done();
      });
    });
  });

  describe('#render()', function() {

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      expectResemble(
          map, 'rendering/ol/expected/render-canvas.png', IMAGE_TOLERANCE, done);
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      expectResemble(
          map, 'rendering/ol/expected/render-webgl.png', IMAGE_TOLERANCE, done);
    });
  });

  describe('#pan()', function() {

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      map.getView().setCenter([10, 10]);
      expectResemble(
          map, 'rendering/ol/expected/pan-canvas.png', IMAGE_TOLERANCE, done);
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      map.getView().setCenter([10, 10]);
      expectResemble(
          map, 'rendering/ol/expected/pan-webgl.png', IMAGE_TOLERANCE, done);
    });
  });

  describe('#rotate()', function() {

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      map.getView().setRotation(90);
      map.getView().setCenter([10, 10]);
      expectResemble(
          map, 'rendering/ol/expected/rotate-canvas.png', 2.8, done);
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      map.getView().setRotation(90);
      map.getView().setCenter([10, 10]);
      expectResemble(
          map, 'rendering/ol/expected/rotate-webgl.png', IMAGE_TOLERANCE, done);
    });
  });

  describe('#zoom()', function() {

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      map.getView().setCenter([10, 10]);
      map.getView().setResolution(2);
      expectResemble(
          map, 'rendering/ol/expected/zoom-canvas.png', IMAGE_TOLERANCE, done);
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      map.getView().setCenter([10, 10]);
      map.getView().setResolution(2);
      expectResemble(
          map, 'rendering/ol/expected/zoom-webgl.png', IMAGE_TOLERANCE, done);
    });
  });
});
