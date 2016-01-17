goog.provide('ol.array');

goog.require('goog.array');
goog.require('goog.asserts');


/**
 * @param {Array.<number>} arr Array.
 * @param {number} target Target.
 * @return {number} Index.
 */
ol.array.binaryFindNearest = function(arr, target) {
  var index = goog.array.binarySearch(arr, target,
      /**
       * @param {number} a A.
       * @param {number} b B.
       * @return {number} b minus a.
       */
      function(a, b) {
        return b - a;
      });
  if (index >= 0) {
    return index;
  } else if (index == -1) {
    return 0;
  } else if (index == -arr.length - 1) {
    return arr.length - 1;
  } else {
    var left = -index - 2;
    var right = -index - 1;
    if (arr[left] - target < target - arr[right]) {
      return left;
    } else {
      return right;
    }
  }
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
    // We should never get here, but the compiler complains
    // if it finds a path for which no number is returned.
    goog.asserts.fail();
    return n - 1;
  }
};


/**
 * @param {Array.<*>} arr Array.
 * @param {number} begin Begin index.
 * @param {number} end End index.
 */
ol.array.reverseSubArray = function(arr, begin, end) {
  goog.asserts.assert(begin >= 0,
      'Array begin index should be equal to or greater than 0');
  goog.asserts.assert(end < arr.length,
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
 * @return {!Array<?>} Flattened Array.
 */
ol.array.flatten = function(arr) {
  var data = arr.reduce(function(flattened, value) {
    if (goog.isArray(value)) {
      return flattened.concat(ol.array.flatten(value));
    } else {
      return flattened.concat(value);
    }
  }, []);
  return data;
};


// TODO: Optimisation by storing length or iterating backwards etc
/**
 * @param {Array<VALUE>} arr  The array to modify.
 * @param {Array<VALUE>|VALUE} data The elements or arrays of elements
 *     to add to arr1.
 * @template VALUE
 */
ol.array.extend = function(arr, data) {
  var i;
  var extension = goog.isArrayLike(data) ? data : [data];
  for (i = 0; i < extension.length; i++) {
    arr[arr.length] = extension[i];
  }
}


/**
 * @param {Array<VALUE>} arr  The array to modify.
 * @param {VALUE} obj The element to remove.
 * @template VALUE
 * @return {boolean} If the element was removed.
 */
ol.array.remove = function(arr, obj) {
  var i = arr.indexOf(obj);
  if (i > -1) {
    arr.splice(i, 1);
  }
  return i > -1;
}


/**
 * @param {Array<VALUE>} arr  The array to modify.
 * @param {?function(this:THISVAL, VALUE, number, ?) : boolean} func The function to compare.
 * @param {THISVAL=} thisArg Optional this argument for the function.
 * @template VALUE,THISVAL
 * @return {VALUE} If the element was removed.
 */
ol.array.find = function(arr, func, thisArg) {
  if (typeof func !== 'function') {
    throw new TypeError('func must be a function');
  }
  var list = Object(arr);
  var length = list.length >>> 0;
  var value;

  for (var i = 0; i < length; i++) {
    value = list[i];
    if (func.call(thisArg, value, i, list)) {
      return value;
    }
  }
  return null;
}
