/**
 * @fileoverview Drag Handler.
 *
 * Provides a class for listening to drag events on a DOM element and
 * re-dispatching to a map instance.
 */

goog.provide('ol.handler.Drag');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.Disposable');
goog.require('goog.fx.Dragger');

/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.Map} map The map instance.
 * @param {Element} elt The element that will be dragged.
 * @param {Object} states An object for the handlers to share states.
 */
ol.handler.Drag = function(map, elt, states) {

    /** */
    this.map_ = map;

    /** */
    this.elt_ = elt;

    /**
     * @type {Object}
     */
    this.states_ = states;

    dragger.defaultAction = function() {};

    /** */
    this.prevX_ = 0;

    /** */
    this.prevY_ = 0;

    goog.events.listen(dragger, goog.fx.Dragger.EventType.START,
                       this.handleDragStart, false, this);
    goog.events.listen(dragger, goog.fx.Dragger.EventType.DRAG,
                       this.handleDrag, false, this);
    goog.events.listen(dragger, goog.fx.Dragger.EventType.END,
                       this.handleDragEnd, false, this);
    goog.events.listen(dragger, goog.fx.Dragger.EventType.EARLY_CANCEL,
                       this.handleDragEarlyCancel, false, this);

};
goog.inherits(ol.handler.Drag, goog.Disposable);

/**
 */
ol.handler.Drag.prototype.disposeInternal = function() {
    goog.base(this, 'disposeInternal');
    goog.dispose(this.dragger_);
    goog.events.unlisten(this.elt_,
                         [goog.events.EventType.TOUCHMOVE,
                          goog.events.EventType.MOUSEMOVE],
                         goog.events.Event.preventDefault, false, this);

};

/**
 */
ol.handler.Drag.prototype.handleDragStart = function(e) {
    this.states_.dragged = false;
    this.prevX_ = e.clientX;
    this.prevY_ = e.clientY;
    var newE = {
        type: 'dragstart'
    };
    goog.events.dispatchEvent(this.map_, newE);

    // this is to prevent page scrolling
    goog.events.listen(this.elt_,
                       [goog.events.EventType.TOUCHMOVE,
                        goog.events.EventType.MOUSEMOVE],
                       goog.events.Event.preventDefault, false, this);

};

/**
 */
ol.handler.Drag.prototype.handleDrag = function(e) {
    this.states_.dragged = true;
    var newE = {
        type: 'drag',
        deltaX: e.clientX - this.prevX_,
        deltaY: e.clientY - this.prevY_
    };
    this.prevX_ = e.clientX;
    this.prevY_ = e.clientY;
    var rt = goog.events.dispatchEvent(this.map_, newE);
    if (rt) {
        this.defaultBehavior(newE);
    }
};

/**
 */
ol.handler.Drag.prototype.handleDragEnd = function(e) {
    var newE = {
        type: 'dragend'
    };
    goog.events.dispatchEvent(this.map_, newE);
    goog.events.unlisten(this.elt_,
                         [goog.events.EventType.TOUCHMOVE,
                          goog.events.EventType.MOUSEMOVE],
                         goog.events.Event.preventDefault, false, this);
};

/**
 */
ol.handler.Drag.prototype.handleDragEarlyCancel = function(e) {
    goog.events.unlisten(this.elt_,
                         [goog.events.EventType.TOUCHMOVE,
                          goog.events.EventType.MOUSEMOVE],
                         goog.events.Event.preventDefault, false, this);
};

/**
 */
ol.handler.Drag.prototype.defaultBehavior = function(e) {
    this.map_.moveByViewportPx(e.deltaX, e.deltaY);
};
