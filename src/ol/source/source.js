goog.provide('ol.source.Source');

goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.proj');



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {ol.source.SourceOptions} options Source options.
 */
ol.source.Source = function(options) {

  goog.base(this);

  /**
   * @private
   * @type {ol.Projection}
   */
  this.projection_ = ol.proj.get(options.projection);

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = goog.isDef(options.extent) ?
      options.extent : goog.isDef(options.projection) ?
          this.projection_.getExtent() : null;

  /**
   * @private
   * @type {Array.<ol.Attribution>}
   */
  this.attributions_ = goog.isDef(options.attributions) ?
      options.attributions : null;

  /**
   * @private
   * @type {string|undefined}
   */
  this.logo_ = options.logo;

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
 * @return {string|undefined} Logo.
 */
ol.source.Source.prototype.getLogo = function() {
  return this.logo_;
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
 * @param {string|undefined} logo Logo.
 */
ol.source.Source.prototype.setLogo = function(logo) {
  this.logo_ = logo;
};


/**
 * @param {ol.Projection} projection Projetion.
 */
ol.source.Source.prototype.setProjection = function(projection) {
  this.projection_ = projection;
};
