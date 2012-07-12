goog.provide('ol.MapEvent');

goog.require('goog.events.Event');

/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type Event type.
 * @param {goog.events.Event} evt The wrapped event.
 */
ol.MapEvent = function(type, evt) {
    goog.base(this, type);

    /**
     * X displacement relative to previous drag.
     *
     * @type {number|undefined}
     */
    this.deltaX = undefined;

    /**
     * Y displacement relative to previous drag.
     *
     * @type {number|undefined}
     */
    this.deltaY = undefined;

    /**
     * The browser event or closure event (e.g. goog.fx.DragEvent} wrapped
     * by this event.
     *
     * @type {goog.events.Event}
     */
    this.event_ = evt;
};
goog.inherits(ol.MapEvent, goog.events.Event);
