var _ol_proj_proj4_ = {};


/**
 * @private
 * @type {Proj4}
 */
_ol_proj_proj4_.cache_ = null;


/**
 * Store the proj4 function.
 * @param {Proj4} proj4 The proj4 function.
 */
_ol_proj_proj4_.set = function(proj4) {
  _ol_proj_proj4_.cache_ = proj4;
};


/**
 * Get proj4.
 * @return {Proj4} The proj4 function set above or available globally.
 */
_ol_proj_proj4_.get = function() {
  return _ol_proj_proj4_.cache_ || window['proj4'];
};
export default _ol_proj_proj4_;
