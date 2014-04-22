goog.provide('ol.pointer.EventSource');

goog.require('goog.events.BrowserEvent');
goog.require('goog.object');



/**
 * @param {ol.pointer.PointerEventHandler} dispatcher
 * @param {Object.<string, function(goog.events.BrowserEvent)>} mapping
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
   * @type {Object.<string, function(goog.events.BrowserEvent)>}
   */
  this.mapping_ = mapping;
};


/**
 * List of events supported by this source.
 * @return {Array.<string>} Event names
 */
ol.pointer.EventSource.prototype.getEvents = function() {
  return goog.object.getKeys(this.mapping_);
};


/**
 * Returns a mapping between the supported event types and
 * the handlers that should handle an event.
 * @return {Object.<string, function(goog.events.BrowserEvent)>}
 *         Event/Handler mapping
 */
ol.pointer.EventSource.prototype.getMapping = function() {
  return this.mapping_;
};


/**
 * Returns the handler that should handle a given event type.
 * @param {string} eventType
 * @return {function(goog.events.BrowserEvent)} Handler
 */
ol.pointer.EventSource.prototype.getHandlerForEvent = function(eventType) {
  return this.mapping_[eventType];
};
