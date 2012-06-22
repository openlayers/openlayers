goog.provide('ol.event.Drag');

goog.require('ol.event.ISequence');
goog.require('ol.event.Events');
goog.require('goog.functions');
goog.require('goog.fx.Dragger');
goog.require('goog.fx.DragEvent');
goog.require('goog.fx.Dragger.EventType');
goog.require('goog.functions');


/**
 * @constructor
 * @param {ol.event.Events} target The Events instance that handles events.
 * @extends {goog.fx.Dragger}
 * @implements {ol.event.ISequence}
 * @export
 */
ol.event.Drag = function(target) {
    goog.base(this, target.getElement());
    
    /**
     * @private
     * @type {ol.event.Events}
     */
    this.target_ = target;
    
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
        e.target = e.browserEvent.target;
        e.dx = e.clientX - this.previousX_;
        e.dy = e.clientY - this.previousY_;
    }
    this.target_.triggerEvent(e.type, /** @type {Object} (e.type) */ (e));
    return goog.base(this, 'dispatchEvent', e);
};

/** @inheritDoc */
ol.event.Drag.prototype.startDrag = function(e) {
    goog.base(this, 'startDrag', e);
    this.previousX_ = e.clientX;
    this.previousY_ = e.clientY;
};

/** @override */
ol.event.Drag.prototype.doDrag = function(e, x, y, dragFromScroll) {
    goog.base(this, 'doDrag', e, x, y, dragFromScroll);
    this.previousX_ = e.clientX;
    this.previousY_ = e.clientY;
};

/** @inheritDoc */
ol.event.Drag.prototype.defaultAction = function(x, y) {};

/** @inheritDoc */
ol.event.Drag.prototype.destroy = ol.event.Drag.prototype.dispose;


ol.event.addSequenceProvider('drag', ol.event.Drag);


/**
 * @type {Object.<string, string>}
 */
ol.event.Drag.EventType = {
    DRAGSTART: 'dragstart',
    DRAG: goog.fx.Dragger.EventType.DRAG,
    DRAGEND: 'dragend'
};