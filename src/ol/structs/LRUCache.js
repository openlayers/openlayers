/**
 * @module ol/structs/LRUCache
 */
import {inherits} from '../util.js';
import {assert} from '../asserts.js';
import EventTarget from '../events/EventTarget.js';
import EventType from '../events/EventType.js';


/**
 * @typedef {Object} Entry
 * @property {string} key_
 * @property {Object} newer
 * @property {Object} older
 * @property {*} value_
 */


/**
 * Implements a Least-Recently-Used cache where the keys do not conflict with
 * Object's properties (e.g. 'hasOwnProperty' is not allowed as a key). Expiring
 * items from the cache is the responsibility of the user.
 * @constructor
 * @extends {module:ol/events/EventTarget}
 * @fires module:ol/events/Event~Event
 * @struct
 * @template T
 * @param {number=} opt_highWaterMark High water mark.
 */
const LRUCache = function(opt_highWaterMark) {

  EventTarget.call(this);

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
   * @type {!Object.<string, module:ol/structs/LRUCache~Entry>}
   */
  this.entries_ = {};

  /**
   * @private
   * @type {?module:ol/structs/LRUCache~Entry}
   */
  this.oldest_ = null;

  /**
   * @private
   * @type {?module:ol/structs/LRUCache~Entry}
   */
  this.newest_ = null;

};

inherits(LRUCache, EventTarget);


/**
 * @return {boolean} Can expire cache.
 */
LRUCache.prototype.canExpireCache = function() {
  return this.getCount() > this.highWaterMark;
};


/**
 * FIXME empty description for jsdoc
 */
LRUCache.prototype.clear = function() {
  this.count_ = 0;
  this.entries_ = {};
  this.oldest_ = null;
  this.newest_ = null;
  this.dispatchEvent(EventType.CLEAR);
};


/**
 * @param {string} key Key.
 * @return {boolean} Contains key.
 */
LRUCache.prototype.containsKey = function(key) {
  return this.entries_.hasOwnProperty(key);
};


/**
 * @param {function(this: S, T, string, module:ol/structs/LRUCache): ?} f The function
 *     to call for every entry from the oldest to the newer. This function takes
 *     3 arguments (the entry value, the entry key and the LRUCache object).
 *     The return value is ignored.
 * @param {S=} opt_this The object to use as `this` in `f`.
 * @template S
 */
LRUCache.prototype.forEach = function(f, opt_this) {
  let entry = this.oldest_;
  while (entry) {
    f.call(opt_this, entry.value_, entry.key_, this);
    entry = entry.newer;
  }
};


/**
 * @param {string} key Key.
 * @return {T} Value.
 */
LRUCache.prototype.get = function(key) {
  const entry = this.entries_[key];
  assert(entry !== undefined,
    15); // Tried to get a value for a key that does not exist in the cache
  if (entry === this.newest_) {
    return entry.value_;
  } else if (entry === this.oldest_) {
    this.oldest_ = /** @type {module:ol/structs/LRUCache~Entry} */ (this.oldest_.newer);
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
LRUCache.prototype.remove = function(key) {
  const entry = this.entries_[key];
  assert(entry !== undefined, 15); // Tried to get a value for a key that does not exist in the cache
  if (entry === this.newest_) {
    this.newest_ = /** @type {module:ol/structs/LRUCache~Entry} */ (entry.older);
    if (this.newest_) {
      this.newest_.newer = null;
    }
  } else if (entry === this.oldest_) {
    this.oldest_ = /** @type {module:ol/structs/LRUCache~Entry} */ (entry.newer);
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
LRUCache.prototype.getCount = function() {
  return this.count_;
};


/**
 * @return {Array.<string>} Keys.
 */
LRUCache.prototype.getKeys = function() {
  const keys = new Array(this.count_);
  let i = 0;
  let entry;
  for (entry = this.newest_; entry; entry = entry.older) {
    keys[i++] = entry.key_;
  }
  return keys;
};


/**
 * @return {Array.<T>} Values.
 */
LRUCache.prototype.getValues = function() {
  const values = new Array(this.count_);
  let i = 0;
  let entry;
  for (entry = this.newest_; entry; entry = entry.older) {
    values[i++] = entry.value_;
  }
  return values;
};


/**
 * @return {T} Last value.
 */
LRUCache.prototype.peekLast = function() {
  return this.oldest_.value_;
};


/**
 * @return {string} Last key.
 */
LRUCache.prototype.peekLastKey = function() {
  return this.oldest_.key_;
};


/**
 * Get the key of the newest item in the cache.  Throws if the cache is empty.
 * @return {string} The newest key.
 */
LRUCache.prototype.peekFirstKey = function() {
  return this.newest_.key_;
};


/**
 * @return {T} value Value.
 */
LRUCache.prototype.pop = function() {
  const entry = this.oldest_;
  delete this.entries_[entry.key_];
  if (entry.newer) {
    entry.newer.older = null;
  }
  this.oldest_ = /** @type {module:ol/structs/LRUCache~Entry} */ (entry.newer);
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
LRUCache.prototype.replace = function(key, value) {
  this.get(key);  // update `newest_`
  this.entries_[key].value_ = value;
};


/**
 * @param {string} key Key.
 * @param {T} value Value.
 */
LRUCache.prototype.set = function(key, value) {
  assert(!(key in this.entries_),
    16); // Tried to set a value for a key that is used already
  const entry = /** @type {module:ol/structs/LRUCache~Entry} */ ({
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


/**
 * Set a maximum number of entries for the cache.
 * @param {number} size Cache size.
 * @api
 */
LRUCache.prototype.setSize = function(size) {
  this.highWaterMark = size;
};


/**
 * Prune the cache.
 */
LRUCache.prototype.prune = function() {
  while (this.canExpireCache()) {
    this.pop();
  }
};
export default LRUCache;
