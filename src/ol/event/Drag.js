goog.provide('ol.event.Drag');

goog.require('ol.event.Sequence');
goog.require('goog.fx.Dragger');
goog.require('goog.fx.Dragger.EventType');


/**
 * @constructor
 * @extends {ol.event.Sequence}
 * @export
 */
ol.event.Drag = function() {
    
    goog.base(this);
    
    /** @inheritDoc */
    this.eventType_ = {
        DRAGSTART: 'dragstart',
        DRAG: 'drag',
        DRAGEND: 'dragend'
    };
    
    var providedEvents = this.getProvidedEvents(),
        oldX, oldY;

    providedEvents[this.eventType_.DRAGSTART] = {};
    providedEvents[this.eventType_.DRAGSTART]
        [goog.fx.Dragger.EventType.START] = function(evt) {
            oldX = evt.screenX;
            oldY = evt.screenY;
        };

    providedEvents[this.eventType_.DRAG] = {};
    providedEvents[this.eventType_.DRAG]
        [goog.fx.Dragger.EventType.DRAG] = function(evt) {
            evt.dx = evt.screenX - oldX;
            evt.dy = evt.screenY - oldY;
            oldX = evt.screenX;
            oldY = evt.screenY;
        };

    providedEvents[this.eventType_.DRAGEND] = {};
    providedEvents[this.eventType_.DRAGEND]
        [goog.fx.Dragger.EventType.END] = true;
};
goog.inherits(ol.event.Drag, ol.event.Sequence);

/** @inheritDoc */
ol.event.Drag.prototype.setElement = function(element) {
    goog.base(this, 'setElement', element);
    if (goog.isDefAndNotNull(element)) {
        this.dragger_ = new goog.fx.Dragger(element);
    } else if (this.dragger_) {
        this.dragger_.dispose();
    }
};