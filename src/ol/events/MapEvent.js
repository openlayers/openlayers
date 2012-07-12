goog.provide('ol.events.MapEvent');
goog.provide('ol.events.MapEventType');

goog.require('goog.events.Event');


/**
 * @enum {string}
 */
ol.events.MapEventType = {
    // drag handler
    DRAGSTART: 'dragstart',
    DRAG: 'drag',
    DRAGEND: 'dragend',

    // mousewheel handler
    MOUSEWHEEL: 'mousewheel',

    // click handler
    CLICK: 'click'
};

/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type Event type.
 * @param {goog.events.Event} evt The wrapped event.
 */
ol.events.MapEvent = function(type, evt) {
    goog.base(this, type);

    /**
     * X displacement relative to the previous drag event, if any.
     *
     * @type {number|undefined}
     */
    this.deltaX = undefined;

    /**
     * Y displacement relative to the previous drag event, if any.
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
goog.inherits(ol.events.MapEvent, goog.events.Event);
