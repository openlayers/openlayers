goog.provide('ol.handler.states');

/**
 * Type definition for shared states between handlers. The following states
 * are defined:
 *
 * * dragged {boolean} - Set by the Drag handler when we are dragging. Read by
 *   the click handler to determine if a click is a real click or the result
 *   of a mouseup/touchend at the end of a drag sequence.
 *
 * @typedef {{dragged: boolean}}
 */
ol.handler.states;