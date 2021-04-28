import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import Point from '../../../../../src/ol/geom/Point.js';
import VectorImageLayer from '../../../../../src/ol/layer/VectorImage.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import View from '../../../../../src/ol/View.js';

describe('ol/layer/VectorImage', function () {
  describe('#getFeatures()', function () {
    let map, layer;

    beforeEach(function () {
      layer = new VectorImageLayer({
        source: new VectorSource({
          features: [
            new Feature({
              geometry: new Point([-1000000, 0]),
              name: 'feature1',
            }),
            new Feature({
              geometry: new Point([1000000, 0]),
              name: 'feture2',
            }),
          ],
        }),
      });
      const container = document.createElement('div');
      container.style.width = '256px';
      container.style.height = '256px';
      document.body.appendChild(container);
      map = new Map({
        target: container,
        layers: [layer],
        view: new View({
          zoom: 2,
          center: [0, 0],
        }),
      });
    });

    afterEach(function () {
      document.body.removeChild(map.getTargetElement());
      map.setTarget(null);
    });

    it('detects features properly', function (done) {
      map.renderSync();
      const pixel = map.getPixelFromCoordinate([-1000000, 0]);
      layer.getFeatures(pixel).then(function (features) {
        expect(features[0].get('name')).to.be('feature1');
        done();
      });
    });
  });
});
