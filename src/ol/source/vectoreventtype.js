goog.provide('ol.source.VectorEventType');

/**
 * @enum {string}
 */
ol.source.VectorEventType = {
  /**
   * Triggered when a feature is added to the source.
   * @event ol.source.Vector.Event#addfeature
   * @api
   */
  ADDFEATURE: 'addfeature',

  /**
   * Triggered when a feature is updated.
   * @event ol.source.Vector.Event#changefeature
   * @api
   */
  CHANGEFEATURE: 'changefeature',

  /**
   * Triggered when the clear method is called on the source.
   * @event ol.source.Vector.Event#clear
   * @api
   */
  CLEAR: 'clear',

  /**
   * Triggered when a feature is removed from the source.
   * See {@link ol.source.Vector#clear source.clear()} for exceptions.
   * @event ol.source.Vector.Event#removefeature
   * @api
   */
  REMOVEFEATURE: 'removefeature'
};
