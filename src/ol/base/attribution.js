goog.provide('ol.Attribution');

goog.require('ol.CoverageArea');
goog.require('ol.Projection');



/**
 * @constructor
 * @param {string} html HTML.
 * @param {Array.<ol.CoverageArea>=} opt_coverageAreas Coverage areas.
 * @param {ol.Projection=} opt_projection Projection.
 */
ol.Attribution = function(html, opt_coverageAreas, opt_projection) {

  /**
   * @private
   * @type {string}
   */
  this.html_ = html;

  /**
   * @private
   * @type {Array.<ol.CoverageArea>}
   */
  this.coverageAreas_ =
      goog.isDef(opt_coverageAreas) ? opt_coverageAreas : null;

  /**
   * @private
   * @type {ol.Projection}
   */
  this.projection_ = goog.isDef(opt_projection) ? opt_projection : null;

};


/**
 * @return {Array.<ol.CoverageArea>} Coverage areas.
 */
ol.Attribution.prototype.getCoverageAreas = function() {
  return this.coverageAreas_;
};


/**
 * @return {string} HTML.
 */
ol.Attribution.prototype.getHtml = function() {
  return this.html_;
};


/**
 * @return {ol.Projection} Projection.
 */
ol.Attribution.prototype.getProjection = function() {
  return this.projection_;
};
