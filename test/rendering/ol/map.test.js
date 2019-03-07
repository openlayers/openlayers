import Feature from '../../../src/ol/Feature.js';
import Point from '../../../src/ol/geom/Point.js';
import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';


describe('ol.rendering.Map', function() {

  let map;
  function createMap(renderer) {
    const MapConstructor = Map;
    const LayerConstructor = VectorLayer;

    const vectorLayer = new LayerConstructor({
      source: new VectorSource({
        features: [new Feature({
          geometry: new Point([0, 0])
        })]
      })
    });

    map = new MapConstructor({
      pixelRatio: 1,
      target: createMapDiv(50, 50),
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
    }
    map = null;
  });

  describe('#updateSize()', function() {

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      map.once('postrender', function() {
        const initialSize = map.getSize();
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
  });

  describe('#pan()', function() {

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      map.getView().setCenter([10, 10]);
      expectResemble(
        map, 'rendering/ol/expected/pan-canvas.png', IMAGE_TOLERANCE, done);
    });
  });
});
