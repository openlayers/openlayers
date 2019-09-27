import {assert} from 'chai';
import {listen} from '../../../../../src/ol/events.js';
import {VOID} from '../../../../../src/ol/functions.js';
import IconImage from '../../../../../src/ol/style/IconImage.js';
import {shared as iconImageCache} from '../../../../../src/ol/style/IconImageCache.js';

describe('ol.style.IconImageCache', function () {
  let originalMaxCacheSize;

  beforeEach(function () {
    iconImageCache.clear();
    originalMaxCacheSize = iconImageCache.maxCacheSize;
    iconImageCache.maxCacheSize_ = 4;
  });

  afterEach(function () {
    iconImageCache.maxCacheSize_ = originalMaxCacheSize;
    iconImageCache.clear();
  });

  describe('#expire', function () {
    it('expires images when expected', function () {
      let i, src, iconImage;

      for (i = 0; i < 4; ++i) {
        src = i + '';
        iconImage = new IconImage(null, src);
        iconImageCache.set(src, null, iconImage);
      }

      assert.deepEqual(iconImageCache.cacheSize_, 4);

      iconImageCache.expire();
      assert.deepEqual(iconImageCache.cacheSize_, 4);

      src = '4';
      iconImage = new IconImage(null, src);
      iconImageCache.set(src, null, iconImage);
      assert.deepEqual(iconImageCache.cacheSize_, 5);

      iconImageCache.expire(); // remove '0' and '4'
      assert.deepEqual(iconImageCache.cacheSize_, 3);

      src = '0';
      iconImage = new IconImage(null, src);
      listen(iconImage, 'change', VOID, false);
      iconImageCache.set(src, null, iconImage);
      assert.deepEqual(iconImageCache.cacheSize_, 4);

      src = '4';
      iconImage = new IconImage(null, src);
      listen(iconImage, 'change', VOID, false);
      iconImageCache.set(src, null, iconImage);
      assert.deepEqual(iconImageCache.cacheSize_, 5);

      // check that '0' and '4' are not removed from the cache
      iconImageCache.expire();
      assert.notEqual(iconImageCache.get('0', null, null, null), null);
      assert.notEqual(iconImageCache.get('4', null, null, null), null);
    });
  });

  describe('#setSize', function () {
    it('sets max cache size and expires cache', function () {
      let i, src, iconImage;

      for (i = 0; i < 3; ++i) {
        src = i + '';
        iconImage = new IconImage(null, src);
        iconImageCache.set(src, null, iconImage);
      }

      assert.deepEqual(iconImageCache.cacheSize_, 3);

      iconImageCache.setSize(2);

      assert.deepEqual(iconImageCache.maxCacheSize_, 2);
      assert.deepEqual(iconImageCache.cacheSize_, 2);
    });
  });
});
