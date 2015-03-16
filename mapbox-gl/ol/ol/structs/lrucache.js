goog.provide('ol.structs.LRUCache');

goog.require('goog.asserts');
goog.require('goog.object');



/**
 * Implements a Least-Recently-Used cache where the keys do not conflict with
 * Object's properties (e.g. 'hasOwnProperty' is not allowed as a key). Expiring
 * items from the cache is the responsibility of the user.
 * @constructor
 * @struct
 * @template T
 */
ol.structs.LRUCache = function() {

  /**
   * @private
   * @type {number}
   */
  this.count_ = 0;

  /**
   * @private
   * @type {Object.<string, ol.structs.LRUCacheEntry>}
   */
  this.entries_ = {};

  /**
   * @private
   * @type {?ol.structs.LRUCacheEntry}
   */
  this.oldest_ = null;

  /**
   * @private
   * @type {?ol.structs.LRUCacheEntry}
   */
  this.newest_ = null;

};


/**
 * FIXME empty description for jsdoc
 */
ol.structs.LRUCache.prototype.assertValid = function() {
  if (this.count_ === 0) {
    goog.asserts.assert(goog.object.isEmpty(this.entries_));
    goog.asserts.assert(goog.isNull(this.oldest_));
    goog.asserts.assert(goog.isNull(this.newest_));
  } else {
    goog.asserts.assert(goog.object.getCount(this.entries_) == this.count_);
    goog.asserts.assert(!goog.isNull(this.oldest_));
    goog.asserts.assert(goog.isNull(this.oldest_.older));
    goog.asserts.assert(!goog.isNull(this.newest_));
    goog.asserts.assert(goog.isNull(this.newest_.newer));
    var i, entry;
    var older = null;
    i = 0;
    for (entry = this.oldest_; !goog.isNull(entry); entry = entry.newer) {
      goog.asserts.assert(entry.older === older);
      older = entry;
      ++i;
    }
    goog.asserts.assert(i == this.count_);
    var newer = null;
    i = 0;
    for (entry = this.newest_; !goog.isNull(entry); entry = entry.older) {
      goog.asserts.assert(entry.newer === newer);
      newer = entry;
      ++i;
    }
    goog.asserts.assert(i == this.count_);
  }
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
  while (!goog.isNull(entry)) {
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
  goog.asserts.assert(goog.isDef(entry));
  if (entry === this.newest_) {
    return entry.value_;
  } else if (entry === this.oldest_) {
    this.oldest_ = this.oldest_.newer;
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
  for (entry = this.newest_; !goog.isNull(entry); entry = entry.older) {
    keys[i++] = entry.key_;
  }
  goog.asserts.assert(i == this.count_);
  return keys;
};


/**
 * @return {Array.<T>} Values.
 */
ol.structs.LRUCache.prototype.getValues = function() {
  var values = new Array(this.count_);
  var i = 0;
  var entry;
  for (entry = this.newest_; !goog.isNull(entry); entry = entry.older) {
    values[i++] = entry.value_;
  }
  goog.asserts.assert(i == this.count_);
  return values;
};


/**
 * @return {T} Last value.
 */
ol.structs.LRUCache.prototype.peekLast = function() {
  goog.asserts.assert(!goog.isNull(this.oldest_));
  return this.oldest_.value_;
};


/**
 * @return {string} Last key.
 */
ol.structs.LRUCache.prototype.peekLastKey = function() {
  goog.asserts.assert(!goog.isNull(this.oldest_));
  return this.oldest_.key_;
};


/**
 * @return {T} value Value.
 */
ol.structs.LRUCache.prototype.pop = function() {
  goog.asserts.assert(!goog.isNull(this.oldest_));
  goog.asserts.assert(!goog.isNull(this.newest_));
  var entry = this.oldest_;
  goog.asserts.assert(entry.key_ in this.entries_);
  delete this.entries_[entry.key_];
  if (!goog.isNull(entry.newer)) {
    entry.newer.older = null;
  }
  this.oldest_ = entry.newer;
  if (goog.isNull(this.oldest_)) {
    this.newest_ = null;
  }
  --this.count_;
  return entry.value_;
};


/**
 * @param {string} key Key.
 * @param {T} value Value.
 */
ol.structs.LRUCache.prototype.set = function(key, value) {
  goog.asserts.assert(!(key in {}));
  goog.asserts.assert(!(key in this.entries_));
  var entry = {
    key_: key,
    newer: null,
    older: this.newest_,
    value_: value
  };
  if (goog.isNull(this.newest_)) {
    this.oldest_ = entry;
  } else {
    this.newest_.newer = entry;
  }
  this.newest_ = entry;
  this.entries_[key] = entry;
  ++this.count_;
};


/**
 * @typedef {{key_: string,
 *            newer: ol.structs.LRUCacheEntry,
 *            older: ol.structs.LRUCacheEntry,
 *            value_: *}}
 */
ol.structs.LRUCacheEntry;
