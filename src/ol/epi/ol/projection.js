goog.provide('ol.Projection');



/**
 * @constructor
 */
ol.Projection = function() {

  /**
   * @private
   * @type {string=}
   */
  this.code_ = undefined;

};


/**
 * @return {string} Code.
 */
ol.Projection.prototype.getCode = function() {
  return this.code_;
};


/**
 * @param {string=} code Code.
 * @return {ol.Projection} This.
 */
ol.Projection.prototype.setCode = function(code) {
  this.code_ = code;
  return this;
};
