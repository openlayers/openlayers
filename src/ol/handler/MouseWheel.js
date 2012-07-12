/**
 * @fileoverview Mouse Wheel Handler.
 *
 * Provides a class for listening to mousewheel events on a DOM element
 * and re-dispatching to a map instance.
 *
 * The default behabior is zooming the map.
 */

goog.provide('ol.handler.MouseWheel');

goog.require('ol.handler.states');
goog.require('ol.events.MapEvent');
goog.require('ol.events.MapEventType');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.Disposable');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.events.MouseWheelHandler.EventType');


/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.Map} map The map instance.
 * @param {Element} element The element we listen to mousewheel on.
 * @param {Object} states An object for the handlers to share states.
 */
ol.handler.MouseWheel = function(map, element, states) {
    goog.base(this);

    /**
     * @type {ol.Map}
     */
    this.map_ = map;

    /**
     * @type {Element}
     */
    this.element_ = element;

    var handler = new goog.events.MouseWheelHandler(element);
    this.registerDisposable(handler);

    goog.events.listen(handler,
                       goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
                       this.handleMouseWheel, false, this);

};
goog.inherits(ol.handler.MouseWheel, goog.Disposable);

/**
 * @param {goog.events.MouseWheelEvent} e
 */
ol.handler.MouseWheel.prototype.handleMouseWheel = function(e) {
    var newE = new ol.events.MapEvent(ol.events.MapEventType.MOUSEWHEEL, e);
    var rt = goog.events.dispatchEvent(this.map_, newE);
    if (rt) {
        this.defaultBehavior(e);
    }
};

/**
 * @param {goog.events.MouseWheelEvent} e
 */
ol.handler.MouseWheel.prototype.defaultBehavior = function(e) {
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
