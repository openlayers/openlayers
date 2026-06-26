import {assert} from 'chai';
import LRUCache from '../../../../src/ol/structs/LRUCache.js';

describe('ol/structs/LRUCache.js', function () {
  let lruCache;

  function fillLRUCache(lruCache) {
    lruCache.set('a', 0);
    lruCache.set('b', 1);
    lruCache.set('c', 2);
    lruCache.set('d', 3);
  }

  beforeEach(function () {
    lruCache = new LRUCache();
  });

  describe('empty cache', function () {
    it('has size zero', function () {
      assert.deepEqual(lruCache.getCount(), 0);
    });
    it('has no keys', function () {
      assert.deepEqual(lruCache.getKeys(), []);
    });
    it('has no values', function () {
      assert.deepEqual(lruCache.getValues(), []);
    });
  });

  describe('populating', function () {
    it('returns the correct size', function () {
      fillLRUCache(lruCache);
      assert.deepEqual(lruCache.getCount(), 4);
    });
    it('contains the correct keys in the correct order', function () {
      fillLRUCache(lruCache);
      assert.deepEqual(lruCache.getKeys(), ['d', 'c', 'b', 'a']);
    });
    it('contains the correct values in the correct order', function () {
      fillLRUCache(lruCache);
      assert.deepEqual(lruCache.getValues(), [3, 2, 1, 0]);
    });
    it('reports which keys are contained', function () {
      fillLRUCache(lruCache);
      assert.isOk(lruCache.containsKey('a'));
      assert.isOk(lruCache.containsKey('b'));
      assert.isOk(lruCache.containsKey('c'));
      assert.isOk(lruCache.containsKey('d'));
      assert.isFalse(lruCache.containsKey('e'));
    });
  });

  describe('getting the oldest key', function () {
    it('moves the key to newest position', function () {
      fillLRUCache(lruCache);
      lruCache.get('a');
      assert.deepEqual(lruCache.getCount(), 4);
      assert.deepEqual(lruCache.getKeys(), ['a', 'd', 'c', 'b']);
      assert.deepEqual(lruCache.getValues(), [0, 3, 2, 1]);
    });
  });

  describe('getting a key in the middle', function () {
    it('moves the key to newest position', function () {
      fillLRUCache(lruCache);
      lruCache.get('b');
      assert.deepEqual(lruCache.getCount(), 4);
      assert.deepEqual(lruCache.getKeys(), ['b', 'd', 'c', 'a']);
      assert.deepEqual(lruCache.getValues(), [1, 3, 2, 0]);
    });
  });

  describe('getting the newest key', function () {
    it('maintains the key to newest position', function () {
      fillLRUCache(lruCache);
      lruCache.get('d');
      assert.deepEqual(lruCache.getCount(), 4);
      assert.deepEqual(lruCache.getKeys(), ['d', 'c', 'b', 'a']);
      assert.deepEqual(lruCache.getValues(), [3, 2, 1, 0]);
    });
  });

  describe('replacing value of a key', function () {
    it('moves the key to newest position', function () {
      fillLRUCache(lruCache);
      lruCache.replace('b', 4);
      assert.deepEqual(lruCache.getCount(), 4);
      assert.deepEqual(lruCache.getKeys(), ['b', 'd', 'c', 'a']);
      assert.deepEqual(lruCache.getValues(), [4, 3, 2, 0]);
    });
  });

  describe('setting a new value', function () {
    it('adds it as the newest value', function () {
      fillLRUCache(lruCache);
      lruCache.set('e', 4);
      assert.deepEqual(lruCache.getKeys(), ['e', 'd', 'c', 'b', 'a']);
      assert.deepEqual(lruCache.getValues(), [4, 3, 2, 1, 0]);
    });
  });

  describe('setting an existing value', function () {
    it('raises an exception', function () {
      fillLRUCache(lruCache);
      assert.throws(function () {
        lruCache.set('a', 0);
      });
    });
  });

  describe('disallowed keys', function () {
    it('setting raises an exception', function () {
      assert.throws(function () {
        lruCache.set('constructor', 0);
      });
      assert.throws(function () {
        lruCache.set('hasOwnProperty', 0);
      });
      assert.throws(function () {
        lruCache.set('isPrototypeOf', 0);
      });
      assert.throws(function () {
        lruCache.set('propertyIsEnumerable', 0);
      });
      assert.throws(function () {
        lruCache.set('toLocaleString', 0);
      });
      assert.throws(function () {
        lruCache.set('toString', 0);
      });
      assert.throws(function () {
        lruCache.set('valueOf', 0);
      });
    });
    it('getting returns false', function () {
      assert.isFalse(lruCache.containsKey('constructor'));
      assert.isFalse(lruCache.containsKey('hasOwnProperty'));
      assert.isFalse(lruCache.containsKey('isPrototypeOf'));
      assert.isFalse(lruCache.containsKey('propertyIsEnumerable'));
      assert.isFalse(lruCache.containsKey('toLocaleString'));
      assert.isFalse(lruCache.containsKey('toString'));
      assert.isFalse(lruCache.containsKey('valueOf'));
    });
  });

  describe('popping a value', function () {
    it('returns the least-recent-used value', function () {
      fillLRUCache(lruCache);
      assert.deepEqual(lruCache.pop(), 0);
      assert.deepEqual(lruCache.getCount(), 3);
      assert.isFalse(lruCache.containsKey('a'));
      assert.deepEqual(lruCache.pop(), 1);
      assert.deepEqual(lruCache.getCount(), 2);
      assert.isFalse(lruCache.containsKey('b'));
      assert.deepEqual(lruCache.pop(), 2);
      assert.deepEqual(lruCache.getCount(), 1);
      assert.isFalse(lruCache.containsKey('c'));
      assert.deepEqual(lruCache.pop(), 3);
      assert.deepEqual(lruCache.getCount(), 0);
      assert.isFalse(lruCache.containsKey('d'));
    });
  });

  describe('#peekFirstKey()', function () {
    it('returns the newest key in the cache', function () {
      const cache = new LRUCache();
      cache.set('oldest', 'oldest');
      cache.set('oldish', 'oldish');
      cache.set('newish', 'newish');
      cache.set('newest', 'newest');
      assert.deepEqual(cache.peekFirstKey(), 'newest');
    });

    it('works if the cache has one item', function () {
      const cache = new LRUCache();
      cache.set('key', 'value');
      assert.deepEqual(cache.peekFirstKey(), 'key');
    });

    it('throws if the cache is empty', function () {
      const cache = new LRUCache();
      assert.throws(function () {
        cache.peekFirstKey();
      });
    });
  });

  describe('peeking at the last value', function () {
    it('returns the last key', function () {
      fillLRUCache(lruCache);
      assert.deepEqual(lruCache.peekLast(), 0);
    });
    it('throws an exception when the cache is empty', function () {
      assert.throws(function () {
        lruCache.peekLast();
      });
    });
  });

  describe('peeking at the last key', function () {
    it('returns the last key', function () {
      fillLRUCache(lruCache);
      assert.deepEqual(lruCache.peekLastKey(), 'a');
    });
    it('throws an exception when the cache is empty', function () {
      assert.throws(function () {
        lruCache.peekLastKey();
      });
    });
  });

  describe('#remove()', function () {
    it('removes an item from the cache', function () {
      const cache = new LRUCache();
      cache.set('oldest', 'oldest');
      cache.set('oldish', 'oldish');
      cache.set('newish', 'newish');
      cache.set('newest', 'newest');

      cache.remove('oldish');
      assert.deepEqual(cache.getCount(), 3);
      assert.deepEqual(cache.getValues(), ['newest', 'newish', 'oldest']);
    });

    it('works when removing the oldest item', function () {
      const cache = new LRUCache();
      cache.set('oldest', 'oldest');
      cache.set('oldish', 'oldish');
      cache.set('newish', 'newish');
      cache.set('newest', 'newest');

      cache.remove('oldest');
      assert.deepEqual(cache.getCount(), 3);
      assert.deepEqual(cache.peekLastKey(), 'oldish');
      assert.deepEqual(cache.getValues(), ['newest', 'newish', 'oldish']);
    });

    it('works when removing the newest item', function () {
      const cache = new LRUCache();
      cache.set('oldest', 'oldest');
      cache.set('oldish', 'oldish');
      cache.set('newish', 'newish');
      cache.set('newest', 'newest');

      cache.remove('newest');
      assert.deepEqual(cache.getCount(), 3);
      assert.deepEqual(cache.peekFirstKey(), 'newish');
      assert.deepEqual(cache.getValues(), ['newish', 'oldish', 'oldest']);
    });

    it('returns the removed item', function () {
      const cache = new LRUCache();
      const item = {};
      cache.set('key', item);

      const returned = cache.remove('key');
      assert.strictEqual(returned, item);
    });

    it('throws if the key does not exist', function () {
      const cache = new LRUCache();
      cache.set('foo', 'foo');
      cache.set('bar', 'bar');

      const call = function () {
        cache.remove('bam');
      };
      assert.throws(call);
    });
  });

  describe('clearing the cache', function () {
    it('clears the cache', function () {
      fillLRUCache(lruCache);
      lruCache.clear();
      assert.deepEqual(lruCache.getCount(), 0);
      assert.deepEqual(lruCache.getKeys(), []);
      assert.deepEqual(lruCache.getValues(), []);
    });
  });

  describe('setting the cache size', function () {
    it('sets the cache size', function () {
      lruCache.setSize(2);
      assert.strictEqual(lruCache.highWaterMark, 2);
      fillLRUCache(lruCache);
      while (lruCache.canExpireCache()) {
        lruCache.pop();
      }
      assert.strictEqual(lruCache.getKeys().length, 2);
    });
  });
});
