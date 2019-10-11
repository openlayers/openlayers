import HeatmapLayer from '../../../../src/ol/layer/Heatmap.js';
import Feature from '../../../../src/ol/Feature.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';

describe('ol.layer.Heatmap', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      const instance = new HeatmapLayer();
      expect(instance).to.be.an(HeatmapLayer);
    });

  });


  describe('hit detection', function() {

    it('hit detects two distinct features', function(done) {
      const target = document.createElement('div');
      target.style.width = '300px';
      target.style.height = '300px';
      document.body.appendChild(target);

      const feature = new Feature({geometry: new Point([0, 0]), id: 1, weight: 10});
      const feature2 = new Feature({geometry: new Point([14, 14]), id: 2, weight: 10});

      const source = new VectorSource({
        features: [feature, feature2]
      });
      const layer = new HeatmapLayer({
        source: source,
        blur: 10,
        radius: 10
      });
      const map = new Map({
        layers: [layer],
        view: new View({
          center: [0, 0],
          resolution: 0.1
        }),
        target: target
      });
      map.render();

      function hitTest(coordinate) {
        const features = map.getFeaturesAtPixel(
          map.getPixelFromCoordinate(coordinate)
        );
        return features.length ? features[0] : null;
      }

      const renderer = layer.getRenderer();
      renderer.worker_.addEventListener('message', function(event) {
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

        document.body.removeChild(target);
        done();
      });
    });

  });

});
