/**
 * @module ol/source/Source
 */
import {inherits} from '../util.js';
import {UNDEFINED} from '../functions.js';
import BaseObject from '../Object.js';
import {get as getProjection} from '../proj.js';
import SourceState from '../source/State.js';


/**
 * A function that returns a string or an array of strings representing source
 * attributions.
 *
 * @typedef {function(module:ol/PluggableMap~FrameState): (string|Array.<string>)} Attribution
 */


/**
 * A type that can be used to provide attribution information for data sources.
 *
 * It represents either
 * * a simple string (e.g. `'© Acme Inc.'`)
 * * an array of simple strings (e.g. `['© Acme Inc.', '© Bacme Inc.']`)
 * * a function that returns a string or array of strings (`{@link module:ol/source/Source~Attribution}`)
 *
 * @typedef {string|Array.<string>|module:ol/source/Source~Attribution} AttributionLike
 */


/**
 * @typedef {Object} Options
 * @property {module:ol/source/Source~AttributionLike} [attributions]
 * @property {module:ol/proj~ProjectionLike} projection
 * @property {module:ol/source/State} [state]
 * @property {boolean} [wrapX]
 */


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for {@link module:ol/layer/Layer~Layer} sources.
 *
 * A generic `change` event is triggered when the state of the source changes.
 *
 * @constructor
 * @abstract
 * @extends {module:ol/Object}
 * @param {module:ol/source/Source~Options} options Source options.
 * @api
 */
const Source = function(options) {

  BaseObject.call(this);

  /**
   * @private
   * @type {module:ol/proj/Projection}
   */
  this.projection_ = getProjection(options.projection);

  /**
   * @private
   * @type {?module:ol/source/Source~Attribution}
   */
  this.attributions_ = this.adaptAttributions_(options.attributions);

  /**
   * @private
   * @type {module:ol/source/State}
   */
  this.state_ = options.state !== undefined ?
    options.state : SourceState.READY;

  /**
   * @private
   * @type {boolean}
   */
  this.wrapX_ = options.wrapX !== undefined ? options.wrapX : false;

};

inherits(Source, BaseObject);

/**
 * Turns the attributions option into an attributions function.
 * @param {module:ol/source/Source~AttributionLike|undefined} attributionLike The attribution option.
 * @return {?module:ol/source/Source~Attribution} An attribution function (or null).
 */
Source.prototype.adaptAttributions_ = function(attributionLike) {
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
 * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @param {Object.<string, boolean>} skippedFeatureUids Skipped feature uids.
 * @param {function((module:ol/Feature|module:ol/render/Feature)): T} callback Feature callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
Source.prototype.forEachFeatureAtCoordinate = UNDEFINED;


/**
 * Get the attribution function for the source.
 * @return {?module:ol/source/Source~Attribution} Attribution function.
 */
Source.prototype.getAttributions = function() {
  return this.attributions_;
};


/**
 * Get the projection of the source.
 * @return {module:ol/proj/Projection} Projection.
 * @api
 */
Source.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * @abstract
 * @return {Array.<number>|undefined} Resolutions.
 */
Source.prototype.getResolutions = function() {};


/**
 * Get the state of the source, see {@link module:ol/source/State~State} for possible states.
 * @return {module:ol/source/State} State.
 * @api
 */
Source.prototype.getState = function() {
  return this.state_;
};


/**
 * @return {boolean|undefined} Wrap X.
 */
Source.prototype.getWrapX = function() {
  return this.wrapX_;
};


/**
 * Refreshes the source and finally dispatches a 'change' event.
 * @api
 */
Source.prototype.refresh = function() {
  this.changed();
};


/**
 * Set the attributions of the source.
 * @param {module:ol/source/Source~AttributionLike|undefined} attributions Attributions.
 *     Can be passed as `string`, `Array<string>`, `{@link module:ol/source/Source~Attribution}`,
 *     or `undefined`.
 * @api
 */
Source.prototype.setAttributions = function(attributions) {
  this.attributions_ = this.adaptAttributions_(attributions);
  this.changed();
};


/**
 * Set the state of the source.
 * @param {module:ol/source/State} state State.
 * @protected
 */
Source.prototype.setState = function(state) {
  this.state_ = state;
  this.changed();
};
export default Source;
