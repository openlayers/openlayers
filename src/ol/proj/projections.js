goog.provide('ol.proj.projections');


/**
 * @private
 * @type {Object.<string, ol.proj.Projection>}
 */
ol.proj.projections.cache_ = {};


/**
 * Clear the projections cache.
 */
ol.proj.projections.clear = function() {
  ol.proj.projections.cache_ = {};
};


/**
 * Get a cached projection by code.
 * @param {string} code The code for the projection.
 * @return {ol.proj.Projection} The projection (if cached).
 */
ol.proj.projections.get = function(code) {
  var projections = ol.proj.projections.cache_;
  return projections[code] || null;
};


/**
 * Add a projection to the cache.
 * @param {string} code The projection code.
 * @param {ol.proj.Projection} projection The projection to cache.
 */
ol.proj.projections.add = function(code, projection) {
  var projections = ol.proj.projections.cache_;
  projections[code] = projection;
};
