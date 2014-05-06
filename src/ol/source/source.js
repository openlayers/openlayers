goog.provide('ol.source.Source');
goog.provide('ol.source.State');

goog.require('goog.events.EventType');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Observable');
goog.require('ol.proj');


/**
 * @enum {number}
 */
ol.source.State = {
  LOADING: 0,
  READY: 1,
  ERROR: 2
};


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            extent: (ol.Extent|undefined),
 *            logo: (string|undefined),
 *            projection: ol.proj.ProjectionLike,
 *            state: (ol.source.State|string|undefined)}}
 */
ol.source.SourceOptions;



/**
 * @constructor
 * @extends {ol.Observable}
 * @param {ol.source.SourceOptions} options Source options.
 */
ol.source.Source = function(options) {

  goog.base(this);

  /**
   * @private
   * @type {ol.proj.Projection}
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

  /**
   * @private
   * @type {ol.source.State}
   */
  this.state_ = goog.isDef(options.state) ?
      /** @type {ol.source.State} */ (options.state) : ol.source.State.READY;

};
goog.inherits(ol.source.Source, ol.Observable);


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {function(ol.Feature): T} callback Feature callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.source.Source.prototype.forEachFeatureAtPixel =
    goog.nullFunction;


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
 * @return {ol.proj.Projection} Projection.
 */
ol.source.Source.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * @return {Array.<number>|undefined} Resolutions.
 */
ol.source.Source.prototype.getResolutions = goog.abstractMethod;


/**
 * @return {ol.source.State} State.
 * @todo api
 */
ol.source.Source.prototype.getState = function() {
  return this.state_;
};


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
 * @param {ol.source.State} state State.
 * @protected
 */
ol.source.Source.prototype.setState = function(state) {
  this.state_ = state;
  this.dispatchChangeEvent();
};


/**
 * @param {ol.proj.Projection} projection Projetion.
 */
ol.source.Source.prototype.setProjection = function(projection) {
  this.projection_ = projection;
};
