import LRUCache from '../../../../src/ol/structs/LRUCache.js';


describe('ol.structs.LRUCache', () => {

  let lruCache;

  function fillLRUCache(lruCache) {
    lruCache.set('a', 0);
    lruCache.set('b', 1);
    lruCache.set('c', 2);
    lruCache.set('d', 3);
  }

  beforeEach(() => {
    lruCache = new LRUCache();
  });

  describe('empty cache', () => {
    test('has size zero', () => {
      expect(lruCache.getCount()).toEqual(0);
    });
    test('has no keys', () => {
      expect(lruCache.getKeys()).toEqual([]);
    });
    test('has no values', () => {
      expect(lruCache.getValues()).toEqual([]);
    });
  });

  describe('populating', () => {
    test('returns the correct size', () => {
      fillLRUCache(lruCache);
      expect(lruCache.getCount()).toEqual(4);
    });
    test('contains the correct keys in the correct order', () => {
      fillLRUCache(lruCache);
      expect(lruCache.getKeys()).toEqual(['d', 'c', 'b', 'a']);
    });
    test('contains the correct values in the correct order', () => {
      fillLRUCache(lruCache);
      expect(lruCache.getValues()).toEqual([3, 2, 1, 0]);
    });
    test('reports which keys are contained', () => {
      fillLRUCache(lruCache);
      expect(lruCache.containsKey('a')).toBeTruthy();
      expect(lruCache.containsKey('b')).toBeTruthy();
      expect(lruCache.containsKey('c')).toBeTruthy();
      expect(lruCache.containsKey('d')).toBeTruthy();
      expect(lruCache.containsKey('e')).not.toBe();
    });
  });

  describe('getting the oldest key', () => {
    test('moves the key to newest position', () => {
      fillLRUCache(lruCache);
      lruCache.get('a');
      expect(lruCache.getCount()).toEqual(4);
      expect(lruCache.getKeys()).toEqual(['a', 'd', 'c', 'b']);
      expect(lruCache.getValues()).toEqual([0, 3, 2, 1]);
    });
  });

  describe('getting a key in the middle', () => {
    test('moves the key to newest position', () => {
      fillLRUCache(lruCache);
      lruCache.get('b');
      expect(lruCache.getCount()).toEqual(4);
      expect(lruCache.getKeys()).toEqual(['b', 'd', 'c', 'a']);
      expect(lruCache.getValues()).toEqual([1, 3, 2, 0]);
    });
  });

  describe('getting the newest key', () => {
    test('maintains the key to newest position', () => {
      fillLRUCache(lruCache);
      lruCache.get('d');
      expect(lruCache.getCount()).toEqual(4);
      expect(lruCache.getKeys()).toEqual(['d', 'c', 'b', 'a']);
      expect(lruCache.getValues()).toEqual([3, 2, 1, 0]);
    });
  });

  describe('replacing value of a key', () => {
    test('moves the key to newest position', () => {
      fillLRUCache(lruCache);
      lruCache.replace('b', 4);
      expect(lruCache.getCount()).toEqual(4);
      expect(lruCache.getKeys()).toEqual(['b', 'd', 'c', 'a']);
      expect(lruCache.getValues()).toEqual([4, 3, 2, 0]);
    });
  });

  describe('setting a new value', () => {
    test('adds it as the newest value', () => {
      fillLRUCache(lruCache);
      lruCache.set('e', 4);
      expect(lruCache.getKeys()).toEqual(['e', 'd', 'c', 'b', 'a']);
      expect(lruCache.getValues()).toEqual([4, 3, 2, 1, 0]);
    });
  });

  describe('setting an existing value', () => {
    test('raises an exception', () => {
      fillLRUCache(lruCache);
      expect(function() {
        lruCache.set('a', 0);
      }).toThrow();
    });
  });

  describe('disallowed keys', () => {
    test('setting raises an exception', () => {
      expect(function() {
        lruCache.set('constructor', 0);
      }).toThrow();
      expect(function() {
        lruCache.set('hasOwnProperty', 0);
      }).toThrow();
      expect(function() {
        lruCache.set('isPrototypeOf', 0);
      }).toThrow();
      expect(function() {
        lruCache.set('propertyIsEnumerable', 0);
      }).toThrow();
      expect(function() {
        lruCache.set('toLocaleString', 0);
      }).toThrow();
      expect(function() {
        lruCache.set('toString', 0);
      }).toThrow();
      expect(function() {
        lruCache.set('valueOf', 0);
      }).toThrow();
    });
    test('getting returns false', () => {
      expect(lruCache.containsKey('constructor')).not.toBe();
      expect(lruCache.containsKey('hasOwnProperty')).not.toBe();
      expect(lruCache.containsKey('isPrototypeOf')).not.toBe();
      expect(lruCache.containsKey('propertyIsEnumerable')).not.toBe();
      expect(lruCache.containsKey('toLocaleString')).not.toBe();
      expect(lruCache.containsKey('toString')).not.toBe();
      expect(lruCache.containsKey('valueOf')).not.toBe();
    });
  });

  describe('popping a value', () => {
    test('returns the least-recent-used value', () => {
      fillLRUCache(lruCache);
      expect(lruCache.pop()).toEqual(0);
      expect(lruCache.getCount()).toEqual(3);
      expect(lruCache.containsKey('a')).not.toBe();
      expect(lruCache.pop()).toEqual(1);
      expect(lruCache.getCount()).toEqual(2);
      expect(lruCache.containsKey('b')).not.toBe();
      expect(lruCache.pop()).toEqual(2);
      expect(lruCache.getCount()).toEqual(1);
      expect(lruCache.containsKey('c')).not.toBe();
      expect(lruCache.pop()).toEqual(3);
      expect(lruCache.getCount()).toEqual(0);
      expect(lruCache.containsKey('d')).not.toBe();
    });
  });

  describe('#peekFirstKey()', () => {
    test('returns the newest key in the cache', () => {
      const cache = new LRUCache();
      cache.set('oldest', 'oldest');
      cache.set('oldish', 'oldish');
      cache.set('newish', 'newish');
      cache.set('newest', 'newest');
      expect(cache.peekFirstKey()).toEqual('newest');
    });

    test('works if the cache has one item', () => {
      const cache = new LRUCache();
      cache.set('key', 'value');
      expect(cache.peekFirstKey()).toEqual('key');
    });

    test('throws if the cache is empty', () => {
      const cache = new LRUCache();
      expect(function() {
        cache.peekFirstKey();
      }).toThrow();
    });
  });

  describe('peeking at the last value', () => {
    test('returns the last key', () => {
      fillLRUCache(lruCache);
      expect(lruCache.peekLast()).toEqual(0);
    });
    test('throws an exception when the cache is empty', () => {
      expect(function() {
        lruCache.peekLast();
      }).toThrow();
    });
  });

  describe('peeking at the last key', () => {
    test('returns the last key', () => {
      fillLRUCache(lruCache);
      expect(lruCache.peekLastKey()).toEqual('a');
    });
    test('throws an exception when the cache is empty', () => {
      expect(function() {
        lruCache.peekLastKey();
      }).toThrow();
    });
  });

  describe('#remove()', () => {
    test('removes an item from the cache', () => {
      const cache = new LRUCache();
      cache.set('oldest', 'oldest');
      cache.set('oldish', 'oldish');
      cache.set('newish', 'newish');
      cache.set('newest', 'newest');

      cache.remove('oldish');
      expect(cache.getCount()).toEqual(3);
      expect(cache.getValues()).toEqual(['newest', 'newish', 'oldest']);
    });

    test('works when removing the oldest item', () => {
      const cache = new LRUCache();
      cache.set('oldest', 'oldest');
      cache.set('oldish', 'oldish');
      cache.set('newish', 'newish');
      cache.set('newest', 'newest');

      cache.remove('oldest');
      expect(cache.getCount()).toEqual(3);
      expect(cache.peekLastKey()).toEqual('oldish');
      expect(cache.getValues()).toEqual(['newest', 'newish', 'oldish']);
    });

    test('works when removing the newest item', () => {
      const cache = new LRUCache();
      cache.set('oldest', 'oldest');
      cache.set('oldish', 'oldish');
      cache.set('newish', 'newish');
      cache.set('newest', 'newest');

      cache.remove('newest');
      expect(cache.getCount()).toEqual(3);
      expect(cache.peekFirstKey()).toEqual('newish');
      expect(cache.getValues()).toEqual(['newish', 'oldish', 'oldest']);
    });

    test('returns the removed item', () => {
      const cache = new LRUCache();
      const item = {};
      cache.set('key', item);

      const returned = cache.remove('key');
      expect(returned).toBe(item);
    });

    test('throws if the key does not exist', () => {
      const cache = new LRUCache();
      cache.set('foo', 'foo');
      cache.set('bar', 'bar');

      const call = function() {
        cache.remove('bam');
      };
      expect(call).toThrow();
    });
  });

  describe('clearing the cache', () => {
    test('clears the cache', () => {
      fillLRUCache(lruCache);
      lruCache.clear();
      expect(lruCache.getCount()).toEqual(0);
      expect(lruCache.getKeys()).toEqual([]);
      expect(lruCache.getValues()).toEqual([]);
    });
  });

  describe('setting the cache size', () => {
    test('sets the cache size', () => {
      lruCache.setSize(2);
      expect(lruCache.highWaterMark).toBe(2);
      fillLRUCache(lruCache);
      while (lruCache.canExpireCache()) {
        lruCache.pop();
      }
      expect(lruCache.getKeys().length).toBe(2);
    });
  });

});
