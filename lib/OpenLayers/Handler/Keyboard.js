/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * Handler for dragging a rectangle across the map.  Keyboard is displayed 
 * on mouse down, moves on mouse move, and is finished on mouse up.
 * 
 * @class
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Events.js
 */
OpenLayers.Handler.Keyboard = OpenLayers.Class.create();
OpenLayers.Handler.Keyboard.prototype = OpenLayers.Class.inherit( OpenLayers.Handler, {

    /* http://www.quirksmode.org/js/keys.html explains key x-browser
        key handling quirks in pretty nice detail */

    /* supported named callbacks are: keyup, keydown, keypress */

    /** constant */
    KEY_EVENTS: ["keydown", "keypress", "keyup"],

    /** @type Function
    *   @private
    */
    eventListener: null,

    initialize: function () {
        OpenLayers.Handler.prototype.initialize.apply(this, arguments);
        // cache the bound event listener method so it can be unobserved later
        this.eventListener = this.handleKeyEvent.bindAsEventListener(this);
    },
    
    /**
     * 
     */
    destroy: function() {
        this.deactivate();
        this.eventListener = null;
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

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

    handleKeyEvent: function (evt) {
        if (this.checkModifiers(evt)) {
            this.callback(evt.type, [evt.charCode || evt.keyCode]);
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Handler.Keyboard"
});
