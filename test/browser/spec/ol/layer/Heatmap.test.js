import Feature from '../../../../../src/ol/Feature.js';
import HeatmapLayer from '../../../../../src/ol/layer/Heatmap.js';
import Map from '../../../../../src/ol/Map.js';
import Point from '../../../../../src/ol/geom/Point.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import View from '../../../../../src/ol/View.js';

describe('ol/layer/Heatmap', function () {
  /** @type {HTMLDivElement} */
  let target;
  /** @type {Map} */
  let map;
  /** @type {HeatmapLayer} */
  let layer;
  beforeEach(() => {
    target = document.createElement('div');
    target.style.width = '300px';
    target.style.height = '300px';
    document.body.appendChild(target);

    map = new Map({
      view: new View({
        center: [0, 0],
        resolution: 0.1,
      }),
      target: target,
    });
  });

  afterEach(() => {
    map.dispose();
    document.body.removeChild(target);
    layer.dispose();
  });

  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      layer = new HeatmapLayer();
      expect(layer).to.be.an(HeatmapLayer);
    });

    it('has a default className', function () {
      layer = new HeatmapLayer({
        source: new VectorSource(),
      });
      map.addLayer(layer);
      map.renderSync();

      const canvas = layer.getRenderer().helper.getCanvas();
      expect(canvas.className).to.eql('ol-layer');
    });

    it('accepts a custom className', function () {
      layer = new HeatmapLayer({
        source: new VectorSource(),
        className: 'a-class-name',
      });
      map.addLayer(layer);
      map.renderSync();

      const canvas = layer.getRenderer().helper.getCanvas();
      expect(canvas.className).to.eql('a-class-name');
    });
  });

  describe('hit detection', function () {
    it('hit detects two distinct features', function (done) {
      const feature = new Feature({
        geometry: new Point([0, 0]),
        id: 1,
        weight: 10,
      });
      const feature2 = new Feature({
        geometry: new Point([14, 14]),
        id: 2,
        weight: 10,
      });

      const source = new VectorSource({
        features: [feature, feature2],
      });
      layer = new HeatmapLayer({
        source: source,
        blur: 10,
        radius: 10,
      });
      map.addLayer(layer);
      map.render();

      function hitTest(coordinate) {
        const features = map.getFeaturesAtPixel(
          map.getPixelFromCoordinate(coordinate)
        );
        return features.length ? features[0] : null;
      }

      const renderer = layer.getRenderer();
      renderer.worker_.addEventListener('message', function (event) {
        if (!renderer.hitRenderInstructions_) {
          return;
        }
        map.renderSync();

        let res;

        res = hitTest([0, 0]);
        expect(res).to.be(feature);
        res = hitTest([20, 0]);
        expect(res).to.be(null);
        res = hitTest([14, 14]);
        expect(res).to.be(feature2);
        res = hitTest([0, 14]);
        expect(res).to.be(null);

        done();
      });
    });
  });
});
