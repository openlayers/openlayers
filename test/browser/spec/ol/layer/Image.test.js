import ImageLayer from '../../../../../src/ol/layer/Image.js';
import Map from '../../../../../src/ol/Map.js';
import Static from '../../../../../src/ol/source/ImageStatic.js';
import View from '../../../../../src/ol/View.js';
import {Projection} from '../../../../../src/ol/proj.js';

describe('ol/layer/Image', () => {
  describe('getData()', () => {
    let map, target, layer;

    beforeEach((done) => {
      const projection = new Projection({
        code: 'custom-image',
        units: 'pixels',
        extent: [0, 0, 200, 200],
      });

      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);

      const imageExtent = [0, 0, 20, 20];
      const source = new Static({
        url: 'spec/ol/data/dot.png',
        projection: projection,
        imageExtent: imageExtent,
      });

      layer = new ImageLayer({
        source: source,
        extent: imageExtent,
      });

      map = new Map({
        pixelRatio: 1,
        target: target,
        layers: [layer],
        view: new View({
          projection: projection,
          center: [10, 10],
          zoom: 1,
          maxZoom: 8,
        }),
      });
      map.once('rendercomplete', () => {
        done();
      });
    });

    afterEach(() => {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('should not detect pixels outside of the layer extent', () => {
      map.renderSync();
      const pixel = [10, 10];
      const data = layer.getData(pixel);
      expect(data).to.be(null);
    });

    it('should detect pixels in the layer extent', () => {
      map.renderSync();
      const pixel = [50, 50];
      const data = layer.getData(pixel);
      expect(data).to.be.a(Uint8ClampedArray);
      expect(data.length).to.be(4);
      expect(data[0]).to.be(255);
      expect(data[1]).to.be(255);
      expect(data[2]).to.be(255);
      expect(data[3]).to.be(255);
    });
  });
});
