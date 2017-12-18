import {nullFunction} from '../../../../src/ol/index.js';
import _ol_events_ from '../../../../src/ol/events.js';
import {iconImageCache} from '../../../../src/ol/style.js';
import _ol_style_IconImage_ from '../../../../src/ol/style/IconImage.js';

describe('ol.style.IconImageCache', function() {
  var originalMaxCacheSize;

  beforeEach(function() {
    iconImageCache.clear();
    originalMaxCacheSize = iconImageCache.maxCacheSize;
    iconImageCache.maxCacheSize_ = 4;
  });

  afterEach(function() {
    iconImageCache.maxCacheSize_ = originalMaxCacheSize;
    iconImageCache.clear();
  });

  describe('#expire', function() {
    it('expires images when expected', function() {
      var i, src, iconImage;

      for (i = 0; i < 4; ++i) {
        src = i + '';
        iconImage = new _ol_style_IconImage_(null, src);
        iconImageCache.set(src, null, null, iconImage);
      }

      expect(iconImageCache.cacheSize_).to.eql(4);

      iconImageCache.expire();
      expect(iconImageCache.cacheSize_).to.eql(4);

      src = '4';
      iconImage = new _ol_style_IconImage_(null, src);
      iconImageCache.set(src, null, null, iconImage);
      expect(iconImageCache.cacheSize_).to.eql(5);

      iconImageCache.expire(); // remove '0' and '4'
      expect(iconImageCache.cacheSize_).to.eql(3);

      src = '0';
      iconImage = new _ol_style_IconImage_(null, src);
      _ol_events_.listen(iconImage, 'change', nullFunction, false);
      iconImageCache.set(src, null, null, iconImage);
      expect(iconImageCache.cacheSize_).to.eql(4);

      src = '4';
      iconImage = new _ol_style_IconImage_(null, src);
      _ol_events_.listen(iconImage, 'change', nullFunction, false);
      iconImageCache.set(src, null, null, iconImage);
      expect(iconImageCache.cacheSize_).to.eql(5);

      // check that '0' and '4' are not removed from the cache
      iconImageCache.expire();
      expect(iconImageCache.get('0', null, null)).to.not.be(null);
      expect(iconImageCache.get('4', null, null)).to.not.be(null);
    });
  });

  describe('#setSize', function() {
    it('sets max cache size and expires cache', function() {
      var i, src, iconImage;

      for (i = 0; i < 3; ++i) {
        src = i + '';
        iconImage = new _ol_style_IconImage_(null, src);
        iconImageCache.set(src, null, null, iconImage);
      }

      expect(iconImageCache.cacheSize_).to.eql(3);

      iconImageCache.setSize(2);

      expect(iconImageCache.maxCacheSize_).to.eql(2);
      expect(iconImageCache.cacheSize_).to.eql(2);
    });
  });
});
