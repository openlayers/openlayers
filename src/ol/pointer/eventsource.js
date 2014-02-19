
goog.provide('ol.pointer.EventSource');

goog.require('goog.events.BrowserEvent');



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
 * @return {Object.<string, function(goog.events.BrowserEvent)>}
 *         Event/Handler mapping
 */
ol.pointer.EventSource.prototype.getMapping = goog.abstractMethod;


/**
 * Returns the handler that should handle a given event type.
 * @param {string} eventType
 * @return {function(goog.events.BrowserEvent)} Handler
 */
ol.pointer.EventSource.prototype.getHandlerForEvent = function(eventType) {
  return this.getMapping()[eventType];
};


/**
 * Setup source listeners for the given pointer event type on the `document`
 * element. See also `PointerEventHandler.listenOnDocument()`.
 * @param {string} type Pointer event type.
 */
ol.pointer.EventSource.prototype.listenOnDocument = function(type) {
};


/**
 * Remove source listeners for the given pointer event type from the `document`
 * element. See also `PointerEventHandler.unlistenOnDocument()`.
 * @param {string} type Pointer event type.
 */
ol.pointer.EventSource.prototype.unlistenOnDocument = function(type) {
};
