goog.provide('ol3.Store');

goog.require('goog.functions');
goog.require('ol3.Attribution');
goog.require('ol3.Extent');
goog.require('ol3.Projection');



/**
 * @constructor
 * @param {ol3.Projection} projection Projection.
 * @param {ol3.Extent=} opt_extent Extent.
 * @param {Array.<ol3.Attribution>=} opt_attributions Attributions.
 */
ol3.Store = function(projection, opt_extent, opt_attributions) {

  /**
   * @private
   * @type {ol3.Projection}
   */
  this.projection_ = projection;

  /**
   * @private
   * @type {ol3.Extent}
   */
  this.extent_ = opt_extent || projection.getExtent();

  /**
   * @private
   * @type {Array.<ol3.Attribution>}
   */
  this.attributions_ = opt_attributions || null;

};


/**
 * @return {Array.<ol3.Attribution>} Attributions.
 */
ol3.Store.prototype.getAttributions = function() {
  return this.attributions_;
};


/**
 * @return {ol3.Extent} Extent.
 */
ol3.Store.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @return {ol3.Projection} Projection.
 */
ol3.Store.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * @return {Array.<number>|undefined} Resolutions.
 */
ol3.Store.prototype.getResolutions = goog.abstractMethod;


/**
 * @return {boolean} Is ready.
 */
ol3.Store.prototype.isReady = goog.functions.TRUE;


/**
 * @param {Array.<ol3.Attribution>} attributions Attributions.
 */
ol3.Store.prototype.setAttributions = function(attributions) {
  this.attributions_ = attributions;
};


/**
 * @param {ol3.Extent} extent Extent.
 */
ol3.Store.prototype.setExtent = function(extent) {
  this.extent_ = extent;
};


/**
 * @param {ol3.Projection} projection Projetion.
 */
ol3.Store.prototype.setProjection = function(projection) {
  this.projection_ = projection;
};
