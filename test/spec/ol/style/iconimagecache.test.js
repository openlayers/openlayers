import {VOID} from '../../../../src/ol/functions.js';
import {listen} from '../../../../src/ol/events.js';
import {shared as iconImageCache} from '../../../../src/ol/style/IconImageCache.js';
import IconImage from '../../../../src/ol/style/IconImage.js';

describe('ol.style.IconImageCache', () => {
  let originalMaxCacheSize;

  beforeEach(() => {
    iconImageCache.clear();
    originalMaxCacheSize = iconImageCache.maxCacheSize;
    iconImageCache.maxCacheSize_ = 4;
  });

  afterEach(() => {
    iconImageCache.maxCacheSize_ = originalMaxCacheSize;
    iconImageCache.clear();
  });

  describe('#expire', () => {
    test('expires images when expected', () => {
      let i, src, iconImage;

      for (i = 0; i < 4; ++i) {
        src = i + '';
        iconImage = new IconImage(null, src);
        iconImageCache.set(src, null, null, iconImage);
      }

      expect(iconImageCache.cacheSize_).toEqual(4);

      iconImageCache.expire();
      expect(iconImageCache.cacheSize_).toEqual(4);

      src = '4';
      iconImage = new IconImage(null, src);
      iconImageCache.set(src, null, null, iconImage);
      expect(iconImageCache.cacheSize_).toEqual(5);

      iconImageCache.expire(); // remove '0' and '4'
      expect(iconImageCache.cacheSize_).toEqual(3);

      src = '0';
      iconImage = new IconImage(null, src);
      listen(iconImage, 'change', VOID, false);
      iconImageCache.set(src, null, null, iconImage);
      expect(iconImageCache.cacheSize_).toEqual(4);

      src = '4';
      iconImage = new IconImage(null, src);
      listen(iconImage, 'change', VOID, false);
      iconImageCache.set(src, null, null, iconImage);
      expect(iconImageCache.cacheSize_).toEqual(5);

      // check that '0' and '4' are not removed from the cache
      iconImageCache.expire();
      expect(iconImageCache.get('0', null, null)).not.toBe(null);
      expect(iconImageCache.get('4', null, null)).not.toBe(null);
    });
  });

  describe('#setSize', () => {
    test('sets max cache size and expires cache', () => {
      let i, src, iconImage;

      for (i = 0; i < 3; ++i) {
        src = i + '';
        iconImage = new IconImage(null, src);
        iconImageCache.set(src, null, null, iconImage);
      }

      expect(iconImageCache.cacheSize_).toEqual(3);

      iconImageCache.setSize(2);

      expect(iconImageCache.maxCacheSize_).toEqual(2);
      expect(iconImageCache.cacheSize_).toEqual(2);
    });
  });
});
