/**
 * @fileoverview Drag Handler.
 *
 * Provides a class for listening to drag events on a DOM element and
 * re-dispatching to a map instance.
 */

goog.provide('ol.handler.Drag');

goog.require('goog.fx.Dragger');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.Disposable');

/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.Map} map The map instance.
 * @param {Element} elt The element that will be dragged.
 */
ol.handler.Drag = function(map, elt) {

    var dragger = new goog.fx.Dragger(elt);
    dragger.defaultAction = function() {};

    this.registerDisposable(dragger);

    var touchmove = goog.events.EventType.TOUCHMOVE,
        mousemove = goog.events.EventType.MOUSEMOVE;

    var prevX = 0, prevY = 0;

    var preventDefault = function(e) { e.preventDefault(); };

    var handleDragStart = function(e) {
        prevX = e.clientX;
        prevY = e.clientY;
        var newE = {
            type: 'dragstart'
        };
        goog.events.dispatchEvent(map, newE);
        // this to prevent page scrolling
        goog.events.listen(elt, [touchmove, mousemove], preventDefault);
    };

    var handleDrag = function(e) {
        var newE = {
            type: 'drag',
            deltaX: e.clientX - prevX,
            deltaY: e.clientY - prevY
        };
        prevX = e.clientX;
        prevY = e.clientY;
        goog.events.dispatchEvent(map, newE);
    };

    var handleDragEnd = function(e) {
        var newE = {
            type: 'dragend'
        };
        goog.events.dispatchEvent(map, newE);
        goog.events.unlisten(elt, [touchmove, mousemove], preventDefault);
    };

    var handleDragEarlyCancel = function(e) {
        goog.events.unlisten(elt, [touchmove, mousemove], preventDefault);
    };

    goog.events.listen(dragger, goog.fx.Dragger.EventType.START,
                       handleDragStart, false, this);
    goog.events.listen(dragger, goog.fx.Dragger.EventType.DRAG,
                       handleDrag, false, this);
    goog.events.listen(dragger, goog.fx.Dragger.EventType.END,
                       handleDragEnd, false, this);
    goog.events.listen(dragger, goog.fx.Dragger.EventType.EARLY_CANCEL,
                       handleDragEarlyCancel, false, this);
};
goog.inherits(ol.handler.Drag, goog.Disposable);
