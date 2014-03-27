goog.provide('ol.structs.IntegerSet');

goog.require('goog.asserts');



/**
 * A set of integers represented as a set of integer ranges.
 * This implementation is designed for the case when the number of distinct
 * integer ranges is small.
 * @constructor
 * @struct
 * @param {Array.<number>=} opt_arr Array.
 */
ol.structs.IntegerSet = function(opt_arr) {

  /**
   * @private
   * @type {Array.<number>}
   */
  this.arr_ = goog.isDef(opt_arr) ? opt_arr : [];

  if (goog.DEBUG) {
    this.assertValid();
  }

};


/**
 * @param {number} addStart Start.
 * @param {number} addStop Stop.
 */
ol.structs.IntegerSet.prototype.addRange = function(addStart, addStop) {
  goog.asserts.assert(addStart <= addStop);
  if (addStart == addStop) {
    return;
  }
  var arr = this.arr_;
  var n = arr.length;
  var i;
  for (i = 0; i < n; i += 2) {
    if (addStart <= arr[i]) {
      // FIXME check if splice is really needed
      arr.splice(i, 0, addStart, addStop);
      this.compactRanges_();
      return;
    }
  }
  arr.push(addStart, addStop);
  this.compactRanges_();
};


/**
 * FIXME empty description for jsdoc
 */
ol.structs.IntegerSet.prototype.assertValid = function() {
  var arr = this.arr_;
  var n = arr.length;
  goog.asserts.assert(n % 2 === 0);
  var i;
  for (i = 1; i < n; ++i) {
    goog.asserts.assert(arr[i] > arr[i - 1]);
  }
};


/**
 * FIXME empty description for jsdoc
 */
ol.structs.IntegerSet.prototype.clear = function() {
  this.arr_.length = 0;
};


/**
 * @private
 */
ol.structs.IntegerSet.prototype.compactRanges_ = function() {
  var arr = this.arr_;
  var n = arr.length;
  var rangeIndex = 0;
  var i;
  for (i = 0; i < n; i += 2) {
    if (arr[i] == arr[i + 1]) {
      // pass
    } else if (rangeIndex > 0 &&
               arr[rangeIndex - 2] <= arr[i] &&
               arr[i] <= arr[rangeIndex - 1]) {
      arr[rangeIndex - 1] = Math.max(arr[rangeIndex - 1], arr[i + 1]);
    } else {
      arr[rangeIndex++] = arr[i];
      arr[rangeIndex++] = arr[i + 1];
    }
  }
  arr.length = rangeIndex;
};


/**
 * Finds the start of smallest range that is at least of length minSize, or -1
 * if no such range exists.
 * @param {number} minSize Minimum size.
 * @return {number} Index.
 */
ol.structs.IntegerSet.prototype.findRange = function(minSize) {
  goog.asserts.assert(minSize > 0);
  var arr = this.arr_;
  var n = arr.length;
  var bestIndex = -1;
  var bestSize, i, size;
  for (i = 0; i < n; i += 2) {
    size = arr[i + 1] - arr[i];
    if (size == minSize) {
      return arr[i];
    } else if (size > minSize && (bestIndex == -1 || size < bestSize)) {
      bestIndex = arr[i];
      bestSize = size;
    }
  }
  return bestIndex;
};


/**
 * Calls f with each integer range.
 * @param {function(this: T, number, number)} f Callback.
 * @param {T=} opt_this The object to use as `this` in `f`.
 * @template T
 */
ol.structs.IntegerSet.prototype.forEachRange = function(f, opt_this) {
  var arr = this.arr_;
  var n = arr.length;
  var i;
  for (i = 0; i < n; i += 2) {
    f.call(opt_this, arr[i], arr[i + 1]);
  }
};


/**
 * Calls f with each integer range not in [start, stop) - 'this'.
 * @param {number} start Start.
 * @param {number} stop Stop.
 * @param {function(this: T, number, number)} f Callback.
 * @param {T=} opt_this The object to use as `this` in `f`.
 * @template T
 */
