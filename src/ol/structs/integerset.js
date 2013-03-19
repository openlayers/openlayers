// FIXME refactor to use a packed array of integers to reduce GC load

goog.provide('ol.structs.IntegerRange');
goog.provide('ol.structs.IntegerSet');

goog.require('goog.array');
goog.require('goog.asserts');


/**
 * @typedef {{start: number, stop: number}}
 */
ol.structs.IntegerRange;


/**
 * @param {ol.structs.IntegerRange} range1 Range 1.
 * @param {ol.structs.IntegerRange} range2 Range 2.
 * @return {number} Compare.
 */
ol.structs.IntegerRange.compare = function(range1, range2) {
  return range1.start - range2.start || range1.stop - range2.stop;
};



/**
 * A set of integers represented as a set of integer ranges.
 * This implementation is designed for the case when the number of distinct
 * integer ranges is small.
 * @constructor
 * @param {Array.<ol.structs.IntegerRange>=} opt_ranges Ranges.
 */
ol.structs.IntegerSet = function(opt_ranges) {

  /**
   * @private
   * @type {Array.<number>}
   */
  this.ranges_ = goog.isDef(opt_ranges) ? opt_ranges : [];

  if (goog.DEBUG) {
    this.assertValid();
  }

};


/**
 * @param {Array.<number>} arr Array.
 * @return {ol.structs.IntegerSet} Integer set.
 */
ol.structs.IntegerSet.unpack = function(arr) {
  var n = arr.length;
  goog.asserts.assert(n % 2 === 0);
  var ranges = new Array(n / 2);
  var rangeIndex = 0;
  var i;
  for (i = 0; i < n; i += 2) {
    ranges[rangeIndex++] = {
      start: arr[i],
      stop: arr[i + 1]
    };
  }
  return new ol.structs.IntegerSet(ranges);
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
  var range = {start: addStart, stop: addStop};
  goog.array.binaryInsert(this.ranges_, range, ol.structs.IntegerRange.compare);
  this.compactRanges_();
};


/**
 * FIXME empty description for jsdoc
 */
ol.structs.IntegerSet.prototype.assertValid = function() {
  var arr = this.pack();
  for (i = 1; i < arr.length; ++i) {
    goog.asserts.assert(arr[i] > arr[i - 1]);
  }
};


/**
 * FIXME empty description for jsdoc
 */
ol.structs.IntegerSet.prototype.clear = function() {
  this.ranges_.length = 0;
};


/**
 * @private
 */
ol.structs.IntegerSet.prototype.compactRanges_ = function() {
  var ranges = this.ranges_;
  var n = ranges.length;
  var rangeIndex = 0;
  var lastRange = null;
  var i;
  for (i = 0; i < n; ++i) {
    var range = ranges[i];
    if (range.start == range.stop) {
      // pass
    } else if (!goog.isNull(lastRange) &&
               lastRange.start <= range.start &&
               range.start <= lastRange.stop) {
      lastRange.stop = Math.max(lastRange.stop, range.stop);
    } else {
      lastRange = ranges[rangeIndex++] = range;
    }
  }
  ranges.length = rangeIndex;
};


/**
 * Finds the start of smallest range that is at least of length minSize, or -1
 * if no such range exists.
 * @param {number} minSize Minimum size.
 * @return {number} Index.
 */
ol.structs.IntegerSet.prototype.findRange = function(minSize) {
  goog.asserts.assert(minSize > 0);
  var ranges = this.ranges_;
  var n = ranges.length;
  var bestRange = null;
  var bestSize, i, size;
  for (i = 0; i < n; ++i) {
    range = ranges[i];
    size = range.stop - range.start;
    if (size == minSize) {
      return range.start;
    } else if (size > minSize && (goog.isNull(bestRange) || size < bestSize)) {
      bestRange = range;
      bestSize = size;
    }
  }
  return goog.isNull(bestRange) ? -1 : bestRange.start;
};


/**
 * Calls f with each integer range.
 * @param {function(this: T, number, number)} f Callback.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
ol.structs.IntegerSet.prototype.forEachRange = function(f, opt_obj) {
  var ranges = this.ranges_;
  var n = ranges.length;
  var i;
  for (i = 0; i < n; ++i) {
    f.call(opt_obj, ranges[i].start, ranges[i].stop);
  }
};


/**
 * Calls f with each integer range not in [start, stop) - 'this'.
 * @param {number} start Start.
 * @param {number} stop Stop.
 * @param {function(this: T, number, number)} f Callback.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @template T
 */
