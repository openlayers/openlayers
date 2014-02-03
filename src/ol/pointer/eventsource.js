
goog.provide('ol.pointer.EventSource');



/**
 * @param {ol.pointer.PointerEventHandler} dispatcher
 * @constructor
 */
ol.pointer.EventSource = function(dispatcher) {
  /**
   * @type {ol.pointer.PointerEventHandler}
   */
  this.dispatcher = dispatcher;
};


/**
 * List of events supported by this source.
 * @return {Array.<string>} Event names
 */
ol.pointer.EventSource.prototype.getEvents = goog.abstractMethod;


/**
 * Returns a mapping between the supported event types and
 * the handlers that should handle an event.
 * @return {Object.<string, function(Event)>}  Event/Handler mapping
 */
ol.pointer.EventSource.prototype.getMapping = goog.abstractMethod;


/**
 * Returns the handler that should handle a given event type.
 * @param {string} eventType
 * @return {function(Event)} Handler
 */
ol.pointer.EventSource.prototype.getHandlerForEvent = function(eventType) {
  return this.getMapping()[eventType];
};
