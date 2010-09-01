/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
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
     * APIProperty: stopSingle
     * {Boolean} Stop other listeners from being notified of clicks.  Default
     *     is false.  If true, any click listeners registered before this one
     *     will not be notified of *any* click event (associated with double
     *     or single clicks).
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
     * Property: down
     * {<OpenLayers.Pixel>} The pixel location of the last mousedown.
     */
    down: null,
    
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
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.prototype.initialize.apply(this, arguments);
        // optionally register for mouseup and mousedown
        if(this.pixelTolerance != null) {
            this.mousedown = function(evt) {
                this.down = evt.xy;
                return true;
            };
        }
    },
    
    /**
     * Method: mousedown
     * Handle mousedown.  Only registered as a listener if pixelTolerance is
     *     a non-zero value at construction.
     *
     * Returns:
     * {Boolean} Continue propagating this event.
     */
    mousedown: null,

    /**
     * Method: mouseup
     * Handle mouseup.  Installed to support collection of right mouse events.
     * 
     * Returns:
     * {Boolean} Continue propagating this event.
     */
    mouseup:  function (evt) {
        var propagate = true;

        // Collect right mouse clicks from the mouseup
        //  IE - ignores the second right click in mousedown so using
        //  mouseup instead
        if (this.checkModifiers(evt) && 
            this.control.handleRightClicks && 
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
        return !this.stopSingle;
    },
    
    /**
     * Method: dblclick
     * Handle dblclick.  For a dblclick, we get two clicks in some browsers
     *     (FF) and one in others (IE).  So we need to always register for
     *     dblclick to properly handle single clicks.
     *     
     * Returns:
     * {Boolean} Continue propagating this event.
     */
    dblclick: function(evt) {
        if(this.passesTolerance(evt)) {
            if(this["double"]) {
                this.callback('dblclick', [evt]);
            }
            this.clearTimer();
        }
        return !this.stopDouble;
    },
    
    /**
     * Method: click
     * Handle click.
     *
     * Returns:
     * {Boolean} Continue propagating this event.
     */
    click: function(evt) {
        if(this.passesTolerance(evt)) {
            if(this.timerId != null) {
                // already received a click
                this.clearTimer();
            } else {
                // set the timer, send evt only if single is true
                //use a clone of the event object because it will no longer 
                //be a valid event object in IE in the timer callback
                var clickEvent = this.single ?
                    OpenLayers.Util.extend({}, evt) : null;
                this.timerId = window.setTimeout(
                    OpenLayers.Function.bind(this.delayedCall, this, clickEvent),
                    this.delay
                );
            }
        }
        return !this.stopSingle;
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
        if(this.pixelTolerance != null && this.down) {
            var dpx = Math.sqrt(
                Math.pow(this.down.x - evt.xy.x, 2) +
                Math.pow(this.down.y - evt.xy.y, 2)
            );
            if(dpx > this.pixelTolerance) {
                passes = false;
            }
        }
        return passes;
    },

    /**
     * Method: clearTimer
     * Clear the timer and set <timerId> to null.
     */
    clearTimer: function() {
        if(this.timerId != null) {
            window.clearTimeout(this.timerId);
            this.timerId = null;
        }
        if(this.rightclickTimerId != null) {
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
        if(evt) {
            this.callback('click', [evt]);
        }
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
            deactivated = true;
        }
        return deactivated;
    },

    CLASS_NAME: "OpenLayers.Handler.Click"
});
