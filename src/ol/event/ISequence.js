goog.provide('ol.event.ISequence');

/**
 * Interface for event sequences. Event sequences map sequences of native
 * browser events to high level events that the sequence provides.
 *
 * Implementations are expected to call dispatchEvent on the {@code target} to
 * to fire their high level events. 
 *
 * Implementations can expect the {@code target}'s {@code getElement()} method
 * to return an {Element} at construction time.
 *
 * @interface
 * @param {ol.event.Events} target The Events instance that receives the
 *     sequence's events.
 */
ol.event.ISequence = function(target) {};

/**
 * Destroys the sequence
 */
ol.event.ISequence.prototype.destroy = function() {};
