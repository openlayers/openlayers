import _ol_functions_ from '../functions';

/**
 * @constructor
 * @abstract
 * @param {string} source Source.
 * @struct
 */
var _ol_webgl_Shader_ = function(source) {

  /**
   * @private
   * @type {string}
   */
  this.source_ = source;

};


/**
 * @abstract
 * @return {number} Type.
 */
_ol_webgl_Shader_.prototype.getType = function() {};


/**
 * @return {string} Source.
 */
_ol_webgl_Shader_.prototype.getSource = function() {
  return this.source_;
};


/**
 * @return {boolean} Is animated?
 */
_ol_webgl_Shader_.prototype.isAnimated = _ol_functions_.FALSE;
export default _ol_webgl_Shader_;
