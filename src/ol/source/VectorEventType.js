/**
 * @module ol/source/VectorEventType
 */

/**
 * @enum {string}
 */
export default {
  /**
   * Triggered when a feature is added to the source.
   * @event oli.source.Vector.Event#addfeature
   * @api
   */
  ADDFEATURE: 'addfeature',

  /**
   * Triggered when a feature is updated.
   * @event oli.source.Vector.Event#changefeature
   * @api
   */
  CHANGEFEATURE: 'changefeature',

  /**
   * Triggered when the clear method is called on the source.
   * @event oli.source.Vector.Event#clear
   * @api
   */
  CLEAR: 'clear',

  /**
   * Triggered when a feature is removed from the source.
   * See {@link module:ol/source/Vector~VectorSource#clear source.clear()} for exceptions.
   * @event oli.source.Vector.Event#removefeature
   * @api
   */
  REMOVEFEATURE: 'removefeature'
};
