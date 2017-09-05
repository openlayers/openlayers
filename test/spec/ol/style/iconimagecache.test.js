

import _ol_ from '../../../../src/ol';
import _ol_events_ from '../../../../src/ol/events';
import _ol_style_ from '../../../../src/ol/style';
import _ol_style_IconImage_ from '../../../../src/ol/style/iconimage';

describe('ol.style.IconImageCache', function() {
  var originalMaxCacheSize;

  beforeEach(function() {
    var cache = _ol_style_.iconImageCache;
    cache.clear();
    originalMaxCacheSize = cache.maxCacheSize;
    cache.maxCacheSize_ = 4;
  });

  afterEach(function() {
    var cache = _ol_style_.iconImageCache;
    cache.maxCacheSize_ = originalMaxCacheSize;
    cache.clear();
  });

  describe('#expire', function() {
    it('expires images when expected', function() {
      var cache = _ol_style_.iconImageCache;

      var i, src, iconImage;

      for (i = 0; i < 4; ++i) {
        src = i + '';
        iconImage = new _ol_style_IconImage_(null, src);
        cache.set(src, null, null, iconImage);
      }

      expect(cache.cacheSize_).to.eql(4);

      cache.expire();
      expect(cache.cacheSize_).to.eql(4);

      src = '4';
      iconImage = new _ol_style_IconImage_(null, src);
      cache.set(src, null, null, iconImage);
      expect(cache.cacheSize_).to.eql(5);

      cache.expire(); // remove '0' and '4'
      expect(cache.cacheSize_).to.eql(3);

      src = '0';
      iconImage = new _ol_style_IconImage_(null, src);
      _ol_events_.listen(iconImage, 'change',
          _ol_.nullFunction, false);
      cache.set(src, null, null, iconImage);
      expect(cache.cacheSize_).to.eql(4);

      src = '4';
      iconImage = new _ol_style_IconImage_(null, src);
      _ol_events_.listen(iconImage, 'change',
          _ol_.nullFunction, false);
      cache.set(src, null, null, iconImage);
      expect(cache.cacheSize_).to.eql(5);

      // check that '0' and '4' are not removed from the cache
      cache.expire();
      expect(cache.get('0', null, null)).to.not.be(null);
      expect(cache.get('4', null, null)).to.not.be(null);
    });
  });
});
