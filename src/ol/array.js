goog.provide('ol.array');

goog.require('ol');


/**
 * Performs a binary search on the provided sorted list and returns the index of the item if found. If it can't be found it'll return -1.
 * https://github.com/darkskyapp/binary-search
 *
 * @param {Array.<*>} haystack Items to search through.
 * @param {*} needle The item to look for.
 * @param {Function=} opt_comparator Comparator function.
 * @return {number} The index of the item if found, -1 if not.
 */
ol.array.binarySearch = function(haystack, needle, opt_comparator) {
  var mid, cmp;
  var comparator = opt_comparator || ol.array.numberSafeCompareFunction;
  var low = 0;
  var high = haystack.length;
  var found = false;

  while (low < high) {
    /* Note that "(low + high) >>> 1" may overflow, and results in a typecast
     * to double (which gives the wrong results). */
    mid = low + (high - low >> 1);
    cmp = +comparator(haystack[mid], needle);

    if (cmp < 0.0) { /* Too low. */
      low  = mid + 1;

    } else { /* Key found or too high */
      high = mid;
      found = !cmp;
    }
  }

  /* Key not found. */
  return found ? low : ~low;
};


/**
 * Compare function for array sort that is safe for numbers.
 * @param {*} a The first object to be compared.
 * @param {*} b The second object to be compared.
 * @return {number} A negative number, zero, or a positive number as the first
 *     argument is less than, equal to, or greater than the second.
 */
ol.array.numberSafeCompareFunction = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};


/**
 * Whether the array contains the given object.
 * @param {Array.<*>} arr The array to test for the presence of the element.
 * @param {*} obj The object for which to test.
 * @return {boolean} The object is in the array.
 */
ol.array.includes = function(arr, obj) {
  return arr.indexOf(obj) >= 0;
};


/**
 * @param {Array.<number>} arr Array.
 * @param {number} target Target.
 * @param {number} direction 0 means return the nearest, > 0
 *    means return the largest nearest, < 0 means return the
 *    smallest nearest.
 * @return {number} Index.
 */
ol.array.linearFindNearest = function(arr, target, direction) {
  var n = arr.length;
  if (arr[0] <= target) {
    return 0;
  } else if (target <= arr[n - 1]) {
    return n - 1;
  } else {
    var i;
    if (direction > 0) {
      for (i = 1; i < n; ++i) {
        if (arr[i] < target) {
          return i - 1;
        }
      }
    } else if (direction < 0) {
      for (i = 1; i < n; ++i) {
        if (arr[i] <= target) {
          return i;
        }
      }
    } else {
      for (i = 1; i < n; ++i) {
        if (arr[i] == target) {
          return i;
        } else if (arr[i] < target) {
          if (arr[i - 1] - target < target - arr[i]) {
            return i - 1;
          } else {
            return i;
          }
        }
      }
    }
    return n - 1;
  }
};


/**
 * @param {Array.<*>} arr Array.
 * @param {number} begin Begin index.
 * @param {number} end End index.
 */
ol.array.reverseSubArray = function(arr, begin, end) {
  ol.DEBUG && console.assert(begin >= 0,
      'Array begin index should be equal to or greater than 0');
  ol.DEBUG && console.assert(end < arr.length,
      'Array end index should be less than the array length');
  while (begin < end) {
    var tmp = arr[begin];
    arr[begin] = arr[end];
    arr[end] = tmp;
    ++begin;
    --end;
  }
};


/**
 * @param {Array.<*>} arr Array.
 * @return {!Array.<?>} Flattened Array.
 */
ol.array.flatten = function(arr) {
  var data = arr.reduce(function(flattened, value) {
    if (Array.isArray(value)) {
      return flattened.concat(ol.array.flatten(value));
    } else {
      return flattened.concat(value);
    }
  }, []);
  return data;
};


/**
 * @param {Array.<VALUE>} arr The array to modify.
 * @param {Array.<VALUE>|VALUE} data The elements or arrays of elements
 *     to add to arr.
 * @template VALUE
 */
ol.array.extend = function(arr, data) {
  var i;
  var extension = Array.isArray(data) ? data : [data];
  var length = extension.length;
  for (i = 0; i < length; i++) {
    arr[arr.length] = extension[i];
  }
};


/**
 * @param {Array.<VALUE>} arr The array to modify.
 * @param {VALUE} obj The element to remove.
 * @template VALUE
 * @return {boolean} If the element was removed.
 */
ol.array.remove = function(arr, obj) {
  var i = arr.indexOf(obj);
  var found = i > -1;
  if (found) {
    arr.splice(i, 1);
  }
  return found;
};


/**
 * @param {Array.<VALUE>} arr The array to search in.
 * @param {function(VALUE, number, ?) : boolean} func The function to compare.
 * @template VALUE
 * @return {VALUE} The element found.
 */
ol.array.find = function(arr, func) {
  var length = arr.length >>> 0;
  var value;

  for (var i = 0; i < length; i++) {
    value = arr[i];
    if (func(value, i, arr)) {
      return value;
    }
  }
  return null;
};


/**
 * @param {Array|Uint8ClampedArray} arr1 The first array to compare.
 * @param {Array|Uint8ClampedArray} arr2 The second array to compare.
 * @return {boolean} Whether the two arrays are equal.
 */
ol.array.equals = function(arr1, arr2) {
  var len1 = arr1.length;
  if (len1 !== arr2.length) {
    return false;
  }
  for (var i = 0; i < len1; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
};


/**
 * @param {Array.<*>} arr The array to sort (modifies original).
 * @param {Function} compareFnc Comparison function.
 */
ol.array.stableSort = function(arr, compareFnc) {
  var length = arr.length;
  var tmp = Array(arr.length);
  var i;
  for (i = 0; i < length; i++) {
    tmp[i] = {index: i, value: arr[i]};
  }
  tmp.sort(function(a, b) {
    return compareFnc(a.value, b.value) || a.index - b.index;
  });
  for (i = 0; i < arr.length; i++) {
    arr[i] = tmp[i].value;
  }
};


/**
 * @param {Array.<*>} arr The array to search in.
 * @param {Function} func Comparison function.
 * @return {number} Return index.
 */
ol.array.findIndex = function(arr, func) {
  var index;
  var found = !arr.every(function(el, idx) {
    index = idx;
    return !func(el, idx, arr);
  });
  return found ? index : -1;
};


/**
 * @param {Array.<*>} arr The array to test.
 * @param {Function=} opt_func Comparison function.
 * @param {boolean=} opt_strict Strictly sorted (default false).
 * @return {boolean} Return index.
 */
ol.array.isSorted = function(arr, opt_func, opt_strict) {
  var compare = opt_func || ol.array.numberSafeCompareFunction;
  return arr.every(function(currentVal, index) {
    if (index === 0) {
      return true;
    }
    var res = compare(arr[index - 1], currentVal);
    return !(res > 0 || opt_strict && res === 0);
  });
};
