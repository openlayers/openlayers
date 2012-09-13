goog.provide('ol3.Attribution');

goog.require('ol3.CoverageArea');
goog.require('ol3.Projection');



/**
 * @constructor
 * @param {string} html HTML.
 * @param {Array.<ol3.CoverageArea>=} opt_coverageAreas Coverage areas.
 * @param {ol3.Projection=} opt_projection Projection.
 */
ol3.Attribution = function(html, opt_coverageAreas, opt_projection) {

  /**
   * @private
   * @type {string}
   */
  this.html_ = html;

  /**
   * @private
   * @type {Array.<ol3.CoverageArea>}
   */
  this.coverageAreas_ = opt_coverageAreas || null;

  /**
   * @private
   * @type {ol3.Projection}
   */
  this.projection_ = opt_projection || null;

};


/**
 * @return {Array.<ol3.CoverageArea>} Coverage areas.
 */
ol3.Attribution.prototype.getCoverageAreas = function() {
  return this.coverageAreas_;
};


/**
 * @return {string} HTML.
 */
ol3.Attribution.prototype.getHtml = function() {
  return this.html_;
};


/**
 * @return {ol3.Projection} Projection.
 */
ol3.Attribution.prototype.getProjection = function() {
  return this.projection_;
};
