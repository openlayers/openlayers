goog.provide('ol.event.Drag');
goog.provide('ol.event.DragEvent');

goog.require('ol.event.ISequence');
goog.require('ol.event.Events');
goog.require('goog.functions');
goog.require('goog.fx.Dragger');
goog.require('goog.fx.DragEvent');
goog.require('goog.fx.Dragger.EventType');
goog.require('goog.functions');


/**
 * @constructor
 * @param {Element} target The element that will be dragged.
 * @extends {goog.fx.Dragger}
 * @implements {ol.event.ISequence}
 * @export
 */
ol.event.Drag = function(target) {
    goog.base(this, target);
    
    /**
     * @private
     * @type {number} clientX of the previous event
     */
    this.previousX_ = 0;
    
    /**
     * @private
     * @type {number}  clientY of the previous event
     */
    this.previousY_ = 0;
};
goog.inherits(ol.event.Drag, goog.fx.Dragger);

/**
 * @param {string|goog.fx.DragEvent} e
 * @return {boolean} If anyone called preventDefault on the event object (or
 *     if any of the handlers returns false this will also return false.
 */
ol.event.Drag.prototype.dispatchEvent = function(e) {
    if (e instanceof goog.fx.DragEvent) {
        if (e.type === goog.fx.Dragger.EventType.START) {
            e.type = ol.event.Drag.EventType.DRAGSTART;
        } else if (e.type === goog.fx.Dragger.EventType.END) {
            e.type = ol.event.Drag.EventType.DRAGEND;
        }
    }
    return goog.base(this, 'dispatchEvent', e);
};

/** @inheritDoc */
ol.event.Drag.prototype.startDrag = function(e) {
    this.previousX_ = e.clientX;
    this.previousY_ = e.clientY;
    goog.base(this, 'startDrag', e);
};

/** @inheritDoc */
ol.event.Drag.prototype.doDrag = function(e, x, y, dragFromScroll) {
    e.dx = e.clientX - this.previousX_;
    e.dy = e.clientX - this.previousY_;
    goog.base(this, 'doDrag', e, x, y, dragFromScroll);
};

/** @override */
ol.event.Drag.prototype.defaultAction = function(x, y) {};

/** @inheritDoc */
ol.event.Drag.prototype.getEventTypes = function() {
    return ol.event.Drag.EventType;
};

/** @inheritDoc */
ol.event.Drag.prototype.destroy = ol.event.Drag.prototype.dispose;

ol.event.addSequenceProvider('drag', ol.event.Drag);


/**
 * Object representing a drag event
 *
 * @param {string} type Event type.
 * @param {goog.fx.Dragger} dragobj Drag object initiating event.
 * @param {number} clientX X-coordinate relative to the viewport.
 * @param {number} clientY Y-coordinate relative to the viewport.
 * @param {goog.events.BrowserEvent} browserEvent Object representing the
 *     browser event that caused this drag event.
 * @constructor
 * @extends {goog.fx.DragEvent}
 */
ol.event.DragEvent = function(type, dragobj, clientX, clientY, browserEvent) {
    
    goog.base(this, type, dragobj, clientX, clientY, browserEvent);
    
    /**
     * The move delta in X direction since the previous drag event
     *
     * @type {number}
     */
    this.dx = 0;
    
    /**
     * The move delta in Y direction since the previous drag event
     *
     * @type {number}
     */
    this.dy = 0;
};
goog.inherits(ol.event.DragEvent, goog.fx.DragEvent);


/**
 * @type {Object.<string, string>}
 */
ol.event.Drag.EventType = {
    DRAGSTART: 'dragstart',
    DRAG: goog.fx.Dragger.EventType.DRAG,
    DRAGEND: 'dragend'
};