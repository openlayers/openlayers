goog.provide('ol.structs.LRUCache');

goog.require('ol.asserts');


/**
 * Implements a Least-Recently-Used cache where the keys do not conflict with
 * Object's properties (e.g. 'hasOwnProperty' is not allowed as a key). Expiring
 * items from the cache is the responsibility of the user.
 * @constructor
 * @struct
 * @template T
 * @param {number=} opt_highWaterMark High water mark.
 */
ol.structs.LRUCache = function(opt_highWaterMark) {

  /**
   * @type {number}
   */
  this.highWaterMark = opt_highWaterMark !== undefined ? opt_highWaterMark : 2048;

  /**
   * @private
   * @type {number}
   */
  this.count_ = 0;

  /**
   * @private
   * @type {!Object.<string, ol.LRUCacheEntry>}
   */
  this.entries_ = {};

  /**
   * @private
   * @type {?ol.LRUCacheEntry}
   */
  this.oldest_ = null;

  /**
   * @private
   * @type {?ol.LRUCacheEntry}
   */
  this.newest_ = null;

};


/**
 * @return {boolean} Can expire cache.
 */
ol.structs.LRUCache.prototype.canExpireCache = function() {
  return this.getCount() > this.highWaterMark;
};


/**
 * FIXME empty description for jsdoc
 */
ol.structs.LRUCache.prototype.clear = function() {
  this.count_ = 0;
  this.entries_ = {};
  this.oldest_ = null;
  this.newest_ = null;
};


/**
 * @param {string} key Key.
 * @return {boolean} Contains key.
 */
ol.structs.LRUCache.prototype.containsKey = function(key) {
  return this.entries_.hasOwnProperty(key);
};


/**
 * @param {function(this: S, T, string, ol.structs.LRUCache): ?} f The function
 *     to call for every entry from the oldest to the newer. This function takes
 *     3 arguments (the entry value, the entry key and the LRUCache object).
 *     The return value is ignored.
 * @param {S=} opt_this The object to use as `this` in `f`.
 * @template S
 */
ol.structs.LRUCache.prototype.forEach = function(f, opt_this) {
  var entry = this.oldest_;
  while (entry) {
    f.call(opt_this, entry.value_, entry.key_, this);
    entry = entry.newer;
  }
};


/**
 * @param {string} key Key.
 * @return {T} Value.
 */
ol.structs.LRUCache.prototype.get = function(key) {
  var entry = this.entries_[key];
  ol.asserts.assert(entry !== undefined,
      15); // Tried to get a value for a key that does not exist in the cache
  if (entry === this.newest_) {
    return entry.value_;
  } else if (entry === this.oldest_) {
    this.oldest_ = /** @type {ol.LRUCacheEntry} */ (this.oldest_.newer);
    this.oldest_.older = null;
  } else {
    entry.newer.older = entry.older;
    entry.older.newer = entry.newer;
  }
  entry.newer = null;
  entry.older = this.newest_;
  this.newest_.newer = entry;
  this.newest_ = entry;
  return entry.value_;
};


/**
 * Remove an entry from the cache.
 * @param {string} key The entry key.
 * @return {T} The removed entry.
 */
ol.structs.LRUCache.prototype.remove = function(key) {
  var entry = this.entries_[key];
  ol.asserts.assert(entry !== undefined, 15); // Tried to get a value for a key that does not exist in the cache
  if (entry === this.newest_) {
    this.newest_ = /** @type {ol.LRUCacheEntry} */ (entry.older);
    if (this.newest_) {
      this.newest_.newer = null;
    }
  } else if (entry === this.oldest_) {
    this.oldest_ = /** @type {ol.LRUCacheEntry} */ (entry.newer);
    if (this.oldest_) {
      this.oldest_.older = null;
    }
  } else {
    entry.newer.older = entry.older;
    entry.older.newer = entry.newer;
  }
  delete this.entries_[key];
  --this.count_;
  return entry.value_;
};


/**
 * @return {number} Count.
 */
ol.structs.LRUCache.prototype.getCount = function() {
  return this.count_;
};


/**
 * @return {Array.<string>} Keys.
 */
ol.structs.LRUCache.prototype.getKeys = function() {
  var keys = new Array(this.count_);
  var i = 0;
  var entry;
  for (entry = this.newest_; entry; entry = entry.older) {
    keys[i++] = entry.key_;
  }
  return keys;
};


/**
 * @return {Array.<T>} Values.
 */
ol.structs.LRUCache.prototype.getValues = function() {
  var values = new Array(this.count_);
  var i = 0;
  var entry;
  for (entry = this.newest_; entry; entry = entry.older) {
    values[i++] = entry.value_;
  }
  return values;
};


/**
 * @return {T} Last value.
 */
ol.structs.LRUCache.prototype.peekLast = function() {
  return this.oldest_.value_;
};


/**
 * @return {string} Last key.
 */
ol.structs.LRUCache.prototype.peekLastKey = function() {
  return this.oldest_.key_;
};


/**
 * Get the key of the newest item in the cache.  Throws if the cache is empty.
 * @return {string} The newest key.
 */
ol.structs.LRUCache.prototype.peekFirstKey = function() {
  return this.newest_.key_;
};


/**
 * @return {T} value Value.
 */
ol.structs.LRUCache.prototype.pop = function() {
  var entry = this.oldest_;
  delete this.entries_[entry.key_];
  if (entry.newer) {
    entry.newer.older = null;
  }
  this.oldest_ = /** @type {ol.LRUCacheEntry} */ (entry.newer);
  if (!this.oldest_) {
    this.newest_ = null;
  }
  --this.count_;
  return entry.value_;
};


/**
 * @param {string} key Key.
 * @param {T} value Value.
 */
ol.structs.LRUCache.prototype.replace = function(key, value) {
  this.get(key);  // update `newest_`
  this.entries_[key].value_ = value;
};


/**
 * @param {string} key Key.
 * @param {T} value Value.
 */
ol.structs.LRUCache.prototype.set = function(key, value) {
  ol.asserts.assert(!(key in this.entries_),
      16); // Tried to set a value for a key that is used already
  var entry = /** @type {ol.LRUCacheEntry} */ ({
    key_: key,
    newer: null,
    older: this.newest_,
    value_: value
  });
  if (!this.newest_) {
    this.oldest_ = entry;
  } else {
    this.newest_.newer = entry;
  }
  this.newest_ = entry;
  this.entries_[key] = entry;
  ++this.count_;
};
