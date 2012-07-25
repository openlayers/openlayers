goog.provide('ol.event.Drag');

goog.require('ol.event');
goog.require('ol.event.ISequence');

goog.require('goog.functions');
goog.require('goog.fx.Dragger');
goog.require('goog.fx.DragEvent');
goog.require('goog.fx.Dragger.EventType');


/**
 * Event sequence that provides a 'dragstart', 'drag' and 'dragend' events.
 * Event objects of the 'drag' events have 'deltaX' and 'deltaY' values with
 * the relative pixel movement since the previous 'drag' or 'dragstart' event.
 *
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
    
    // We want to swallow the click event that gets fired after dragging.
    var newSequence;
    function unregisterClickStopper() {
        target.unregister('click', goog.functions.FALSE, undefined, true);
    }
    
    dragger.defaultAction = function(x, y) {};                
    dragger.addEventListener(goog.fx.Dragger.EventType.START, function(evt) {
        evt.target = element;
        evt.type = 'dragstart';
        previousX = evt.clientX;
        previousY = evt.clientY;
        newSequence = true;
        target.triggerEvent(evt.type, evt);
    });
    dragger.addEventListener(goog.fx.Dragger.EventType.DRAG, function(evt) {
        evt.target = element;
        evt.deltaX = evt.clientX - previousX;
        evt.deltaY = evt.clientY - previousY;
        previousX = evt.clientX;
        previousY = evt.clientY;
        if (newSequence) {
            // Once we are in the drag sequence, we know that we need to
            // get rid of the click event that gets fired when we are done
            // dragging.
            target.register('click', goog.functions.FALSE, undefined, true);
            newSequence = false;
        }
        target.triggerEvent(evt.type, evt);
    });
    dragger.addEventListener(goog.fx.Dragger.EventType.END, function(evt) {
        evt.target = element;
        evt.type = 'dragend';
        target.triggerEvent(evt.type, evt);
        // Unregister the click stopper in the next cycle
        window.setTimeout(unregisterClickStopper, 0);
    });
    // Don't swallow the click event if our sequence cancels early.
    dragger.addEventListener(
        goog.fx.Dragger.EventType.EARLY_CANCEL, unregisterClickStopper
    );  
};

/** @inheritDoc */
ol.event.Drag.prototype.destroy = function() {
    this.dragger_.dispose();
    delete this.dragger_;
};


ol.event.addSequenceProvider('drag', ol.event.Drag);