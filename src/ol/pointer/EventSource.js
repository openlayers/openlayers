/**
 * @module ol/pointer/EventSource
 */
/**
 * @param {module:ol/pointer/PointerEventHandler} dispatcher Event handler.
 * @param {!Object.<string, function(Event)>} mapping Event mapping.
 * @constructor
 */
const EventSource = function(dispatcher, mapping) {
  /**
   * @type {module:ol/pointer/PointerEventHandler}
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
EventSource.prototype.getEvents = function() {
  return Object.keys(this.mapping_);
};


/**
 * Returns the handler that should handle a given event type.
 * @param {string} eventType The event type.
 * @return {function(Event)} Handler
 */
EventSource.prototype.getHandlerForEvent = function(eventType) {
  return this.mapping_[eventType];
};
export default EventSource;
