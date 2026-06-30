import {assert} from 'chai';
import ImageWrapper from '../../../../../src/ol/Image.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import Layer from '../../../../../src/ol/layer/Layer.js';
import TileLayer from '../../../../../src/ol/layer/Tile.js';
import LayerRenderer from '../../../../../src/ol/renderer/Layer.js';
import XYZ from '../../../../../src/ol/source/XYZ.js';

describe('ol/renderer/Layer', () => {
  let layer, renderer;
  const eventType = 'change';

  beforeEach(() => {
    layer = new Layer({});
    renderer = new LayerRenderer(layer);
  });

  describe('#renderIfReadyAndVisible', () => {
    it('updates revision when data is ready and layer is visible', () => {
      layer.setVisible(true);
      let state;
      layer.getSourceState = function () {
        return state;
      };
      const revision = layer.getRevision();
      state = 'foo';
      renderer.renderIfReadyAndVisible();
      assert.strictEqual(layer.getRevision(), revision);
      state = 'ready';
      renderer.renderIfReadyAndVisible();
      assert.strictEqual(layer.getRevision(), revision + 1);
    });
  });

  describe('#loadImage', () => {
    let image;
    let imageLoadFunction;

    beforeEach(() => {
      const extent = [];
      const resolution = 1;
      const pixelRatio = 1;

      const spy = vi.fn();
      imageLoadFunction = (...args) => {
        spy(...args);
        return new Promise(() => {});
      };
      image = new ImageWrapper(
        extent,
        resolution,
        pixelRatio,
        imageLoadFunction,
      );
    });

    describe('load IDLE image', () => {
      it('returns false', () => {
        const loaded = renderer.loadImage(image);
        assert.strictEqual(loaded, false);
      });

      it('registers a listener', () => {
        renderer.loadImage(image);
        const listeners = image.listeners_[eventType];
        assert.lengthOf(listeners, 1);
      });
    });

    describe('load LOADED image', () => {
      it('returns true', () => {
        image.state = 2; // LOADED
        const loaded = renderer.loadImage(image);
        assert.strictEqual(loaded, true);
      });

      it('does not register a listener', () => {
        image.state = 2; // LOADED
        const loaded = renderer.loadImage(image);
        assert.strictEqual(loaded, true);
      });
    });

    describe('load LOADING image', () => {
      beforeEach(() => {
        renderer.loadImage(image);
        assert.strictEqual(image.getState(), 1);
      });

      it('returns false', () => {
        const loaded = renderer.loadImage(image);
        assert.strictEqual(loaded, false);
      });

      it('does not register a new listener', () => {
        renderer.loadImage(image);
        const listeners = image.listeners_[eventType];
        assert.lengthOf(listeners, 1);
      });
    });
  });

  describe('manageTilePyramid behavior', () => {
    let target, map, view, layer, source, spy;

    beforeEach(
      () =>
        new Promise((resolve) => {
          target = document.createElement('div');
          Object.assign(target.style, {
            position: 'absolute',
            left: '-1000px',
            top: '-1000px',
            width: '360px',
            height: '180px',
          });
          document.body.appendChild(target);

          view = new View({
            center: [0, 0],
            multiWorld: true,
            zoom: 0,
          });

          source = new XYZ({
            url: '#{x}/{y}/{z}',
          });
          spy = vi.spyOn(source, 'getTile');
          layer = new TileLayer({
            source: source,
          });

          map = new Map({
            target: target,
            view: view,
            layers: [layer],
          });
          map.once('postrender', () => {
            resolve();
          });
        }),
    );

    afterEach(() => {
      spy.mockRestore();
      disposeMap(map);
    });

    it('accesses tiles from current zoom level last', () =>
      new Promise((resolve) => {
        // expect most recent tile in the cache to be from zoom level 0
        const z = spy.mock.calls[spy.mock.calls.length - 1][0];
        assert.strictEqual(z, 0);

        map.once('moveend', () => {
          // expect most recent tile in the cache to be from zoom level 4
          const z = spy.mock.calls[spy.mock.calls.length - 1][0];
          assert.strictEqual(z, 4);
          resolve();
        });
        view.setZoom(4);
      }));
  });
});