ol.structs.IntegerSet.prototype.forEachRangeInverted =
    function(start, stop, f, opt_obj) {
  goog.asserts.assert(start < stop);
  var ranges = this.ranges_;
  var n = ranges.length;
  if (n === 0) {
    f.call(opt_obj, start, stop);
  } else {
    if (start < ranges[0].start) {
      f.call(opt_obj, start, ranges[0].start);
    }
    var i;
    for (i = 1; i < n; ++i) {
      f.call(opt_obj, ranges[i - 1].stop, ranges[i].start);
    }
    if (ranges[n - 1].stop < stop) {
      f.call(opt_obj, ranges[n - 1].stop, stop);
    }
  }
};


/**
 * @return {Array.<number>} Array.
 */
ol.structs.IntegerSet.prototype.getArray = function() {
  // FIXME this should return the underlying array when the representation is
  // FIXME updated to use a packed array
  return this.pack();
};


/**
 * Returns the first element in the set, or -1 if the set is empty.
 * @return {number} Start.
 */
ol.structs.IntegerSet.prototype.getFirst = function() {
  return this.ranges_.length === 0 ? -1 : this.ranges_[0].start;
};


/**
 * Returns the first integer after the last element in the set, or -1 if the
 * set is empty.
 * @return {number} Last.
 */
ol.structs.IntegerSet.prototype.getLast = function() {
  var n = this.ranges_.length;
  return n === 0 ? -1 : this.ranges_[n - 1].stop;
};


/**
 * @return {Array.<ol.structs.IntegerRange>} Array.
 */
ol.structs.IntegerSet.prototype.getRanges = function() {
  // FIXME this should be removed when the implementation is updated to use a
  // FIXME packed array
  return this.ranges_;
};


/**
 * Returns the number of integers in the set.
 * @return {number} Size.
 */
ol.structs.IntegerSet.prototype.getSize = function() {
  var ranges = this.ranges_;
  var n = ranges.length;
  var size = 0;
  for (i = 0; i < n; ++i) {
    size += ranges[i].stop - ranges[i].start;
  }
  return size;
};


/**
 * @return {boolean} Is empty.
 */
ol.structs.IntegerSet.prototype.isEmpty = function() {
  return this.ranges_.length === 0;
};


/**
 * @return {Array.<number>} Array.
 */
ol.structs.IntegerSet.prototype.pack = function() {
  var ranges = this.ranges_;
  var n = ranges.length;
  var arr = new Array(2 * n);
  var i;
  for (i = 0; i < n; ++i) {
    arr[2 * i] = ranges[i].start;
    arr[2 * i + 1] = ranges[i].stop;
  }
  return arr;
};


/**
 * @param {number} removeStart Start.
 * @param {number} removeStop Stop.
 */
ol.structs.IntegerSet.prototype.removeRange =
    function(removeStart, removeStop) {
  // FIXME this could be more efficient
  goog.asserts.assert(removeStart <= removeStop);
  var ranges = this.ranges_;
  var n = ranges.length;
  for (i = 0; i < n; ++i) {
    var range = ranges[i];
    if (removeStop < range.start || range.stop < removeStart) {
      continue;
    } else if (range.start > removeStop) {
      break;
    }
    if (removeStart < range.start) {
      if (removeStop == range.start) {
        break;
      } else if (removeStop < range.stop) {
        range.start = Math.max(range.start, removeStop);
        break;
      } else {
        ranges.splice(i, 1);
        --i;
        --n;
      }
    } else if (removeStart == range.start) {
      if (removeStop < range.stop) {
        range.start = removeStop;
        break;
      } else if (removeStop == range.stop) {
        ranges.splice(i, 1);
        break;
      } else {
        ranges.splice(i, 1);
        --i;
        --n;
      }
    } else {
      if (removeStop < range.stop) {
        ranges.splice(i, 1, {start: range.start, stop: removeStart},
            {start: removeStop, stop: range.stop});
        break;
      } else if (removeStop == range.stop) {
        range.stop = removeStart;
        break;
      } else {
        range.stop = removeStart;
      }
    }
  }
  this.compactRanges_();
};
