/**
 * @fileoverview Map Mouse Wheel Handler.
 *
 * Provides a class for listening to mousewheel events on a DOM element
 * and re-dispatching to a map instance.
 */

goog.provide('ol.handler.MouseWheel');

goog.require('goog.Disposable');
goog.require('goog.events.MouseWheelHandler');


/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.Map} map The map instance.
 * @param {Element} elt The element we listen to mousewheel on.
 */
ol.handler.MouseWheel = function(map, elt) {
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
                       handleMouseWheel);

};
goog.inherits(ol.handler.MouseWheel, goog.Disposable);
