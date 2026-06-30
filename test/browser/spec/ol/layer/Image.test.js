import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import ImageLayer from '../../../../../src/ol/layer/Image.js';
import Projection from '../../../../../src/ol/proj/Projection.js';
import Static from '../../../../../src/ol/source/ImageStatic.js';

describe('ol/layer/Image', () => {
  describe('getData()', () => {
    let map, target, layer;

    beforeEach(
      () =>
        new Promise((resolve) => {
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
            resolve();
          });
        }),
    );

    afterEach(() => {
      disposeMap(map);
    });

    it('should not detect pixels outside of the layer extent', () => {
      map.renderSync();
      const pixel = [10, 10];
      const data = layer.getData(pixel);
      assert.strictEqual(data, null);
    });

    it('should detect pixels in the layer extent', () => {
      map.renderSync();
      const pixel = [50, 50];
      const data = layer.getData(pixel);
      assert.instanceOf(data, Uint8ClampedArray);
      assert.strictEqual(data.length, 4);
      assert.strictEqual(data[0], 255);
      assert.strictEqual(data[1], 255);
      assert.strictEqual(data[2], 255);
      assert.strictEqual(data[3], 255);
    });
  });
});
