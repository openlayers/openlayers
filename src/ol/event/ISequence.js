goog.provide('ol.event.ISequence');

/**
 * Interface for event sequences
 *
 * @interface
 * @param {Element} target The element that will be listened to for browser
 *     events.
 */
ol.event.ISequence = function(target) {};

/**
 * @return {Object.<string, string>} element
 */
ol.event.ISequence.prototype.getEventTypes = function() {};

/**
 * Destroys the sequence
 */
ol.event.ISequence.prototype.destroy = function() {};
