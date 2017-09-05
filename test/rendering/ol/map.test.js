

import _ol_Feature_ from '../../../src/ol/feature';
import _ol_geom_Point_ from '../../../src/ol/geom/point';
import _ol_Map_ from '../../../src/ol/map';
import _ol_View_ from '../../../src/ol/view';
import _ol_layer_Vector_ from '../../../src/ol/layer/vector';
import _ol_source_Vector_ from '../../../src/ol/source/vector';


describe('ol.rendering.Map', function() {

  var map;
  function createMap(renderer) {
    var vectorLayer = new _ol_layer_Vector_({
      source: new _ol_source_Vector_({
        features: [new _ol_Feature_({
          geometry: new _ol_geom_Point_([0, 0])
        })]
      })
    });

    map = new _ol_Map_({
      pixelRatio: 1,
      target: createMapDiv(50, 50),
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
