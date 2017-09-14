goog.provide('ol.proj.proj4');


/**
 * @private
 * @type {Proj4}
 */
ol.proj.proj4.cache_ = null;


/**
 * Store the proj4 function.
 * @param {Proj4} proj4 The proj4 function.
 */
ol.proj.proj4.set = function(proj4) {
  ol.proj.proj4.cache_ = proj4;
};


/**
 * Get proj4.
 * @return {Proj4} The proj4 function set above or available globally.
 */
ol.proj.proj4.get = function() {
  return ol.proj.proj4.cache_ || window['proj4'];
};
