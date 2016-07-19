goog.provide('ol.source.Source');
goog.provide('ol.source.State');

goog.require('ol');
goog.require('ol.Attribution');
goog.require('ol.Object');
goog.require('ol.proj');


/**
 * State of the source, one of 'undefined', 'loading', 'ready' or 'error'.
 * @enum {string}
 */
ol.source.State = {
  UNDEFINED: 'undefined',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error'
};


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
 * @param {ol.SourceSourceOptions} options Source options.
 * @api stable
 */
ol.source.Source = function(options) {

  ol.Object.call(this);

  /**
   * @private
   * @type {ol.proj.Projection}
   */
  this.projection_ = ol.proj.get(options.projection);

  /**
   * @private
   * @type {Array.<ol.Attribution>}
   */
  this.attributions_ = ol.source.Source.toAttributionsArray_(options.attributions);

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
ol.inherits(ol.source.Source, ol.Object);

/**
 * Turns various ways of defining an attribution to an array of `ol.Attributions`.
 *
 * @param {ol.AttributionLike|undefined}
 *     attributionLike The attributions as string, array of strings,
 *     `ol.Attribution`, array of `ol.Attribution` or undefined.
 * @return {Array.<ol.Attribution>} The array of `ol.Attribution` or null if
 *     `undefined` was given.
 */
ol.source.Source.toAttributionsArray_ = function(attributionLike) {
  if (typeof attributionLike === 'string') {
    return [new ol.Attribution({html: attributionLike})];
  } else if (attributionLike instanceof ol.Attribution) {
    return [attributionLike];
  } else if (Array.isArray(attributionLike)) {
    var len = attributionLike.length;
    var attributions = new Array(len);
    for (var i = 0; i < len; i++) {
      var item = attributionLike[i];
      if (typeof item === 'string') {
        attributions[i] = new ol.Attribution({html: item});
      } else {
        attributions[i] = item;
      }
    }
    return attributions;
  } else {
    return null;
  }
};


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
 * @abstract
 * @return {Array.<number>|undefined} Resolutions.
 */
ol.source.Source.prototype.getResolutions = function() {};


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
 * Refreshes the source and finally dispatches a 'change' event.
 * @api
 */
ol.source.Source.prototype.refresh = function() {
  this.changed();
};


/**
 * Set the attributions of the source.
 * @param {ol.AttributionLike|undefined} attributions Attributions.
 *     Can be passed as `string`, `Array<string>`, `{@link ol.Attribution}`,
 *     `Array<{@link ol.Attribution}>` or `undefined`.
 * @api
 */
ol.source.Source.prototype.setAttributions = function(attributions) {
  this.attributions_ = ol.source.Source.toAttributionsArray_(attributions);
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
