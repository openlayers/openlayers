/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Events.js
 */

/**
 * Class: OpenLayers.handler.Keyboard
 * A handler for keyboard events.  Create a new instance with the
 *     <OpenLayers.Handler.Keyboard> constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Handler> 
 */
OpenLayers.Handler.Keyboard = OpenLayers.Class(OpenLayers.Handler, {

    /* http://www.quirksmode.org/js/keys.html explains key x-browser
        key handling quirks in pretty nice detail */

    /** 
     * Constant: KEY_EVENTS
     * keydown, keypress, keyup
     */
    KEY_EVENTS: ["keydown", "keyup"],

    /** 
    * Property: eventListener
    * {Function}
    */
    eventListener: null,

    /**
     * Constructor: OpenLayers.Handler.Keyboard
     * Returns a new keyboard handler.
     * 
     * Parameters:
     * control - {<OpenLayers.Control>} The control that is making use of
     *     this handler.  If a handler is being used without a control, the
     *     handlers setMap method must be overridden to deal properly with
     *     the map.
     * callbacks - {Object} An object containing a single function to be
     *     called when the drag operation is finished. The callback should
     *     expect to recieve a single argument, the pixel location of the event.
     *     Callbacks for 'keydown', 'keypress', and 'keyup' are supported.
     * options - {Object} Optional object whose properties will be set on the
     *     handler.
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.prototype.initialize.apply(this, arguments);
        // cache the bound event listener method so it can be unobserved later
        this.eventListener = OpenLayers.Function.bindAsEventListener(
            this.handleKeyEvent, this
        );
    },
    
    /**
     * Method: destroy
     */
    destroy: function() {
        this.deactivate();
        this.eventListener = null;
        OpenLayers.Handler.prototype.destroy.apply(this, arguments);
    },

    /**
     * Method: activate
     */
    activate: function() {
        if (OpenLayers.Handler.prototype.activate.apply(this, arguments)) {
            for (var i=0, len=this.KEY_EVENTS.length; i<len; i++) {
                OpenLayers.Event.observe(
                    document, this.KEY_EVENTS[i], this.eventListener);
            }
            return true;
        } else {
            return false;
        }
    },

    /**
     * Method: deactivate
     */
    deactivate: function() {
        var deactivated = false;
        if (OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            for (var i=0, len=this.KEY_EVENTS.length; i<len; i++) {
                OpenLayers.Event.stopObserving(
                    document, this.KEY_EVENTS[i], this.eventListener);
            }
            deactivated = true;
        }
        return deactivated;
    },

    /**
     * Method: handleKeyEvent 
     */
    handleKeyEvent: function (evt) {
        if (this.checkModifiers(evt)) {
            this.callback(evt.type, [evt]);
        }
    },

    CLASS_NAME: "OpenLayers.Handler.Keyboard"
});
