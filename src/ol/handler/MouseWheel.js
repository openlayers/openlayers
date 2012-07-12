/**
 * @fileoverview Mouse Wheel Handler.
 *
 * Provides a class for listening to mousewheel events on a DOM element
 * and dispatching mousewheel events to a map instance.
 *
 * The default behavior for the mousewheel event is zooming the map.
 */

goog.provide('ol.handler.MouseWheel');

goog.require('ol.handler.MapHandler');
goog.require('ol.events.MapEvent');
goog.require('ol.events.MapEventType');

goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.events.MouseWheelHandler.EventType');


/**
 * @constructor
 * @extends {ol.handler.MapHandler}
 * @param {ol.Map} map The map instance.
 * @param {Element} element The element we listen for click on.
 * @param {ol.handler.states} states An object for the handlers to share
 *     states.
 */
ol.handler.MouseWheel = function(map, element, states) {
    goog.base(this, map, element, states);

    var handler = new goog.events.MouseWheelHandler(element);
    this.registerDisposable(handler);

    goog.events.listen(handler,
                       goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
                       this.handleMouseWheel, false, this);

};
goog.inherits(ol.handler.MouseWheel, ol.handler.MapHandler);

/**
 * @param {goog.events.MouseWheelEvent} e
 */
ol.handler.MouseWheel.prototype.handleMouseWheel = function(e) {
    var newE = new ol.events.MapEvent(ol.events.MapEventType.MOUSEWHEEL, e);
    var rt = goog.events.dispatchEvent(this.map_, newE);
    if (rt) {
        this.defaultMouseWheel(e);
    }
};

/**
 * @param {goog.events.MouseWheelEvent} e
 */
ol.handler.MouseWheel.prototype.defaultMouseWheel = function(e) {
    var me = this;
    if (e.deltaY === 0 || me.zoomBlocked_) {
        return;
    }
    me.zoomBlocked_ = window.setTimeout(function() {
        me.zoomBlocked_ = null;
    }, 200);

    var map = me.map_,
        step = e.deltaY / Math.abs(e.deltaY);
    map.setZoom(map.getZoom() - step,
                goog.style.getRelativePosition(e, this.element_));

    // We don't want the page to scroll.
    // (MouseWheelEvent is a BrowserEvent)
    e.preventDefault();
};
