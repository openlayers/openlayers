goog.provide('ol.source.Source');
goog.provide('ol.source.State');

goog.require('ol');
goog.require('ol.Attribution');
goog.require('ol.Object');
goog.require('ol.proj');


/**
 * State of the source, one of 'undefined', 'loading', 'ready' or 'error'.
 * @enum {string}
 * @api
 */
ol.source.State = {
  UNDEFINED: 'undefined',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error'
};


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            logo: (string|olx.LogoOptions|undefined),
 *            projection: ol.proj.ProjectionLike,
 *            state: (ol.source.State|undefined),
 *            wrapX: (boolean|undefined)}}
 */
ol.source.SourceOptions;



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for {@link ol.layer.Layer} sources.
 *
 * A generic `change` event is triggered when the state of the source changes.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {ol.source.SourceOptions} options Source options.
 * @api stable
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
   * @type {Array.<ol.Attribution>}
   */
  this.attributions_ = options.attributions !== undefined ?
      options.attributions : null;

  /**
   * @private
   * @type {string|olx.LogoOptions|undefined}
   */
  this.logo_ = options.logo;

  /**
   * @private
   * @type {ol.source.State}
   */
  this.state_ = options.state !== undefined ?
      options.state : ol.source.State.READY;

  /**
   * @private
   * @type {boolean}
   */
  this.wrapX_ = options.wrapX !== undefined ? options.wrapX : false;

};
goog.inherits(ol.source.Source, ol.Object);


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {Object.<string, boolean>} skippedFeatureUids Skipped feature uids.
 * @param {function((ol.Feature|ol.render.Feature)): T} callback Feature
 *     callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.source.Source.prototype.forEachFeatureAtCoordinate = ol.nullFunction;


/**
 * Get the attributions of the source.
 * @return {Array.<ol.Attribution>} Attributions.
 * @api stable
 */
ol.source.Source.prototype.getAttributions = function() {
  return this.attributions_;
};


/**
 * Get the logo of the source.
 * @return {string|olx.LogoOptions|undefined} Logo.
 * @api stable
 */
ol.source.Source.prototype.getLogo = function() {
  return this.logo_;
};


/**
 * Get the projection of the source.
 * @return {ol.proj.Projection} Projection.
 * @api
 */
ol.source.Source.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * @return {Array.<number>|undefined} Resolutions.
 */
ol.source.Source.prototype.getResolutions = goog.abstractMethod;


/**
 * Get the state of the source, see {@link ol.source.State} for possible states.
 * @return {ol.source.State} State.
 * @api
 */
ol.source.Source.prototype.getState = function() {
  return this.state_;
};


/**
 * @return {boolean|undefined} Wrap X.
 */
ol.source.Source.prototype.getWrapX = function() {
  return this.wrapX_;
};


/**
 * Set the attributions of the source.
 * @param {Array.<ol.Attribution>} attributions Attributions.
 * @api
 */
ol.source.Source.prototype.setAttributions = function(attributions) {
  this.attributions_ = attributions;
  this.changed();
};


/**
 * Set the logo of the source.
 * @param {string|olx.LogoOptions|undefined} logo Logo.
 */
ol.source.Source.prototype.setLogo = function(logo) {
  this.logo_ = logo;
};


/**
 * Set the state of the source.
 * @param {ol.source.State} state State.
 * @protected
 */
ol.source.Source.prototype.setState = function(state) {
  this.state_ = state;
  this.changed();
};


/**
 * Set the projection of the source.
 * @param {ol.proj.Projection} projection Projection.
 */
ol.source.Source.prototype.setProjection = function(projection) {
  this.projection_ = projection;
};
