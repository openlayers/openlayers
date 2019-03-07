/**
 * @module ol/pointer/EventSource
 */

class EventSource {

  /**
   * @param {import("./PointerEventHandler.js").default} dispatcher Event handler.
   * @param {!Object<string, function(Event): void>} mapping Event mapping.
   */
  constructor(dispatcher, mapping) {

    /**
     * @type {import("./PointerEventHandler.js").default}
     */
    this.dispatcher = dispatcher;

    /**
     * @private
     * @const
     * @type {!Object<string, function(Event): void>}
     */
    this.mapping_ = mapping;
  }

  /**
   * List of events supported by this source.
   * @return {Array<string>} Event names
   */
  getEvents() {
    return Object.keys(this.mapping_);
  }

  /**
   * Returns the handler that should handle a given event type.
   * @param {string} eventType The event type.
   * @return {function(Event)} Handler
   */
  getHandlerForEvent(eventType) {
    return this.mapping_[eventType];
  }

}

export default EventSource;
