/**
 * @module ol/source/Source
 */
import BaseObject from '../Object.js';
import SourceState from './State.js';
import {abstract} from '../util.js';
import {get as getProjection} from '../proj.js';

/**
 * A function that takes a {@link module:ol/PluggableMap~FrameState} and returns a string or
 * an array of strings representing source attributions.
 *
 * @typedef {function(import("../PluggableMap.js").FrameState): (string|Array<string>)} Attribution
 */

/**
 * A type that can be used to provide attribution information for data sources.
 *
 * It represents either
 * * a simple string (e.g. `'© Acme Inc.'`)
 * * an array of simple strings (e.g. `['© Acme Inc.', '© Bacme Inc.']`)
 * * a function that returns a string or array of strings ({@link module:ol/source/Source~Attribution})
 *
 * @typedef {string|Array<string>|Attribution} AttributionLike
 */

/**
 * @typedef {Object} Options
 * @property {AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
 * @property {import("./State.js").default} [state='ready'] State.
 * @property {boolean} [wrapX=false] WrapX.
 */

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for {@link module:ol/layer/Layer~Layer} sources.
 *
 * A generic `change` event is triggered when the state of the source changes.
 * @abstract
 * @api
 */
class Source extends BaseObject {
  /**
   * @param {Options} options Source options.
   */
  constructor(options) {
    super();

    /**
     * @protected
     * @type {import("../proj/Projection.js").default}
     */
    this.projection = getProjection(options.projection);

    /**
     * @private
     * @type {?Attribution}
     */
    this.attributions_ = adaptAttributions(options.attributions);

    /**
     * @private
     * @type {boolean}
     */
    this.attributionsCollapsible_ =
      options.attributionsCollapsible !== undefined
        ? options.attributionsCollapsible
        : true;

    /**
     * This source is currently loading data. Sources that defer loading to the
     * map's tile queue never set this to `true`.
     * @type {boolean}
     */
    this.loading = false;

    /**
     * @private
     * @type {import("./State.js").default}
     */
    this.state_ =
      options.state !== undefined ? options.state : SourceState.READY;

    /**
     * @private
     * @type {boolean}
     */
    this.wrapX_ = options.wrapX !== undefined ? options.wrapX : false;
  }

  /**
   * Get the attribution function for the source.
   * @return {?Attribution} Attribution function.
   */
  getAttributions() {
    return this.attributions_;
  }

  /**
   * @return {boolean} Attributions are collapsible.
   */
  getAttributionsCollapsible() {
    return this.attributionsCollapsible_;
  }

  /**
   * Get the projection of the source.
   * @return {import("../proj/Projection.js").default} Projection.
   * @api
   */
  getProjection() {
    return this.projection;
  }

  /**
   * @abstract
   * @return {Array<number>|undefined} Resolutions.
   */
  getResolutions() {
    return abstract();
  }

  /**
   * Get the state of the source, see {@link module:ol/source/State~State} for possible states.
   * @return {import("./State.js").default} State.
   * @api
   */
  getState() {
    return this.state_;
  }

  /**
   * @return {boolean|undefined} Wrap X.
   */
  getWrapX() {
    return this.wrapX_;
  }

  /**
   * @return {Object|undefined} Context options.
   */
  getContextOptions() {
    return undefined;
  }

  /**
   * Refreshes the source. The source will be cleared, and data from the server will be reloaded.
   * @api
   */
  refresh() {
    this.changed();
  }

  /**
   * Set the attributions of the source.
   * @param {AttributionLike|undefined} attributions Attributions.
   *     Can be passed as `string`, `Array<string>`, {@link module:ol/source/Source~Attribution},
   *     or `undefined`.
   * @api
   */
  setAttributions(attributions) {
    this.attributions_ = adaptAttributions(attributions);
    this.changed();
  }

  /**
   * Set the state of the source.
   * @param {import("./State.js").default} state State.
   */
  setState(state) {
    this.state_ = state;
    this.changed();
  }
}

/**
 * Turns the attributions option into an attributions function.
 * @param {AttributionLike|undefined} attributionLike The attribution option.
 * @return {?Attribution} An attribution function (or null).
 */
function adaptAttributions(attributionLike) {
  if (!attributionLike) {
    return null;
  }
  if (Array.isArray(attributionLike)) {
    return function (frameState) {
      return attributionLike;
    };
  }

  if (typeof attributionLike === 'function') {
    return attributionLike;
  }

  return function (frameState) {
    return [attributionLike];
  };
}

export default Source;
