/**
 * @fileoverview Drag Handler.
 *
 * Provides a class for listening to drag sequences on a DOM element and
 * dispatching dragstart, drag and dragend events to a map object.
 *
 * The default behavior for the drag event is moving the map.
 */

goog.provide('ol.handler.Drag');

goog.require('ol.handler.MapHandler');
goog.require('ol.events.MapEvent');
goog.require('ol.events.MapEventType');

goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.fx.Dragger');

/**
 * @constructor
 * @extends {ol.handler.MapHandler}
 * @param {ol.Map} map The map instance.
 * @param {ol.handler.states} states An object for the handlers to share
 *     states.
 */
ol.handler.Drag = function(map, states) {
    goog.base(this, map, states);

    /**
     * @type {goog.fx.Dragger}
     */
    this.dragger_ = new goog.fx.Dragger(this.element_);

    var dragger = this.dragger_;
    dragger.defaultAction = function() {};

    /**
     * @type {number}
     */
    this.prevX_ = 0;

    /**
     * @type {number}
     **/
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
goog.inherits(ol.handler.Drag, ol.handler.MapHandler);

/**
 * @inheritDoc
 */
ol.handler.Drag.prototype.disposeInternal = function() {
    goog.base(this, 'disposeInternal');
    goog.dispose(this.dragger_);
    goog.events.unlisten(this.element_,
                         [goog.events.EventType.TOUCHMOVE,
                          goog.events.EventType.MOUSEMOVE],
                         goog.events.Event.preventDefault, false, this);

};

/**
 * @param {goog.fx.DragEvent} e
 */
ol.handler.Drag.prototype.handleDragStart = function(e) {
    this.states_.dragged = false;
    this.prevX_ = e.clientX;
    this.prevY_ = e.clientY;
    var newE = new ol.events.MapEvent(ol.events.MapEventType.DRAGSTART, e);
    goog.events.dispatchEvent(this.map_, newE);

    // this is to prevent page scrolling
    goog.events.listen(this.element_,
                       [goog.events.EventType.TOUCHMOVE,
                        goog.events.EventType.MOUSEMOVE],
                       goog.events.Event.preventDefault, false, this);

};

/**
 * @param {goog.fx.DragEvent} e
 */
ol.handler.Drag.prototype.handleDrag = function(e) {
    this.states_.dragged = true;
    var newE = new ol.events.MapEvent(ol.events.MapEventType.DRAG, e);
    newE.deltaX = e.clientX - this.prevX_;
    newE.deltaY = e.clientY - this.prevY_;
    this.prevX_ = e.clientX;
    this.prevY_ = e.clientY;
    var rt = goog.events.dispatchEvent(this.map_, newE);
    if (rt) {
        var defaultControl = this.map_.getDefaultControl();
        if (defaultControl) {
            defaultControl.defaultDrag(newE);
        }
    }
};

/**
 * @param {goog.fx.DragEvent} e
 */
ol.handler.Drag.prototype.handleDragEnd = function(e) {
    var newE = new ol.events.MapEvent(ol.events.MapEventType.DRAGEND, e);
    goog.events.dispatchEvent(this.map_, newE);
    goog.events.unlisten(this.element_,
                         [goog.events.EventType.TOUCHMOVE,
                          goog.events.EventType.MOUSEMOVE],
                         goog.events.Event.preventDefault, false, this);
};

/**
 * @param {goog.fx.DragEvent} e
 */
ol.handler.Drag.prototype.handleDragEarlyCancel = function(e) {
    goog.events.unlisten(this.element_,
                         [goog.events.EventType.TOUCHMOVE,
                          goog.events.EventType.MOUSEMOVE],
                         goog.events.Event.preventDefault, false, this);
};
