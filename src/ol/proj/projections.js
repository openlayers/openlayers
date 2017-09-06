var _ol_proj_projections_ = {};


/**
 * @private
 * @type {Object.<string, ol.proj.Projection>}
 */
_ol_proj_projections_.cache_ = {};


/**
 * Clear the projections cache.
 */
_ol_proj_projections_.clear = function() {
  _ol_proj_projections_.cache_ = {};
};


/**
 * Get a cached projection by code.
 * @param {string} code The code for the projection.
 * @return {ol.proj.Projection} The projection (if cached).
 */
_ol_proj_projections_.get = function(code) {
  var projections = _ol_proj_projections_.cache_;
  return projections[code] || null;
};


/**
 * Add a projection to the cache.
 * @param {string} code The projection code.
 * @param {ol.proj.Projection} projection The projection to cache.
 */
_ol_proj_projections_.add = function(code, projection) {
  var projections = _ol_proj_projections_.cache_;
  projections[code] = projection;
};
export default _ol_proj_projections_;