ol.structs.IntegerSet.prototype.forEachRangeInverted =
    function(start, stop, f, opt_this) {
  goog.asserts.assert(start < stop);
  var arr = this.arr_;
  var n = arr.length;
  if (n === 0) {
    f.call(opt_this, start, stop);
  } else {
    if (start < arr[0]) {
      f.call(opt_this, start, arr[0]);
    }
    var i;
    for (i = 1; i < n - 1; i += 2) {
      f.call(opt_this, arr[i], arr[i + 1]);
    }
    if (arr[n - 1] < stop) {
      f.call(opt_this, arr[n - 1], stop);
    }
  }
};


/**
 * @return {Array.<number>} Array.
 */
ol.structs.IntegerSet.prototype.getArray = function() {
  return this.arr_;
};


/**
 * Returns the first element in the set, or -1 if the set is empty.
 * @return {number} Start.
 */
ol.structs.IntegerSet.prototype.getFirst = function() {
  return this.arr_.length === 0 ? -1 : this.arr_[0];
};


/**
 * Returns the first integer after the last element in the set, or -1 if the
 * set is empty.
 * @return {number} Last.
 */
ol.structs.IntegerSet.prototype.getLast = function() {
  var n = this.arr_.length;
  return n === 0 ? -1 : this.arr_[n - 1];
};


/**
 * Returns the number of integers in the set.
 * @return {number} Size.
 */
ol.structs.IntegerSet.prototype.getSize = function() {
  var arr = this.arr_;
  var n = arr.length;
  var size = 0;
  var i;
  for (i = 0; i < n; i += 2) {
    size += arr[i + 1] - arr[i];
  }
  return size;
};


/**
 * @param {number} start Start.
 * @param {number} stop Stop.
 * @return {boolean} Intersects range.
 */
ol.structs.IntegerSet.prototype.intersectsRange = function(start, stop) {
  goog.asserts.assert(start <= stop);
  if (start == stop) {
    return false;
  } else {
    var arr = this.arr_;
    var n = arr.length;
    var i = 0;
    for (i = 0; i < n; i += 2) {
      if (arr[i] <= start && start < arr[i + 1] ||
          arr[i] < stop && stop - 1 < arr[i + 1] ||
          start < arr[i] && arr[i + 1] <= stop) {
        return true;
      }
    }
    return false;
  }
};


/**
 * @return {boolean} Is empty.
 */
ol.structs.IntegerSet.prototype.isEmpty = function() {
  return this.arr_.length === 0;
};


/**
 * @return {Array.<number>} Array.
 */
ol.structs.IntegerSet.prototype.pack = function() {
  return this.arr_;
};


/**
 * @param {number} removeStart Start.
 * @param {number} removeStop Stop.
 */
ol.structs.IntegerSet.prototype.removeRange =
    function(removeStart, removeStop) {
  // FIXME this could be more efficient
  goog.asserts.assert(removeStart <= removeStop);
  var arr = this.arr_;
  var n = arr.length;
  var i;
  for (i = 0; i < n; i += 2) {
    if (removeStop < arr[i] || arr[i + 1] < removeStart) {
      continue;
    } else if (arr[i] > removeStop) {
      break;
    }
    if (removeStart < arr[i]) {
      if (removeStop == arr[i]) {
        break;
      } else if (removeStop < arr[i + 1]) {
        arr[i] = Math.max(arr[i], removeStop);
        break;
      } else {
        arr.splice(i, 2);
        i -= 2;
        n -= 2;
      }
    } else if (removeStart == arr[i]) {
      if (removeStop < arr[i + 1]) {
        arr[i] = removeStop;
        break;
      } else if (removeStop == arr[i + 1]) {
        arr.splice(i, 2);
        break;
      } else {
        arr.splice(i, 2);
        i -= 2;
        n -= 2;
      }
    } else {
      if (removeStop < arr[i + 1]) {
        arr.splice(i, 2, arr[i], removeStart, removeStop, arr[i + 1]);
        break;
      } else if (removeStop == arr[i + 1]) {
        arr[i + 1] = removeStart;
        break;
      } else {
        arr[i + 1] = removeStart;
      }
    }
  }
  this.compactRanges_();
};


if (goog.DEBUG) {

  /**
   * @return {string} String.
   */
  ol.structs.IntegerSet.prototype.toString = function() {
    var arr = this.arr_;
    var n = arr.length;
    var result = new Array(n / 2);
    var resultIndex = 0;
    var i;
    for (i = 0; i < n; i += 2) {
      result[resultIndex++] = arr[i] + '-' + arr[i + 1];
    }
    return result.join(', ');
  };

}
