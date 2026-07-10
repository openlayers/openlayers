import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import Link from '../../../../../src/ol/interaction/Link.js';
import Layer from '../../../../../src/ol/layer/Tile.js';

describe('ol/interaction/Link', () => {
  let map;
  let originalHref;

  beforeEach(function () {
    originalHref = window.location.href;
    map = new Map({
      target: createMapDiv(100, 100),
      view: new View({
        center: [0, 0],
        resolutions: [4, 2, 1],
        zoom: 1,
      }),
      layers: [
        new Layer({visible: true}),
        new Layer({visible: false}),
        new Layer({visible: true}),
      ],
    });
    map.renderSync();
  });

  afterEach(function () {
    disposeMap(map);
    window.history.replaceState(null, '', originalHref);
  });

  describe('constructor', () => {
    it('addds view state to the url', () =>
      new Promise((resolve) => {
        map.addInteraction(new Link());

        map.once('moveend', () => {
          const url = new URL(window.location.href);
          const params = url.searchParams;
          assert.strictEqual(params.get('z'), '2');
          assert.strictEqual(params.get('x'), '3');
          assert.strictEqual(params.get('y'), '4');
          assert.strictEqual(params.get('r'), '0.5');
          assert.strictEqual(params.get('l'), '101');
          resolve();
        });

        const view = map.getView();
        view.setZoom(2);
        view.setCenter([3, 4]);
        view.setRotation(0.5);
      }));

    it('works with a view that is not fully defined', () => {
      map.setView(new View({}));
      assert.doesNotThrow(() => {
        map.addInteraction(new Link());
      });
    });

    it('accepts a prefix', () =>
      new Promise((resolve) => {
        map.addInteraction(new Link({prefix: 'ol:'}));

        map.once('moveend', () => {
          const url = new URL(window.location.href);
          const params = url.searchParams;
          assert.strictEqual(params.get('ol:z'), '2');
          assert.strictEqual(params.get('ol:x'), '3');
          assert.strictEqual(params.get('ol:y'), '4');
          assert.strictEqual(params.get('ol:r'), '0.5');
          assert.strictEqual(params.get('ol:l'), '101');
          resolve();
        });

        const view = map.getView();
        view.setZoom(2);
        view.setCenter([3, 4]);
        view.setRotation(0.5);
      }));

    it('accepts an array of properties to track', () =>
      new Promise((resolve) => {
        map.addInteraction(new Link({params: ['z', 'r']}));

        map.once('moveend', () => {
          const url = new URL(window.location.href);
          const params = url.searchParams;
          assert.strictEqual(params.get('z'), '2');
          assert.strictEqual(params.get('x'), null);
          assert.strictEqual(params.get('y'), null);
          assert.strictEqual(params.get('r'), '0.5');
          assert.strictEqual(params.get('l'), null);
          resolve();
        });

        const view = map.getView();
        view.setZoom(2);
        view.setCenter([3, 4]);
        view.setRotation(0.5);
      }));
  });

  describe('track()', () => {
    it('returns the initial value and writes updates to the URL', () => {
      const link = new Link();
      map.addInteraction(link);

      const testProperty = 'test-property';
      const testValue = 'test-value';

      const initialValue = link.track(testProperty, () => {});
      assert.strictEqual(initialValue, null);

      link.update(testProperty, testValue);
      const params = new URL(window.location.href).searchParams;
      assert.strictEqual(params.get(testProperty), testValue);
    });
  });
});
