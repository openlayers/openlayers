goog.provide('ol.event.drag');


/**
 * @return {Object} A drag sequence with dragstart, drag and dragend events.
 */
ol.event.drag = function() {
    var previous = null;
    
    function dragstart(evt) {
        if (!previous) {
            evt.dx = 0;
            evt.dy = 0;
            previous = {screenX: evt.screenX, screenY: evt.screenY};
            if (evt.stopPropagation) {
                evt.stopPropagation();
            } else {
                evt.cancelBubble = true;
            }
            return true;
        }
    }
    
    function drag(evt) {
        if (previous) {
            evt.dx = evt.screenX - previous.screenX;
            evt.dy = evt.screenY - previous.screenY;
            previous = {screenX: evt.screenX, screenY: evt.screenY};
            return true;
        }
    }
    
    function dragend(evt) {
        if (previous) {
            previous = null;
            return true;
        }
    }

    return {
        'dragstart': {
            'mousedown': dragstart,
            'touchstart': dragstart 
        },
        'drag': {
            'mousemove': drag,
            'touchmove': drag
        },
        'dragend': {
            'mouseup': dragend,
            'touchend': dragend
        }
    };
};