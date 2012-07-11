/**
 * @fileoverview Mouse Wheel Handler.
 *
 * Provides a class for listening to mousewheel events on a DOM element
 * and re-dispatching to a map instance.
 *
 * The default behabior is zooming the map.
 */

goog.provide('ol.handler.MouseWheel');

goog.require('goog.Disposable');
goog.require('goog.events.MouseWheelHandler');


/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.Map} map The map instance.
 * @param {Element} elt The element we listen to mousewheel on.
 * @param {Object} states An object for the handlers to share states.
 */
ol.handler.MouseWheel = function(map, elt, states) {
    goog.base(this);

    var handler = new goog.events.MouseWheelHandler(elt);
    this.registerDisposable(handler);

    /**
     * @param {goog.events.MouseWheelEvent} e
     */
    var handleMouseWheel = function(e) {
        e.position = goog.style.getRelativePosition(e, elt);
        e.type = 'mousewheel';
        goog.events.dispatchEvent(map, e);
    };

    goog.events.listen(handler,
                       goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
                       this.handleMouseWheel, false, this);

};
goog.inherits(ol.handler.MouseWheel, goog.Disposable);

/**
 * @param {goog.events.MouseWheelEvent} e
 */
ol.handler.MouseWheel.prototype.handleMouseWheel = function(e) {
    e.position = goog.style.getRelativePosition(e, this.elt_);
    e.type = 'mousewheel';
    var rt = goog.events.dispatchEvent(this.map_, e);
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
    map.setZoom(map.getZoom() - step, e.position);

    // We don't want the page to scroll.
    e.preventDefault();
};
