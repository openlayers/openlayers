goog.provide('ol.pointer.EventSource');


/**
 * @param {ol.pointer.PointerEventHandler} dispatcher Event handler.
 * @param {!Object.<string, function(Event)>} mapping Event
 *     mapping.
 * @constructor
 */
ol.pointer.EventSource = function(dispatcher, mapping) {
  /**
   * @type {ol.pointer.PointerEventHandler}
   */
  this.dispatcher = dispatcher;

  /**
   * @private
   * @const
   * @type {!Object.<string, function(Event)>}
   */
  this.mapping_ = mapping;
};


/**
 * List of events supported by this source.
 * @return {Array.<string>} Event names
 */
ol.pointer.EventSource.prototype.getEvents = function() {
  return Object.keys(this.mapping_);
};


/**
 * Returns a mapping between the supported event types and
 * the handlers that should handle an event.
 * @return {Object.<string, function(Event)>}
 *         Event/Handler mapping
 */
ol.pointer.EventSource.prototype.getMapping = function() {
  return this.mapping_;
};


/**
 * Returns the handler that should handle a given event type.
 * @param {string} eventType The event type.
 * @return {function(Event)} Handler
 */
ol.pointer.EventSource.prototype.getHandlerForEvent = function(eventType) {
  return this.mapping_[eventType];
};
