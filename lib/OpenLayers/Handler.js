/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @requires OpenLayers/Events.js
 * 
 * Class: OpenLayers.Handler
 * Base class to construct a higher-level handler for event sequences.  All
 *     handlers have activate and deactivate methods.  In addition, they have
 *     methods named like browser events.  When a handler is activated, any
 *     additional methods named like a browser event is registered as a
 *     listener for the corresponding event.  When a handler is deactivated,
 *     those same methods are unregistered as event listeners.
 *
 * Handlers also typically have a callbacks object with keys named like
 *     the abstracted events or event sequences that they are in charge of
 *     handling.  The controls that wrap handlers define the methods that
 *     correspond to these abstract events - so instead of listening for
 *     individual browser events, they only listen for the abstract events
 *     defined by the handler.
 *     
 * Handlers are created by controls, which ultimately have the responsibility
 *     of making changes to the the state of the application.  Handlers
 *     themselves may make temporary changes, but in general are expected to
 *     return the application in the same state that they found it.
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
     * APIProperty: control
     * {<OpenLayers.Control>}. The control that initialized this handler.  The
     *     control is assumed to have a valid map property - that map is used
     *     in the handler's own setMap method.
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
     * control - {<OpenLayers.Control>} The control that initialized this
     *     handler.  The control is assumed to have a valid map property; that
     *     map is used in the handler's own setMap method.
     * callbacks - {Object} An object whose properties correspond to abstracted
     *     events or sequences of browser events.  The values for these
     *     properties are functions defined by the control that get called by
     *     the handler.
     * options - {Object} An optional object whose properties will be set on
     *     the handler.
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
     * APIMethod: activate
     * Turn on the handler.  Returns false if the handler was already active.
     * 
     * Return: 
     * {Boolean} The handler was activated.
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
     * APIMethod: deactivate
     * Turn off the handler.  Returns false if the handler was already inactive.
     * 
     * Return:
     * {Boolean} The handler was deactivated.
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
    * Trigger the control's named callback with the given arguments
    *
    * Parameters:
    * name - {String} The key for the callback that is one of the properties
    *     of the handler's callbacks object.
    * args - {Array} An array of arguments with which to call the callback
    *     (defined by the control).
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
     * Deconstruct the handler.
     */
    destroy: function () {
        // eliminate circular references
        this.control = this.map = null;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Handler"
};
