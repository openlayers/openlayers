/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * Class: OpenLayers.Handler
 * Base class to construct a higher-level handler for event sequences.
 * Handlers are created by controls, which ultimately have the responsibility
 * of making changes to the map.
 */
OpenLayers.Handler = OpenLayers.Class.create();

OpenLayers.Handler.MOD_NONE  = 0;
OpenLayers.Handler.MOD_SHIFT = 1;
OpenLayers.Handler.MOD_CTRL  = 2;
OpenLayers.Handler.MOD_ALT   = 4;

OpenLayers.Handler.prototype = {
    /**
     * Property: id
     * {String}
     */
    id: null,
        
    /**
     * Property: control
     * {<OpenLayers.Control>}. The control that initialized this
     * handler.
     */
    control: null,

    /**
     * Property: map
     * {<OpenLayers.Map>}
     */
    map: null,

    /**
     * Property: keyMask
     * {Integer}
     */
    keyMask: null,

    /**
     * Property: active
     * {Boolean}
     */
    active: false,

    /**
     * Constructor: OpenLayers.Handler
     * Construct a handler.
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 
     * callbacks - {Object} A hash of callback functions
     * options - {Object} 
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Util.extend(this, options);
        this.control = control;
        this.callbacks = callbacks;
        if (control.map) {
            this.setMap(control.map); 
        }

        OpenLayers.Util.extend(this, options);
        
        this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
    },
    
    /**
     * Method: setMap
     */
    setMap: function (map) {
        this.map = map;
    },

    /**
     * Method: checkModifiers 
     */
    checkModifiers: function (evt) {
        if(this.keyMask == null) {
            return true;
        }
        /* calculate the keyboard modifier mask for this event */
        var keyModifiers =
            (evt.shiftKey ? OpenLayers.Handler.MOD_SHIFT : 0) |
            (evt.ctrlKey  ? OpenLayers.Handler.MOD_CTRL  : 0) |
            (evt.altKey   ? OpenLayers.Handler.MOD_ALT   : 0);
    
        /* if it differs from the handler object's key mask,
           bail out of the event handler */
        return (keyModifiers == this.keyMask);
    },

    /**
     * Method: activate
     * Turn on the handler.  Returns false if the handler was already active.
     * 
     * Return: 
     * {Boolean} 
     */
    activate: function() {
        if(this.active) {
            return false;
        }
        // register for event handlers defined on this class.
        var events = OpenLayers.Events.prototype.BROWSER_EVENTS;
        for (var i = 0; i < events.length; i++) {
            if (this[events[i]]) {
                this.register(events[i], this[events[i]]); 
            }
        } 
        this.active = true;
        return true;
    },
    
    /**
     * Method: deactivate
     * Turn off the handler.  Returns false if the handler was already inactive.
     * 
     * Return: {Boolean}
     */
    deactivate: function() {
        if(!this.active) {
            return false;
        }
        // unregister event handlers defined on this class.
        var events = OpenLayers.Events.prototype.BROWSER_EVENTS;
        for (var i = 0; i < events.length; i++) {
            if (this[events[i]]) {
                this.unregister(events[i], this[events[i]]); 
            }
        } 
        this.active = false;
        return true;
    },

    /**
    * Method: callback
    * trigger the control's named callback with the given arguments
    */
    callback: function (name, args) {
        if (this.callbacks[name]) {
            this.callbacks[name].apply(this.control, args);
        }
    },

    /**
    * Method: register
    * register an event on the map
    */
    register: function (name, method) {
        // TODO: deal with registerPriority in 3.0
        this.map.events.registerPriority(name, this, method);   
    },

    /**
    * Method: unregister
    * unregister an event from the map
    */
    unregister: function (name, method) {
        this.map.events.unregister(name, this, method);   
    },

    /**
     * Method: destroy
     */
    destroy: function () {
        // eliminate circular references
        this.control = this.map = null;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Handler"
};
