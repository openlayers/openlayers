/**
 * @module ol/source/Source
 */
import {inherits, nullFunction} from '../index.js';
import _ol_Attribution_ from '../Attribution.js';
import _ol_Object_ from '../Object.js';
import _ol_proj_ from '../proj.js';
import _ol_source_State_ from '../source/State.js';

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
var _ol_source_Source_ = function(options) {

  _ol_Object_.call(this);

  /**
   * @private
   * @type {ol.proj.Projection}
   */
  this.projection_ = _ol_proj_.get(options.projection);

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
    options.state : _ol_source_State_.READY;

  /**
   * @private
   * @type {boolean}
   */
  this.wrapX_ = options.wrapX !== undefined ? options.wrapX : false;

};

inherits(_ol_source_Source_, _ol_Object_);

/**
 * Turns the attributions option into an attributions function.
 * @suppress {deprecated}
 * @param {ol.AttributionLike|undefined} attributionLike The attribution option.
 * @return {?ol.Attribution2} An attribution function (or null).
 */
_ol_source_Source_.prototype.adaptAttributions_ = function(attributionLike) {
  if (!attributionLike) {
    return null;
  }
  if (attributionLike instanceof _ol_Attribution_) {

    // TODO: remove attributions_ in next major release
    this.attributions_ = [attributionLike];

    return function(frameState) {
      return [attributionLike.getHTML()];
    };
  }
  if (Array.isArray(attributionLike)) {
    if (attributionLike[0] instanceof _ol_Attribution_) {

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
      return new _ol_Attribution_({html: attribution});
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
    new _ol_Attribution_({html: attributionLike})
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
_ol_source_Source_.prototype.forEachFeatureAtCoordinate = nullFunction;


/**
 * Get the attributions of the source.
 * @return {Array.<ol.Attribution>} Attributions.
 * @api
 */
_ol_source_Source_.prototype.getAttributions = function() {
  return this.attributions_;
};


/**
 * Get the attribution function for the source.
 * @return {?ol.Attribution2} Attribution function.
 */
_ol_source_Source_.prototype.getAttributions2 = function() {
  return this.attributions2_;
};


/**
 * Get the logo of the source.
 * @return {string|olx.LogoOptions|undefined} Logo.
 * @api
 */
_ol_source_Source_.prototype.getLogo = function() {
  return this.logo_;
};


/**
 * Get the projection of the source.
 * @return {ol.proj.Projection} Projection.
 * @api
 */
_ol_source_Source_.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * @abstract
 * @return {Array.<number>|undefined} Resolutions.
 */
_ol_source_Source_.prototype.getResolutions = function() {};


/**
 * Get the state of the source, see {@link ol.source.State} for possible states.
 * @return {ol.source.State} State.
 * @api
 */
_ol_source_Source_.prototype.getState = function() {
  return this.state_;
};


/**
 * @return {boolean|undefined} Wrap X.
 */
_ol_source_Source_.prototype.getWrapX = function() {
  return this.wrapX_;
};


/**
 * Refreshes the source and finally dispatches a 'change' event.
 * @api
 */
_ol_source_Source_.prototype.refresh = function() {
  this.changed();
};


/**
 * Set the attributions of the source.
 * @param {ol.AttributionLike|undefined} attributions Attributions.
 *     Can be passed as `string`, `Array<string>`, `{@link ol.Attribution2}`,
 *     or `undefined`.
 * @api
 */
_ol_source_Source_.prototype.setAttributions = function(attributions) {
  this.attributions2_ = this.adaptAttributions_(attributions);
  this.changed();
};


/**
 * Set the logo of the source.
 * @param {string|olx.LogoOptions|undefined} logo Logo.
 */
_ol_source_Source_.prototype.setLogo = function(logo) {
  this.logo_ = logo;
};


/**
 * Set the state of the source.
 * @param {ol.source.State} state State.
 * @protected
 */
_ol_source_Source_.prototype.setState = function(state) {
  this.state_ = state;
  this.changed();
};
export default _ol_source_Source_;
