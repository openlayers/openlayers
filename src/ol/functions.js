goog.provide('ol.functions');

ol.functions.TRUE = function() {
  return true;
};

ol.functions.FALSE = function() {
  return false;
};

ol.functions.NULL = function() {
  return null;
}

/**
* @param {...Function} args A list of functions.
* @returns {function(...?):boolean} A function that ANDs its component functions.
*/
ol.functions.and = function(args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for (var i = 0; i < length; i++) {
      if (!functions[i].apply(this, arguments)) {
        return false;
      }
    }
    return true;
  };
};
