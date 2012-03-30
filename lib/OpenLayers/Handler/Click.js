/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Handler.js
 */

/**
 * Class: OpenLayers.Handler.Click
 * A handler for mouse clicks.  The intention of this handler is to give
 *     controls more flexibility with handling clicks.  Browsers trigger
 *     click events twice for a double-click.  In addition, the mousedown,
 *     mousemove, mouseup sequence fires a click event.  With this handler,
 *     controls can decide whether to ignore clicks associated with a double
 *     click.  By setting a <pixelTolerance>, controls can also ignore clicks
 *     that include a drag.  Create a new instance with the
 *     <OpenLayers.Handler.Click> constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Handler> 
 */
OpenLayers.Handler.Click = OpenLayers.Class(OpenLayers.Handler, {
    /**
     * APIProperty: delay
     * {Number} Number of milliseconds between clicks before the event is
     *     considered a double-click.
     */
    delay: 300,
    
    /**
     * APIProperty: single
     * {Boolean} Handle single clicks.  Default is true.  If false, clicks
     * will not be reported.  If true, single-clicks will be reported.
     */
    single: true,
    
    /**
     * APIProperty: double
     * {Boolean} Handle double-clicks.  Default is false.
     */
    'double': false,
    
    /**
     * APIProperty: pixelTolerance
     * {Number} Maximum number of pixels between mouseup and mousedown for an
     *     event to be considered a click.  Default is 0.  If set to an
     *     integer value, clicks with a drag greater than the value will be
     *     ignored.  This property can only be set when the handler is
     *     constructed.
     */
    pixelTolerance: 0,
        
    /**
     * APIProperty: dblclickTolerance
     * {Number} Maximum distance in pixels between clicks for a sequence of 
     *     events to be considered a double click.  Default is 13.  If the
     *     distance between two clicks is greater than this value, a double-
     *     click will not be fired.
     */
    dblclickTolerance: 13,
        
    /**
     * APIProperty: stopSingle
     * {Boolean} Stop other listeners from being notified of clicks.  Default
     *     is false.  If true, any listeners registered before this one for 
     *     click or rightclick events will not be notified.
     */
    stopSingle: false,
    
    /**
     * APIProperty: stopDouble
     * {Boolean} Stop other listeners from being notified of double-clicks.
     *     Default is false.  If true, any click listeners registered before
     *     this one will not be notified of *any* double-click events.
     * 
     * The one caveat with stopDouble is that given a map with two click
     *     handlers, one with stopDouble true and the other with stopSingle
     *     true, the stopSingle handler should be activated last to get
     *     uniform cross-browser performance.  Since IE triggers one click
     *     with a dblclick and FF triggers two, if a stopSingle handler is
     *     activated first, all it gets in IE is a single click when the
     *     second handler stops propagation on the dblclick.
     */
    stopDouble: false,

    /**
     * Property: timerId
     * {Number} The id of the timeout waiting to clear the <delayedCall>.
     */
    timerId: null,

    /**
     * Property: touch
     * {Boolean} When a touchstart event is fired, touch will be true and all
     *     mouse related listeners will do nothing.
     */
    touch: false,
    
    /**
     * Property: down
     * {Object} Object that store relevant information about the last
     *     mousedown or touchstart. Its 'xy' OpenLayers.Pixel property gives
     *     the average location of the mouse/touch event. Its 'touches'
     *     property records clientX/clientY of each touches.
     */
    down: null,

    /**
     * Property: last
     * {Object} Object that store relevant information about the last
     *     mousemove or touchmove. Its 'xy' OpenLayers.Pixel property gives
     *     the average location of the mouse/touch event. Its 'touches'
     *     property records clientX/clientY of each touches.
     */
    last: null,

    /** 
     * Property: first
     * {Object} When waiting for double clicks, this object will store 
     *     information about the first click in a two click sequence.
     */
    first: null,

    /**
     * Property: rightclickTimerId
     * {Number} The id of the right mouse timeout waiting to clear the 
     *     <delayedEvent>.
     */
    rightclickTimerId: null,
    
    /**
     * Constructor: OpenLayers.Handler.Click
     * Create a new click handler.
     * 
     * Parameters:
     * control - {<OpenLayers.Control>} The control that is making use of
     *     this handler.  If a handler is being used without a control, the
     *     handler's setMap method must be overridden to deal properly with
     *     the map.
     * callbacks - {Object} An object with keys corresponding to callbacks
     *     that will be called by the handler. The callbacks should
     *     expect to recieve a single argument, the click event.
     *     Callbacks for 'click' and 'dblclick' are supported.
     * options - {Object} Optional object whose properties will be set on the
     *     handler.
     */
    
    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Returns:
     * {Boolean} Continue propagating this event.
     */
    touchstart: function(evt) {
        if (!this.touch) {
            this.unregisterMouseListeners();
            this.touch = true;
        }
        this.down = this.getEventInfo(evt);
        this.last = this.getEventInfo(evt);
        return true;
    },
    
    /**
     * Method: touchmove
     *    Store position of last move, because touchend event can have
     *    an empty "touches" property.
     *
     * Returns:
     * {Boolean} Continue propagating this event.
     */
    touchmove: function(evt) {
        this.last = this.getEventInfo(evt);
        return true;
    },

    /**
     * Method: touchend
     *   Correctly set event xy property, and add lastTouches to have
     *   touches property from last touchstart or touchmove
     *
     * Returns:
     * {Boolean} Continue propagating this event.
     */
    touchend: function(evt) {
        // touchstart may not have been allowed to propagate
        if (this.down) {
            evt.xy = this.last.xy;
            evt.lastTouches = this.last.touches;
            this.handleSingle(evt);
            this.down = null;
        }
        return true;
    },
    
    /**
     * Method: unregisterMouseListeners
     * In a touch environment, we don't want to handle mouse events.
     */
    unregisterMouseListeners: function() {
        this.map.events.un({
            mousedown: this.mousedown,
            mouseup: this.mouseup,
            click: this.click,
            dblclick: this.dblclick,
            scope: this
        });
    },

    /**
     * Method: mousedown
     * Handle mousedown.
     *
     * Returns:
     * {Boolean} Continue propagating this event.
     */
    mousedown: function(evt) {
        this.down = this.getEventInfo(evt);
        this.last = this.getEventInfo(evt);
        return true;
    },

    /**
     * Method: mouseup
     * Handle mouseup.  Installed to support collection of right mouse events.
     * 
     * Returns:
     * {Boolean} Continue propagating this event.
     */
    mouseup: function (evt) {
        var propagate = true;

        // Collect right mouse clicks from the mouseup
        //  IE - ignores the second right click in mousedown so using
        //  mouseup instead
        if (this.checkModifiers(evt) && this.control.handleRightClicks &&
           OpenLayers.Event.isRightClick(evt)) {
            propagate = this.rightclick(evt);
        }

        return propagate;
    },
    
    /**
     * Method: rightclick
     * Handle rightclick.  For a dblrightclick, we get two clicks so we need 
     *     to always register for dblrightclick to properly handle single 
     *     clicks.
     *     
     * Returns:
     * {Boolean} Continue propagating this event.
     */
    rightclick: function(evt) {
        if(this.passesTolerance(evt)) {
           if(this.rightclickTimerId != null) {
                //Second click received before timeout this must be 
                // a double click
                this.clearTimer();
                this.callback('dblrightclick', [evt]);
                return !this.stopDouble;
            } else { 
                //Set the rightclickTimerId, send evt only if double is 
                // true else trigger single
                var clickEvent = this['double'] ?
                    OpenLayers.Util.extend({}, evt) : 
                    this.callback('rightclick', [evt]);

                var delayedRightCall = OpenLayers.Function.bind(
                    this.delayedRightCall, 
                    this, 
                    clickEvent
                );
                this.rightclickTimerId = window.setTimeout(
                    delayedRightCall, this.delay
                );
            } 
        }
        return !this.stopSingle;
    },
    
    /**
     * Method: delayedRightCall
     * Sets <rightclickTimerId> to null.  And optionally triggers the 
     *     rightclick callback if evt is set.
     */
    delayedRightCall: function(evt) {
        this.rightclickTimerId = null;
        if (evt) {
           this.callback('rightclick', [evt]);
        }
    },
    
    /**
     * Method: click
     * Handle click events from the browser.  This is registered as a listener
     *     for click events and should not be called from other events in this
     *     handler.
     *
     * Returns:
     * {Boolean} Continue propagating this event.
     */
    click: function(evt) {
        if (!this.last) {
            this.last = this.getEventInfo(evt);
        }
        this.handleSingle(evt);
        return !this.stopSingle;
    },

    /**
     * Method: dblclick
     * Handle dblclick.  For a dblclick, we get two clicks in some browsers
     *     (FF) and one in others (IE).  So we need to always register for
     *     dblclick to properly handle single clicks.  This method is registered
     *     as a listener for the dblclick browser event.  It should *not* be
     *     called by other methods in this handler.
     *     
     * Returns:
     * {Boolean} Continue propagating this event.
     */
    dblclick: function(evt) {
        this.handleDouble(evt);
        return !this.stopDouble;
    },
    
    /** 
     * Method: handleDouble
     * Handle double-click sequence.
     */
    handleDouble: function(evt) {
        if (this.passesDblclickTolerance(evt)) {
            if (this["double"]) {
                this.callback("dblclick", [evt]);
            }
            // to prevent a dblclick from firing the click callback in IE
            this.clearTimer();
        }
    },
    
    /** 
     * Method: handleSingle
     * Handle single click sequence.
     */
    handleSingle: function(evt) {
        if (this.passesTolerance(evt)) {
            if (this.timerId != null) {
                // already received a click
                if (this.last.touches && this.last.touches.length === 1) {
                    // touch device, no dblclick event - this may be a double
                    if (this["double"]) {
                        // on Android don't let the browser zoom on the page
                        OpenLayers.Event.stop(evt);
                    }
                    this.handleDouble(evt);
                }
                // if we're not in a touch environment we clear the click timer
                // if we've got a second touch, we'll get two touchend events
                if (!this.last.touches || this.last.touches.length !== 2) {
                    this.clearTimer();
                }
            } else {
                // remember the first click info so we can compare to the second
                this.first = this.getEventInfo(evt);
                // set the timer, send evt only if single is true
                //use a clone of the event object because it will no longer 
                //be a valid event object in IE in the timer callback
                var clickEvent = this.single ?
                    OpenLayers.Util.extend({}, evt) : null;
                this.queuePotentialClick(clickEvent);
            }
        }
    },
    
    /** 
     * Method: queuePotentialClick
     * This method is separated out largely to make testing easier (so we
     *     don't have to override window.setTimeout)
     */
    queuePotentialClick: function(evt) {
        this.timerId = window.setTimeout(
            OpenLayers.Function.bind(this.delayedCall, this, evt),
            this.delay
        );
    },

    /**
     * Method: passesTolerance
     * Determine whether the event is within the optional pixel tolerance.  Note
     *     that the pixel tolerance check only works if mousedown events get to
     *     the listeners registered here.  If they are stopped by other elements,
     *     the <pixelTolerance> will have no effect here (this method will always
     *     return true).
     *
     * Returns:
     * {Boolean} The click is within the pixel tolerance (if specified).
     */
    passesTolerance: function(evt) {
        var passes = true;
        if (this.pixelTolerance != null && this.down && this.down.xy) {
            passes = this.pixelTolerance >= this.down.xy.distanceTo(evt.xy);
            // for touch environments, we also enforce that all touches
            // start and end within the given tolerance to be considered a click
            if (passes && this.touch && 
                this.down.touches.length === this.last.touches.length) {
                // the touchend event doesn't come with touches, so we check
                // down and last
                for (var i=0, ii=this.down.touches.length; i<ii; ++i) {
                    if (this.getTouchDistance(
                            this.down.touches[i], 
                            this.last.touches[i]
                        ) > this.pixelTolerance) {
                        passes = false;
                        break;
                    }
                }
            }
        }
        return passes;
    },
    
    /** 
     * Method: getTouchDistance
     *
     * Returns:
     * {Boolean} The pixel displacement between two touches.
     */
    getTouchDistance: function(from, to) {
        return Math.sqrt(
            Math.pow(from.clientX - to.clientX, 2) +
            Math.pow(from.clientY - to.clientY, 2)
        );
    },
    
    /**
     * Method: passesDblclickTolerance
     * Determine whether the event is within the optional double-cick pixel 
     *     tolerance.
     *
     * Returns:
     * {Boolean} The click is within the double-click pixel tolerance.
     */
    passesDblclickTolerance: function(evt) {
        var passes = true;
        if (this.down && this.first) {
            passes = this.down.xy.distanceTo(this.first.xy) <= this.dblclickTolerance;
        }
        return passes;
    },

    /**
     * Method: clearTimer
     * Clear the timer and set <timerId> to null.
     */
    clearTimer: function() {
        if (this.timerId != null) {
            window.clearTimeout(this.timerId);
            this.timerId = null;
        }
        if (this.rightclickTimerId != null) {
            window.clearTimeout(this.rightclickTimerId);
            this.rightclickTimerId = null;
        }
    },
    
    /**
     * Method: delayedCall
     * Sets <timerId> to null.  And optionally triggers the click callback if
     *     evt is set.
     */
    delayedCall: function(evt) {
        this.timerId = null;
        if (evt) {
            this.callback("click", [evt]);
        }
    },

    /**
     * Method: getEventInfo
     * This method allows us to store event information without storing the
     *     actual event.  In touch devices (at least), the same event is 
     *     modified between touchstart, touchmove, and touchend.
     *
     * Returns:
     * {Object} An object with event related info.
     */
    getEventInfo: function(evt) {
        var touches;
        if (evt.touches) {
            var len = evt.touches.length;
            touches = new Array(len);
            var touch;
            for (var i=0; i<len; i++) {
                touch = evt.touches[i];
                touches[i] = {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                };
            }
        }
        return {
            xy: evt.xy,
            touches: touches
        };
    },

    /**
     * APIMethod: deactivate
     * Deactivate the handler.
     *
     * Returns:
     * {Boolean} The handler was successfully deactivated.
     */
    deactivate: function() {
        var deactivated = false;
        if(OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            this.clearTimer();
            this.down = null;
            this.first = null;
            this.last = null;
            this.touch = false;
            deactivated = true;
        }
        return deactivated;
    },

    CLASS_NAME: "OpenLayers.Handler.Click"
});
