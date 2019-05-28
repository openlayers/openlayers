import LabelCache from '../../../../../src/ol/render/canvas/LabelCache.js';

describe('ol.render.canvas.LabelCache', function() {

  it('#prune()', function() {
    const labelCache = new LabelCache(1);
    labelCache.set('key1', document.createElement('canvas'));
    labelCache.set('key2', document.createElement('canvas'));
    labelCache.prune();
    expect(labelCache.getCount()).to.be(1);
  });

  it('#prune() leaves used labels untouched until consumer is released', function() {
    const labelCache = new LabelCache(1);
    labelCache.set('key1', document.createElement('canvas'));
    labelCache.set('key2', document.createElement('canvas'));
    const consumer = {};
    labelCache.get('key1', consumer);
    labelCache.get('key2', consumer);
    labelCache.prune();
    expect(labelCache.getCount()).to.be(2);
    labelCache.release(consumer);
    labelCache.prune();
    expect(labelCache.getCount()).to.be(1);
  });

});
