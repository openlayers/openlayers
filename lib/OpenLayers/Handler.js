/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * Base class to construct a higher-level handler for event sequences.
 * Handlers are created by controls, which ultimately have the responsibility
 * of making changes to the map.
 * 
 * @class
 */
OpenLayers.Handler = OpenLayers.Class.create();

OpenLayers.Handler.MOD_NONE  = 0;
OpenLayers.Handler.MOD_SHIFT = 1;
OpenLayers.Handler.MOD_CTRL  = 2;
OpenLayers.Handler.MOD_ALT   = 4;

OpenLayers.Handler.prototype = {
    /**
     * @type String
     * @private
     */
    id: null,
        
    /**
     * The control that initialized this handler.
     * @type OpenLayers.Control
     * @private
     */
    control: null,

    /**
     * @type OpenLayers.Map
     * @private
     */
    map: null,

    /**
     * @type integer
     */
//    keyMask: OpenLayers.Handler.MOD_NONE,
    keyMask: null,

    /**
     * @type Boolean
     * @private 
     */
    active: false,

    /**
     * @constructor
     *
     * @param {OpenLayers.Control} control
     * @param {Object} callbacks A hash of callback functions
     * @param {Object} options
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
    
    setMap: function (map) {
        this.map = map;
    },

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
     * Turn on the handler.  Returns false if the handler was already active.
     *
     * @type {Boolean}
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
     * Turn off the handler.  Returns false if the handler was already inactive.
     * 
     * @type {Boolean}
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
    * trigger the control's named callback with the given arguments
    */
    callback: function (name, args) {
        if (this.callbacks[name]) {
            this.callbacks[name].apply(this.control, args);
        }
    },

    /**
    * register an event on the map
    */
    register: function (name, method) {
        // TODO: deal with registerPriority in 3.0
        this.map.events.registerPriority(name, this, method);   
    },

    /**
    * unregister an event from the map
    */
    unregister: function (name, method) {
        this.map.events.unregister(name, this, method);   
    },

    /**
     * 
     */
    destroy: function () {
        // eliminate circular references
        this.control = this.map = null;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Handler"
};
