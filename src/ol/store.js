goog.provide('ol.Source');

goog.require('goog.functions');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Projection');



/**
 * @constructor
 * @param {ol.Projection} projection Projection.
 * @param {ol.Extent=} opt_extent Extent.
 * @param {Array.<ol.Attribution>=} opt_attributions Attributions.
 */
ol.Source = function(projection, opt_extent, opt_attributions) {

  /**
   * @private
   * @type {ol.Projection}
   */
  this.projection_ = projection;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = opt_extent || projection.getExtent();

  /**
   * @private
   * @type {Array.<ol.Attribution>}
   */
  this.attributions_ = opt_attributions || null;

};


/**
 * @return {Array.<ol.Attribution>} Attributions.
 */
ol.Source.prototype.getAttributions = function() {
  return this.attributions_;
};


/**
 * @return {ol.Extent} Extent.
 */
ol.Source.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @return {ol.Projection} Projection.
 */
ol.Source.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * @return {Array.<number>|undefined} Resolutions.
 */
ol.Source.prototype.getResolutions = goog.abstractMethod;


/**
 * @return {boolean} Is ready.
 */
ol.Source.prototype.isReady = goog.functions.TRUE;


/**
 * @param {Array.<ol.Attribution>} attributions Attributions.
 */
ol.Source.prototype.setAttributions = function(attributions) {
  this.attributions_ = attributions;
};


/**
 * @param {ol.Extent} extent Extent.
 */
ol.Source.prototype.setExtent = function(extent) {
  this.extent_ = extent;
};


/**
 * @param {ol.Projection} projection Projetion.
 */
ol.Source.prototype.setProjection = function(projection) {
  this.projection_ = projection;
};
