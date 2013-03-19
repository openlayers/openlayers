goog.provide('ol.structs.Buffer');

goog.require('ol.structs.IntegerSet');


/**
 * @define {boolean} Replace unused entries with NaNs.
 */
ol.BUFFER_REPLACE_UNUSED_ENTRIES_WITH_NANS = goog.DEBUG;



/**
 * @constructor
 * @param {Array.<number>=} opt_arr Array.
 * @param {number=} opt_used Used.
 * @param {boolean=} opt_dirty Dirty.
 */
ol.structs.Buffer = function(opt_arr, opt_used, opt_dirty) {

  /**
   * @private
   * @type {Array.<number>}
   */
  this.arr_ = goog.isDef(opt_arr) ? opt_arr : [];

  /**
   * @private
   * @type {ol.structs.IntegerSet}
   */
  this.dirtySet_ = new ol.structs.IntegerSet();

  /**
   * @private
   * @type {ol.structs.IntegerSet}
   */
  this.freeSet_ = new ol.structs.IntegerSet();

  var used = goog.isDef(opt_used) ? opt_used : this.arr_.length;
  if (used < this.arr_.length) {
    this.freeSet_.addRange(used, this.arr_.length);
  }
  if (opt_dirty && used !== 0) {
    this.dirtySet_.addRange(0, used);
  }
  if (ol.BUFFER_REPLACE_UNUSED_ENTRIES_WITH_NANS) {
    var arr = this.arr_;
    var n = arr.length;
    var i;
    for (i = used; i < n; ++i) {
      arr[i] = NaN;
    }
  }

};


/**
 * @param {Array.<number>} values Values.
 * @return {number} Offset.
 */
ol.structs.Buffer.prototype.add = function(values) {
  var size = values.length;
  goog.asserts.assert(size > 0);
  var offset = this.freeSet_.findRange(size);
  goog.asserts.assert(offset != -1);  // FIXME
  this.freeSet_.removeRange(offset, offset + size);
  var i;
  for (i = 0; i < size; ++i) {
    this.arr_[offset + i] = values[i];
  }
  this.dirtySet_.addRange(offset, offset + size);
  return offset;
};


/**
 * @param {function(this: T, number, number)} f Callback.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
ol.structs.Buffer.prototype.forEachRange = function(f, opt_obj) {
  if (this.arr_.length !== 0) {
    this.freeSet_.forEachRangeInverted(0, this.arr_.length, f, opt_obj);
  }
};


/**
 * @return {Array.<number>} Array.
 */
ol.structs.Buffer.prototype.getArray = function() {
  return this.arr_;
};


/**
 * @return {number} Count.
 */
ol.structs.Buffer.prototype.getCount = function() {
  return this.arr_.length - this.freeSet_.getSize();
};


/**
 * @return {ol.structs.IntegerSet} Dirty set.
 */
ol.structs.Buffer.prototype.getDirtySet = function() {
  return this.dirtySet_;
};


/**
 * @return {ol.structs.IntegerSet} Free set.
 */
ol.structs.Buffer.prototype.getFreeSet = function() {
  return this.freeSet_;
};


/**
 * @param {number} size Size.
 * @param {number} offset Offset.
 */
ol.structs.Buffer.prototype.remove = function(size, offset) {
  this.freeSet_.addRange(offset, offset + size);
  this.dirtySet_.removeRange(offset, offset + size);
  if (ol.BUFFER_REPLACE_UNUSED_ENTRIES_WITH_NANS) {
    var arr = this.arr_;
    var i;
    for (i = 0; i < size; ++i) {
      arr[offset + i] = NaN;
    }
  }
};


/**
 * @param {Array.<number>} values Values.
 * @param {number} offset Offset.
 */
ol.structs.Buffer.prototype.set = function(values, offset) {
  var arr = this.arr_;
  var n = values.length;
  goog.asserts.assert(0 <= offset && offset + n <= arr.length);
  var i;
  for (i = 0; i < n; ++i) {
    arr[offset + i] = values[i];
  }
  this.dirtySet_.addRange(offset, offset + n);
};


/**
 * Marks the buffer as being clean.
 */
ol.structs.Buffer.prototype.setClean = function() {
  this.dirtySet_.clear();
};
