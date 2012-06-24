goog.provide('ol.event.Scroll');

goog.require('ol.event.ISequence');
goog.require('ol.event');

goog.require('goog.events.MouseWheelHandler');


/**
 * Event sequence that provides a 'scroll' event. Event objects have 'deltaX'
 * and 'deltaY' values with the scroll delta since the previous 'scroll' event.
 *
 * @constructor
 * @param {ol.event.Events} target The Events instance that handles events.
 * @implements {ol.event.ISequence}
 * @export
 */
ol.event.Scroll = function(target) {    
    var element = target.getElement(),
        handler = new goog.events.MouseWheelHandler(element);

    /**
     * @private
     * @type {goog.events.MouseWheelHandler}
     */
    this.handler_ = handler;
    
    goog.events.listen(handler,
        goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
        function(evt) {
            evt.type = 'scroll';
            evt.target = element;
            target.triggerEvent(evt.type, evt);
        }
    );
};

/** @inheritDoc */
ol.event.Scroll.prototype.destroy = function() {
    this.handler_.dispose();
    delete this.handler_;
};


ol.event.addSequenceProvider('scroll', ol.event.Scroll);