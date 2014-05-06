goog.provide('ol.test.style.IconImageCache');

describe('ol.style.IconImageCache', function() {
  var originalMaxCacheSize;

  beforeEach(function() {
    var cache = ol.style.IconImageCache.getInstance();
    cache.clear();
    originalMaxCacheSize = cache.maxCacheSize;
    cache.maxCacheSize_ = 4;
  });

  afterEach(function() {
    var cache = ol.style.IconImageCache.getInstance();
    cache.maxCacheSize_ = originalMaxCacheSize;
    cache.clear();
  });

  describe('#expire', function() {
    it('expires images when expected', function() {
      var cache = ol.style.IconImageCache.getInstance();

      var i, src, iconImage, key;

      for (i = 0; i < 4; ++i) {
        src = i + '';
        iconImage = new ol.style.IconImage_(src, null);
        cache.set(src, null, iconImage);
      }

      expect(cache.cacheSize_).to.eql(4);

      cache.expire();
      expect(cache.cacheSize_).to.eql(4);

      src = '4';
      iconImage = new ol.style.IconImage_(src, null);
      cache.set(src, null, iconImage);
      expect(cache.cacheSize_).to.eql(5);

      cache.expire(); // remove '0' and '4'
      expect(cache.cacheSize_).to.eql(3);

      src = '0';
      iconImage = new ol.style.IconImage_(src, null);
      goog.events.listen(iconImage, goog.events.EventType.CHANGE,
          goog.nullFunction, false);
      cache.set(src, null, iconImage);
      expect(cache.cacheSize_).to.eql(4);

      src = '4';
      iconImage = new ol.style.IconImage_(src, null);
      goog.events.listen(iconImage, goog.events.EventType.CHANGE,
          goog.nullFunction, false);
      cache.set(src, null, iconImage);
      expect(cache.cacheSize_).to.eql(5);

      // check that '0' and '4' are not removed from the cache
      cache.expire();
      key = ol.style.IconImageCache.getKey('0', null);
      expect(key in cache.cache_).to.be.ok();
      key = ol.style.IconImageCache.getKey('4', null);
      expect(key in cache.cache_).to.be.ok();

    });
  });
});

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.style.IconImageCache');
