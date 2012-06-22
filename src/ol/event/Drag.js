goog.provide('ol.event.Drag');

goog.require('ol.event.ISequence');
goog.require('ol.event');
goog.require('goog.fx.Dragger');
goog.require('goog.fx.DragEvent');
goog.require('goog.fx.Dragger.EventType');


/**
 * @constructor
 * @param {ol.event.Events} target The Events instance that handles events.
 * @implements {ol.event.ISequence}
 * @export
 */
ol.event.Drag = function(target) {    
    var previousX = 0, previousY = 0,
        element = target.getElement(),
        dragger = new goog.fx.Dragger(element);

    /**
     * @private
     * @type {goog.fx.Dragger}
     */
    this.dragger_ = dragger;
    
    dragger.defaultAction = function(x, y) {};                
    dragger.addEventListener(goog.fx.Dragger.EventType.START, function(evt) {
        evt.target = element;
        evt.type = 'dragstart';
        previousX = evt.clientX;
        previousY = evt.clientY;
        target.triggerEvent(evt.type, evt);
    });
    dragger.addEventListener(goog.fx.Dragger.EventType.DRAG, function(evt) {
        evt.target = element;
        evt.dx = evt.clientX - previousX;
        evt.dy = evt.clientY - previousY;
        previousX = evt.clientX;
        previousY = evt.clientY;
        target.triggerEvent(evt.type, evt);
    });
    dragger.addEventListener(goog.fx.Dragger.EventType.END, function(evt) {
        evt.target = element;
        evt.type = 'dragend';
        target.triggerEvent(evt.type, evt);
    });    
};

/** @inheritDoc */
ol.event.Drag.prototype.destroy = function() {
    this.dragger_.dispose();
};


ol.event.addSequenceProvider('drag', ol.event.Drag);