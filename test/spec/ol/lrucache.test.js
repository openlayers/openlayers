goog.provide('ol.test.LRUCache');


describe('ol.structs.LRUCache', function() {

  var lruCache;

  function fillLRUCache(lruCache) {
    lruCache.set('a', 0);
    lruCache.set('b', 1);
    lruCache.set('c', 2);
    lruCache.set('d', 3);
  }

  beforeEach(function() {
    lruCache = new ol.structs.LRUCache();
  });

  describe('empty cache', function() {
    it('has size zero', function() {
      expect(lruCache.getCount()).toEqual(0);
    });
    it('has no keys', function() {
      expect(lruCache.getKeys()).toEqual([]);
    });
    it('has no values', function() {
      expect(lruCache.getValues()).toEqual([]);
    });
  });

  describe('populating', function() {
    it('returns the correct size', function() {
      fillLRUCache(lruCache);
      expect(lruCache.getCount()).toEqual(4);
    });
    it('contains the correct keys in the correct order', function() {
      fillLRUCache(lruCache);
      expect(lruCache.getKeys()).toEqual(['d', 'c', 'b', 'a']);
    });
    it('contains the correct values in the correct order', function() {
      fillLRUCache(lruCache);
      expect(lruCache.getValues()).toEqual([3, 2, 1, 0]);
    });
    it('reports which keys are contained', function() {
      fillLRUCache(lruCache);
      expect(lruCache.containsKey('a')).toBeTruthy();
      expect(lruCache.containsKey('b')).toBeTruthy();
      expect(lruCache.containsKey('c')).toBeTruthy();
      expect(lruCache.containsKey('d')).toBeTruthy();
      expect(lruCache.containsKey('e')).toBeFalsy();
    });
  });

  describe('getting the oldest key', function() {
    it('moves the key to newest position', function() {
      fillLRUCache(lruCache);
      lruCache.get('a');
      expect(lruCache.getCount()).toEqual(4);
      expect(lruCache.getKeys()).toEqual(['a', 'd', 'c', 'b']);
      expect(lruCache.getValues()).toEqual([0, 3, 2, 1]);
    });
  });

  describe('getting a key in the middle', function() {
    it('moves the key to newest position', function() {
      fillLRUCache(lruCache);
      lruCache.get('b');
      expect(lruCache.getCount()).toEqual(4);
      expect(lruCache.getKeys()).toEqual(['b', 'd', 'c', 'a']);
      expect(lruCache.getValues()).toEqual([1, 3, 2, 0]);
    });
  });

  describe('getting the newest key', function() {
    it('maintains the key to newest position', function() {
      fillLRUCache(lruCache);
      lruCache.get('d');
      expect(lruCache.getCount()).toEqual(4);
      expect(lruCache.getKeys()).toEqual(['d', 'c', 'b', 'a']);
      expect(lruCache.getValues()).toEqual([3, 2, 1, 0]);
    });
  });

  describe('setting a new value', function() {
    it('adds it as the newest value', function() {
      fillLRUCache(lruCache);
      lruCache.set('e', 4);
      expect(lruCache.getKeys()).toEqual(['e', 'd', 'c', 'b', 'a']);
      expect(lruCache.getValues()).toEqual([4, 3, 2, 1, 0]);
    });
  });

  describe('setting an existing value', function() {
    it('raises an exception', function() {
      fillLRUCache(lruCache);
      expect(function() {
        lruCache.set('a', 0);
      }).toThrow();
    });
  });

  describe('setting a disallowed key', function() {
    it('raises an exception', function() {
      expect(function() {
        lruCache.set('hasOwnProperty', 0);
      }).toThrow();
    });
  });

  describe('popping a value', function() {
    it('returns the least-recent-used value', function() {
      fillLRUCache(lruCache);
      expect(lruCache.pop()).toEqual(0);
      expect(lruCache.getCount()).toEqual(3);
      expect(lruCache.containsKey('a')).toBeFalsy();
      expect(lruCache.pop()).toEqual(1);
      expect(lruCache.getCount()).toEqual(2);
      expect(lruCache.containsKey('b')).toBeFalsy();
      expect(lruCache.pop()).toEqual(2);
      expect(lruCache.getCount()).toEqual(1);
      expect(lruCache.containsKey('c')).toBeFalsy();
      expect(lruCache.pop()).toEqual(3);
      expect(lruCache.getCount()).toEqual(0);
      expect(lruCache.containsKey('d')).toBeFalsy();
    });
  });

  describe('peeking at the last value', function() {
    it('returns the last key', function() {
      fillLRUCache(lruCache);
      expect(lruCache.peekLast()).toEqual(0);
    });
    it('throws an exception when the cache is empty', function() {
      expect(function() {
        lruCache.peekLast();
      }).toThrow();
    });
  });

  describe('peeking at the last key', function() {
    it('returns the last key', function() {
      fillLRUCache(lruCache);
      expect(lruCache.peekLastKey()).toEqual('a');
    });
    it('throws an exception when the cache is empty', function() {
      expect(function() {
        lruCache.peekLastKey();
      }).toThrow();
    });
  });

  describe('clearing the cache', function() {
    it('clears the cache', function() {
      fillLRUCache(lruCache);
      lruCache.clear();
      expect(lruCache.getCount()).toEqual(0);
      expect(lruCache.getKeys()).toEqual([]);
      expect(lruCache.getValues()).toEqual([]);
    });
  });

});
