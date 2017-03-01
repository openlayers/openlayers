goog.provide('ol.test.style.IconImageCache');

goog.require('ol');
goog.require('ol.events');
goog.require('ol.style');
goog.require('ol.style.IconImage');

describe('ol.style.IconImageCache', function() {
  var originalMaxCacheSize;

  beforeEach(function() {
    var cache = ol.style.iconImageCache;
    cache.clear();
    originalMaxCacheSize = cache.maxCacheSize;
    cache.maxCacheSize_ = 4;
  });

  afterEach(function() {
    var cache = ol.style.iconImageCache;
    cache.maxCacheSize_ = originalMaxCacheSize;
    cache.clear();
  });

  describe('#expire', function() {
    it('expires images when expected', function() {
      var cache = ol.style.iconImageCache;

      var i, src, iconImage;

      for (i = 0; i < 4; ++i) {
        src = i + '';
        iconImage = new ol.style.IconImage(src, null);
        cache.set(src, null, null, iconImage);
      }

      expect(cache.cacheSize_).to.eql(4);

      cache.expire();
      expect(cache.cacheSize_).to.eql(4);

      src = '4';
      iconImage = new ol.style.IconImage(src, null);
      cache.set(src, null, null, iconImage);
      expect(cache.cacheSize_).to.eql(5);

      cache.expire(); // remove '0' and '4'
      expect(cache.cacheSize_).to.eql(3);

      src = '0';
      iconImage = new ol.style.IconImage(src, null);
      ol.events.listen(iconImage, 'change',
          ol.nullFunction, false);
      cache.set(src, null, null, iconImage);
      expect(cache.cacheSize_).to.eql(4);

      src = '4';
      iconImage = new ol.style.IconImage(src, null);
      ol.events.listen(iconImage, 'change',
          ol.nullFunction, false);
      cache.set(src, null, null, iconImage);
      expect(cache.cacheSize_).to.eql(5);

      // check that '0' and '4' are not removed from the cache
      cache.expire();
      expect(cache.get('0', null, null)).to.not.be(null);
      expect(cache.get('4', null, null)).to.not.be(null);
    });
  });
});
