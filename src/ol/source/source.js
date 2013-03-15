goog.provide('ol.source.Source');

goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.projection');



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {ol.source.SourceOptions} sourceOptions Source options.
 */
ol.source.Source = function(sourceOptions) {

  goog.base(this);

  /**
   * @private
   * @type {ol.Projection}
   */
  this.projection_ = ol.projection.get(sourceOptions.projection);

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = goog.isDef(sourceOptions.extent) ?
      sourceOptions.extent : goog.isDef(sourceOptions.projection) ?
          this.projection_.getExtent() : null;

  /**
   * @private
   * @type {Array.<ol.Attribution>}
   */
  this.attributions_ = goog.isDef(sourceOptions.attributions) ?
      sourceOptions.attributions : null;

};
goog.inherits(ol.source.Source, goog.events.EventTarget);


/**
 * @protected
 */
ol.source.Source.prototype.dispatchLoadEvent = function() {
  this.dispatchEvent(goog.events.EventType.LOAD);
};


/**
 * @return {Array.<ol.Attribution>} Attributions.
 */
ol.source.Source.prototype.getAttributions = function() {
  return this.attributions_;
};


/**
 * @return {ol.Extent} Extent.
 */
ol.source.Source.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @return {ol.Projection} Projection.
 */
ol.source.Source.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * @return {Array.<number>|undefined} Resolutions.
 */
ol.source.Source.prototype.getResolutions = goog.abstractMethod;


/**
 * @return {boolean} Is ready.
 */
ol.source.Source.prototype.isReady = goog.functions.TRUE;


/**
 * @param {Array.<ol.Attribution>} attributions Attributions.
 */
ol.source.Source.prototype.setAttributions = function(attributions) {
  this.attributions_ = attributions;
};


/**
 * @param {ol.Extent} extent Extent.
 */
ol.source.Source.prototype.setExtent = function(extent) {
  this.extent_ = extent;
};


/**
 * @param {ol.Projection} projection Projetion.
 */
ol.source.Source.prototype.setProjection = function(projection) {
  this.projection_ = projection;
};
