/**
 * @param {ol.pointer.PointerEventHandler} dispatcher Event handler.
 * @param {!Object.<string, function(Event)>} mapping Event
 *     mapping.
 * @constructor
 */
var _ol_pointer_EventSource_ = function(dispatcher, mapping) {
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
_ol_pointer_EventSource_.prototype.getEvents = function() {
  return Object.keys(this.mapping_);
};


/**
 * Returns the handler that should handle a given event type.
 * @param {string} eventType The event type.
 * @return {function(Event)} Handler
 */
_ol_pointer_EventSource_.prototype.getHandlerForEvent = function(eventType) {
  return this.mapping_[eventType];
};
export default _ol_pointer_EventSource_;
