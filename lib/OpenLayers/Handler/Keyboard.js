/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Events.js
 *
 * Class: OpenLayers.handler.Keyboard 
 * 
 * Inherits from:
 *  - <OpenLayers.Handler> 
 */
OpenLayers.Handler.Keyboard = OpenLayers.Class.create();
OpenLayers.Handler.Keyboard.prototype = OpenLayers.Class.inherit( OpenLayers.Handler, {

    /* http://www.quirksmode.org/js/keys.html explains key x-browser
        key handling quirks in pretty nice detail */

    /* supported named callbacks are: keyup, keydown, keypress */

    /** 
     * Constant: KEY_EVENTS
     * keydown, keypress, keyup
     */
    KEY_EVENTS: ["keydown", "keypress", "keyup"],

    /** 
    * Property: eventListener
    * *Private*. {Function}
    */
    eventListener: null,

    /** 
     * Constructor: OpenLayers.Handler.Keyboard
     */ 
    initialize: function () {
        OpenLayers.Handler.prototype.initialize.apply(this, arguments);
        // cache the bound event listener method so it can be unobserved later
        this.eventListener = this.handleKeyEvent.bindAsEventListener(this);
    },
    
    /**
     * Method: destroy
     */
    destroy: function() {
        this.deactivate();
        this.eventListener = null;
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /**
     * Method: activate
     */
    activate: function() {
        if (OpenLayers.Handler.prototype.activate.apply(this, arguments)) {
            for (var i = 0; i < this.KEY_EVENTS.length; i++) {
                OpenLayers.Event.observe(
                    window, this.KEY_EVENTS[i], this.eventListener);
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
        if (OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            for (var i = 0; i < this.KEY_EVENTS.length; i++) {
                OpenLayers.Event.stopObserving(
                    document, this.KEY_EVENTS[i], this.eventListener);
            }
            return true;
        } else {
            return false;
        }
    },

    /**
     * Method: handleKeyEvent 
     */
    handleKeyEvent: function (evt) {
        if (this.checkModifiers(evt)) {
            this.callback(evt.type, [evt.charCode || evt.keyCode]);
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Handler.Keyboard"
});
