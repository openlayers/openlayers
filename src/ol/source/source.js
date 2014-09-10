goog.provide('ol.source.Source');
goog.provide('ol.source.State');

goog.require('goog.events.EventType');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Observable');
goog.require('ol.proj');


/**
 * State of the source, one of 'loading', 'ready' or 'error'.
 * @enum {string}
 * @api
 */
ol.source.State = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error'
};


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            logo: (string|olx.LogoOptions|undefined),
 *            projection: ol.proj.ProjectionLike,
 *            state: (ol.source.State|undefined)}}
 */
ol.source.SourceOptions;



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for {@link ol.layer.Layer} sources.
 *
 * @constructor
 * @extends {ol.Observable}
 * @fires change Triggered when the state of the source changes.
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
   * @type {Array.<ol.Attribution>}
   */
  this.attributions_ = goog.isDef(options.attributions) ?
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
  this.state_ = goog.isDef(options.state) ?
      options.state : ol.source.State.READY;

};
goog.inherits(ol.source.Source, ol.Observable);


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {Object.<string, boolean>} skippedFeatureUids Skipped feature uids.
 * @param {function(ol.Feature): T} callback Feature callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.source.Source.prototype.forEachFeatureAtPixel =
    goog.nullFunction;


/**
 * @return {Array.<ol.Attribution>} Attributions.
 * @api stable
 */
ol.source.Source.prototype.getAttributions = function() {
  return this.attributions_;
};


/**
 * @return {string|olx.LogoOptions|undefined} Logo.
 * @api stable
 */
ol.source.Source.prototype.getLogo = function() {
  return this.logo_;
};


/**
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
 * @return {ol.source.State} State.
 * @api
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
 * @param {string|olx.LogoOptions|undefined} logo Logo.
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
