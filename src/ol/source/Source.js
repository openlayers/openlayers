/**
 * @module ol/source/Source
 */
import {inherits, nullFunction} from '../index.js';
import _ol_Object_ from '../Object.js';
import {get as getProjection} from '../proj.js';
import SourceState from '../source/State.js';


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
  this.projection_ = getProjection(options.projection);

  /**
   * @private
   * @type {?ol.Attribution}
   */
  this.attributions_ = this.adaptAttributions_(options.attributions);

  /**
   * @private
   * @type {ol.source.State}
   */
  this.state_ = options.state !== undefined ?
    options.state : SourceState.READY;

  /**
   * @private
   * @type {boolean}
   */
  this.wrapX_ = options.wrapX !== undefined ? options.wrapX : false;

};

inherits(_ol_source_Source_, _ol_Object_);

/**
 * Turns the attributions option into an attributions function.
 * @param {ol.AttributionLike|undefined} attributionLike The attribution option.
 * @return {?ol.Attribution} An attribution function (or null).
 */
_ol_source_Source_.prototype.adaptAttributions_ = function(attributionLike) {
  if (!attributionLike) {
    return null;
  }
  if (Array.isArray(attributionLike)) {
    return function(frameState) {
      return attributionLike;
    };
  }

  if (typeof attributionLike === 'function') {
    return attributionLike;
  }

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
 * Get the attribution function for the source.
 * @return {?ol.Attribution} Attribution function.
 */
_ol_source_Source_.prototype.getAttributions = function() {
  return this.attributions_;
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
 *     Can be passed as `string`, `Array<string>`, `{@link ol.Attribution}`,
 *     or `undefined`.
 * @api
 */
_ol_source_Source_.prototype.setAttributions = function(attributions) {
  this.attributions_ = this.adaptAttributions_(attributions);
  this.changed();
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
