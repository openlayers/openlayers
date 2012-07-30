goog.provide('ol.array');

goog.require('goog.array');


/**
 * @param {Array.<number>} arr Array.
 * @param {number} target Target.
 * @return {number} Index.
 */
ol.array.binaryFindNearest = function(arr, target) {
  var index = goog.array.binarySearch(arr, target, function(a, b) {
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
 * @param {Array.<number>} arr Array.
 * @param {number} target Target.
 * @return {number} Index.
 */
ol.array.linearFindNearest = function(arr, target) {
  var n = arr.length;
  if (arr[0] <= target) {
    return 0;
  } else if (target <= arr[n - 1]) {
    return n - 1;
  } else {
    var i;
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
    return n - 1;
  }
};
