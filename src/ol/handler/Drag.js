goog.provide('ol.handler.Drag');

goog.require('goog.fx.Dragger');
goog.require('goog.events');
goog.require('goog.Disposable');

/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.Map} map The map instance.
 * @param {Element} elt The element that will be dragged.
 */
ol.handler.Drag = function(map, elt) {

    var dragger = new goog.fx.Dragger(elt);
    this.registerDisposable(dragger);

    dragger.defaultAction = function() {};

    var prevX = 0, prevY = 0;

    var handleDragStart = function(e) {
        prevX = e.clientX;
        prevY = e.clientY;
        var newE = {
            type: 'dragstart'
        };
        goog.events.dispatchEvent(map, newE);
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
    };

    goog.events.listen(dragger, goog.fx.Dragger.EventType.START,
                       handleDragStart, false, this);
    goog.events.listen(dragger, goog.fx.Dragger.EventType.DRAG,
                       handleDrag, false, this);
    goog.events.listen(dragger, goog.fx.Dragger.EventType.END,
                       handleDragEnd, false, this);
};
goog.inherits(ol.handler.Drag, goog.Disposable);

/**
 * @inheritDoc
 */
ol.handler.Drag.prototype.disposeInternal = function() {
    goog.base(this, 'disposeInternal');
    this.dragger_.dispose();
    delete this.dragger_;
};
