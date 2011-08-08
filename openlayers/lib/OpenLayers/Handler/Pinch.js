/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the Clear BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Handler.js
 */

/**
 * Class: OpenLayers.Handler.Pinch
 * The pinch handler is used to deal with sequences of browser events related
 *     to pinch gestures. The handler is used by controls that want to know
 *     when a pinch sequence begins, when a pinch is happening, and when it has
 *     finished.
 *
 * Controls that use the pinch handler typically construct it with callbacks
 *     for 'start', 'move', and 'done'.  Callbacks for these keys are
 *     called when the pinch begins, with each change, and when the pinch is
 *     done.
 *
 * Create a new pinch handler with the <OpenLayers.Handler.Pinch> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Handler>
 */
OpenLayers.Handler.Pinch = OpenLayers.Class(OpenLayers.Handler, {

    /**
     * Property: started
     * {Boolean} When a touchstart event is received, we want to record it,
     *     but not set 'pinching' until the touchmove get started after
     *     starting.
     */
    started: false,

    /**
     * Property: stopDown
     * {Boolean} Stop propagation of touchstart events from getting to
     *     listeners on the same element. Default is false.
     */
    stopDown: false,

    /**
     * Property: pinching
     * {Boolean}
     */
    pinching: false,

    /**
     * Property: last
     * {Object} Object that store informations related to pinch last touch.
     */
    last: null,

    /**
     * Property: start
     * {Object} Object that store informations related to pinch touchstart.
     */
    start: null,

    /**
     * Constructor: OpenLayers.Handler.Pinch
     * Returns OpenLayers.Handler.Pinch
     *
     * Parameters:
     * control - {<OpenLayers.Control>} The control that is making use of
     *     this handler.  If a handler is being used without a control, the
     *     handlers setMap method must be overridden to deal properly with
     *     the map.
     * callbacks - {Object} An object containing functions to be called when
     *     the pinch operation start, change, or is finished. The callbacks
     *     should expect to receive an object argument, which contains
     *     information about scale, distance, and position of touch points.
     * options - {Object}
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: touchstart
     * Handle touchstart events
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    touchstart: function(evt) {
        var propagate = true;
        this.pinching = false;
        if (OpenLayers.Event.isMultiTouch(evt)) {
            this.started = true;
            this.last = this.start = {
                distance: this.getDistance(evt.touches),
                delta: 0,
                scale: 1
            };
            this.callback("start", [evt, this.start]);
            propagate = !this.stopDown;
        } else {
            this.started = false;
            this.start = null;
            this.last = null;
        }
        // prevent document dragging
        OpenLayers.Event.stop(evt);
        return propagate;
    },

    /**
     * Method: touchmove
     * Handle touchmove events
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    touchmove: function(evt) {
        if (this.started && OpenLayers.Event.isMultiTouch(evt)) {
            this.pinching = true;
            var current = this.getPinchData(evt);
            this.callback("move", [evt, current]);
            this.last = current;
            // prevent document dragging
            OpenLayers.Event.stop(evt);
        }
        return true;
    },

    /**
     * Method: touchend
     * Handle touchend events
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    touchend: function(evt) {
        if (this.started) {
            this.started = false;
            this.pinching = false;
            this.callback("done", [evt, this.start, this.last]);
            this.start = null;
            this.last = null;
        }
        return true;
    },

    /**
     * Method: activate
     * Activate the handler.
     *
     * Returns:
     * {Boolean} The handler was successfully activated.
     */
    activate: function() {
        var activated = false;
        if (OpenLayers.Handler.prototype.activate.apply(this, arguments)) {
            this.pinching = false;
            activated = true;
        }
        return activated;
    },

    /**
     * Method: deactivate
     * Deactivate the handler.
     *
     * Returns:
     * {Boolean} The handler was successfully deactivated.
     */
    deactivate: function() {
        var deactivated = false;
        if (OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            this.started = false;
            this.pinching = false;
            this.start = null;
            this.last = null;
            deactivated = true;
        }
        return deactivated;
    },

    /**
     * Method: getDistance
     * Get the distance in pixels between two touches.
     *
     * Parameters:
     * touches - {Array(Object)}
     *
     * Returns:
     * {Number} The distance in pixels.
     */
    getDistance: function(touches) {
        var t0 = touches[0];
        var t1 = touches[1];
        return Math.sqrt(
            Math.pow(t0.clientX - t1.clientX, 2) +
            Math.pow(t0.clientY - t1.clientY, 2)
        );
    },


    /**
     * Method: getPinchData
     * Get informations about the pinch event.
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Object} Object that contains data about the current pinch.
     */
    getPinchData: function(evt) {
        var distance = this.getDistance(evt.touches);
        var scale = distance / this.start.distance;
        return {
            distance: distance,
            delta: this.last.distance - distance,
            scale: scale
        };
    },

    CLASS_NAME: "OpenLayers.Handler.Pinch"
});

