goog.provide('ol.source.Source');

goog.require('ol');
goog.require('ol.Attribution');
goog.require('ol.Object');
goog.require('ol.proj');
goog.require('ol.source.State');


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for {@link ol.layer.Layer} sources.
 *
 * A generic `change` event is triggered when the state of the source changes.
 *
 * @constructor
 * @abstract
 * @extends {ol.Object}
 * @param {ol.SourceSourceOptions} options Source options.
 * @api
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
  this.attributions_ = null;

  /**
   * @private
   * @type {?ol.Attribution2}
   */
  this.attributions2_ = this.adaptAttributions_(options.attributions);

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
 * Turns the attributions option into an attributions function.
 * @suppress {deprecated}
 * @param {ol.AttributionLike|undefined} attributionLike The attribution option.
 * @return {?ol.Attribution2} An attribution function (or null).
 */
ol.source.Source.prototype.adaptAttributions_ = function(attributionLike) {
  if (!attributionLike) {
    return null;
  }
  if (attributionLike instanceof ol.Attribution) {

    // TODO: remove attributions_ in next major release
    this.attributions_ = [attributionLike];

    return function(frameState) {
      return [attributionLike.getHTML()];
    };
  }
  if (Array.isArray(attributionLike)) {
    if (attributionLike[0] instanceof ol.Attribution) {

      // TODO: remove attributions_ in next major release
      this.attributions_ = attributionLike;

      var attributions = attributionLike.map(function(attribution) {
        return attribution.getHTML();
      });
      return function(frameState) {
        return attributions;
      };
    }

    // TODO: remove attributions_ in next major release
    this.attributions_ = attributionLike.map(function(attribution) {
      return new ol.Attribution({html: attribution});
    });

    return function(frameState) {
      return attributionLike;
    };
  }

  if (typeof attributionLike === 'function') {
    return attributionLike;
  }

  // TODO: remove attributions_ in next major release
  this.attributions_ = [
    new ol.Attribution({html: attributionLike})
  ];

  return function(frameState) {
    return [attributionLike];
  };
};

/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {number} hitTolerance Hit tolerance in pixels.
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
 * @api
 */
ol.source.Source.prototype.getAttributions = function() {
  return this.attributions_;
};


/**
 * Get the attribution function for the source.
 * @return {?ol.Attribution2} Attribution function.
 */
ol.source.Source.prototype.getAttributions2 = function() {
  return this.attributions2_;
};


/**
 * Get the logo of the source.
 * @return {string|olx.LogoOptions|undefined} Logo.
 * @api
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
 *     Can be passed as `string`, `Array<string>`, `{@link ol.Attribution2}`,
 *     or `undefined`.
 * @api
 */
ol.source.Source.prototype.setAttributions = function(attributions) {
  this.attributions2_ = this.adaptAttributions_(attributions);
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
