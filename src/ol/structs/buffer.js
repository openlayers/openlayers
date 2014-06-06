goog.provide('ol.structs.Buffer');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.webgl');
goog.require('ol');
goog.require('ol.structs.IntegerSet');


/**
 * @enum {number}
 */
ol.structs.BufferUsage = {
  STATIC_DRAW: goog.webgl.STATIC_DRAW,
  STREAM_DRAW: goog.webgl.STREAM_DRAW,
  DYNAMIC_DRAW: goog.webgl.DYNAMIC_DRAW
};



/**
 * @constructor
 * @param {Array.<number>=} opt_arr Array.
 * @param {number=} opt_used Used.
 * @param {number=} opt_usage Usage.
 * @struct
 */
ol.structs.Buffer = function(opt_arr, opt_used, opt_usage) {

  /**
   * @private
   * @type {Array.<number>}
   */
  this.arr_ = goog.isDef(opt_arr) ? opt_arr : [];

  /**
   * @private
   * @type {Array.<ol.structs.IntegerSet>}
   */
  this.dirtySets_ = [];

  /**
   * @private
   * @type {ol.structs.IntegerSet}
   */
  this.freeSet_ = new ol.structs.IntegerSet();

  var used = goog.isDef(opt_used) ? opt_used : this.arr_.length;
  if (used < this.arr_.length) {
    this.freeSet_.addRange(used, this.arr_.length);
  }
  if (ol.BUFFER_REPLACE_UNUSED_ENTRIES_WITH_NANS) {
    var arr = this.arr_;
    var n = arr.length;
    var i;
    for (i = used; i < n; ++i) {
      arr[i] = NaN;
    }
  }

  /**
   * @private
   * @type {?Float32Array}
   */
  this.split32_ = null;

  /**
   * @private
   * @type {ol.structs.IntegerSet}
   */
  this.split32DirtySet_ = null;

  /**
   * @private
   * @type {number}
   */
  this.usage_ = goog.isDef(opt_usage) ?
      opt_usage : ol.structs.BufferUsage.STATIC_DRAW;

};


/**
 * @param {number} size Size.
 * @return {number} Offset.
 */
ol.structs.Buffer.prototype.allocate = function(size) {
  goog.asserts.assert(size > 0);
  var offset = this.freeSet_.findRange(size);
  goog.asserts.assert(offset != -1);  // FIXME
  this.freeSet_.removeRange(offset, offset + size);
  return offset;
};


/**
 * @param {Array.<number>} values Values.
 * @return {number} Offset.
 */
ol.structs.Buffer.prototype.add = function(values) {
  var size = values.length;
  var offset = this.allocate(size);
  var i;
  for (i = 0; i < size; ++i) {
    this.arr_[offset + i] = values[i];
  }
  this.markDirty(size, offset);
  return offset;
};


/**
 * @param {ol.structs.IntegerSet} dirtySet Dirty set.
 */
ol.structs.Buffer.prototype.addDirtySet = function(dirtySet) {
  goog.asserts.assert(!goog.array.contains(this.dirtySets_, dirtySet));
  this.dirtySets_.push(dirtySet);
};


/**
 * @param {function(this: T, number, number)} f Callback.
 * @param {T=} opt_this The object to use as `this` in `f`.
 * @template T
 */
ol.structs.Buffer.prototype.forEachRange = function(f, opt_this) {
  if (this.arr_.length !== 0) {
    this.freeSet_.forEachRangeInverted(0, this.arr_.length, f, opt_this);
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
 * @return {ol.structs.IntegerSet} Free set.
 */
ol.structs.Buffer.prototype.getFreeSet = function() {
  return this.freeSet_;
};


/**
 * Returns a Float32Array twice the length of the buffer containing each value
 * split into two 32-bit floating point values that, when added together,
 * approximate the original value. Even indicies contain the high bits, odd
 * indicies contain the low bits.
 * @see http://blogs.agi.com/insight3d/index.php/2008/09/03/precisions-precisions/
 * @return {Float32Array} Split.
 */
ol.structs.Buffer.prototype.getSplit32 = function() {
  var arr = this.arr_;
  var n = arr.length;
  if (goog.isNull(this.split32DirtySet_)) {
    this.split32DirtySet_ = new ol.structs.IntegerSet([0, n]);
    this.addDirtySet(this.split32DirtySet_);
  }
  if (goog.isNull(this.split32_)) {
    this.split32_ = new Float32Array(2 * n);
  }
  var split32 = this.split32_;
  this.split32DirtySet_.forEachRange(function(start, stop) {
    var doubleHigh, i, j, value;
    for (i = start, j = 2 * start; i < stop; ++i, j += 2) {
      value = arr[i];
      if (value < 0) {
        doubleHigh = 65536 * Math.floor(-value / 65536);
        split32[j] = -doubleHigh;
        split32[j + 1] = value + doubleHigh;
      } else {
        doubleHigh = 65536 * Math.floor(value / 65536);
        split32[j] = doubleHigh;
        split32[j + 1] = value - doubleHigh;
      }
    }
  });
  this.split32DirtySet_.clear();
  return this.split32_;
};


/**
 * @return {number} Usage.
 */
ol.structs.Buffer.prototype.getUsage = function() {
  return this.usage_;
};


/**
 * @param {number} size Size.
 * @param {number} offset Offset.
 */
ol.structs.Buffer.prototype.markDirty = function(size, offset) {
  var i, ii;
  for (i = 0, ii = this.dirtySets_.length; i < ii; ++i) {
    this.dirtySets_[i].addRange(offset, offset + size);
  }
};


/**
 * @param {number} size Size.
 * @param {number} offset Offset.
 */
ol.structs.Buffer.prototype.remove = function(size, offset) {
  var i, ii;
  this.freeSet_.addRange(offset, offset + size);
  for (i = 0, ii = this.dirtySets_.length; i < ii; ++i) {
    this.dirtySets_[i].removeRange(offset, offset + size);
  }
  if (ol.BUFFER_REPLACE_UNUSED_ENTRIES_WITH_NANS) {
    var arr = this.arr_;
    for (i = 0; i < size; ++i) {
      arr[offset + i] = NaN;
    }
  }
};


/**
 * @param {ol.structs.IntegerSet} dirtySet Dirty set.
 */
ol.structs.Buffer.prototype.removeDirtySet = function(dirtySet) {
  var removed = goog.array.remove(this.dirtySets_, dirtySet);
  goog.asserts.assert(removed);
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
  this.markDirty(n, offset);
};
