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

/**
* @param {TEMPLATE=} arg Argument to be returned.
* @param {...*} opt_args Other arguments
* @returns {TEMPLATE} First argument that is returned.
* @template TEMPLATE
*/
ol.functions.identity = function(arg, opt_args) {
  return arg;
}
