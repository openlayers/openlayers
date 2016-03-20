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
    // Guard against deoptimization with bound functions.
    var args = new Array(arguments.length);
    for (var k = 0; k < args.length; k++) {
      args[k] = arguments[k];
    }
    for (var i = 0; i < length; i++) {
      if (!functions[i].apply(this, args)) {
        return false;
      }
    }
    return true;
  };
};

/**
* @param {...Function} args A list of functions.
* @returns {!Function} A function that calls each of the functions.
*/
ol.functions.sequence = function(args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    // Guard against deoptimization with bound functions.
    var args = new Array(arguments.length);
    for (var k = 0; k < args.length; k++) {
      args[k] = arguments[k];
    }
    var result;
    for (var i = 0; i < length; i++) {
      result = functions[i].apply(this, args);
    }
    return result;
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
