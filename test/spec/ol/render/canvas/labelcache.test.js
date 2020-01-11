import LabelCache from '../../../../../src/ol/render/canvas/LabelCache.js';

describe('ol.render.canvas.LabelCache', function() {

  it('#expireCache()', function() {
    const labelCache = new LabelCache(1);
    labelCache.set('key1', document.createElement('canvas'));
    labelCache.set('key2', document.createElement('canvas'));
    labelCache.expireCache();
    expect(labelCache.getCount()).to.be(1);
  });

});
