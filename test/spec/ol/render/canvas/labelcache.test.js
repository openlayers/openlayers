import LabelCache from '../../../../../src/ol/render/canvas/LabelCache.js';

describe('ol.render.canvas.LabelCache', () => {

  test('#prune()', () => {
    const labelCache = new LabelCache(1);
    labelCache.set('key1', document.createElement('canvas'));
    labelCache.set('key2', document.createElement('canvas'));
    labelCache.prune();
    expect(labelCache.getCount()).toBe(1);
  });

  test(
    '#prune() leaves used labels untouched until consumer is released',
    () => {
      const labelCache = new LabelCache(1);
      labelCache.set('key1', document.createElement('canvas'));
      labelCache.set('key2', document.createElement('canvas'));
      const consumer = {};
      labelCache.get('key1', consumer);
      labelCache.get('key2', consumer);
      labelCache.prune();
      expect(labelCache.getCount()).toBe(2);
      labelCache.release(consumer);
      labelCache.prune();
      expect(labelCache.getCount()).toBe(1);
    }
  );

});
