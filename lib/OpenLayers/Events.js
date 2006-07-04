/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
 
 /**
  * @class
  */
OpenLayers.Events = Class.create();
OpenLayers.Events.prototype = {

    /** @final @type Array: supported events */
    BROWSER_EVENTS: [
        "mouseover", "mouseout",
        "mousedown", "mouseup", "mousemove", 
        "click", "dblclick",
        "resize", "focus", "blur"
    ],

    /** @type Hash of Array(Function): events listener functions */
    listeners: null,

    /** @type Object: the code object issuing application events */
    object: null,

    /** @type DOMElement: the DOM element receiving browser events */
    div: null,

    /** @type Array: list of support application events */
    eventTypes: null,

    /**
     * @constructor 
     * 
     * @param {OpenLayers.Map} object The js object to which this Events object
     *                                is being added
     * @param {DOMElement} div A dom element to respond to browser events
     * @param {Array} eventTypes Array of custom application events
     */
    initialize: function (object, div, eventTypes) {
        this.listeners  = {};
        this.object     = object;
        this.div        = div;
        this.eventTypes = eventTypes;

        if (eventTypes) {
            for (var i = 0; i < this.eventTypes.length; i++) {
                // create a listener list for every custom application event
                this.listeners[ this.eventTypes[i] ] = [];
            }
        }

        for (var i = 0; i < this.BROWSER_EVENTS.length; i++) {
            var eventType = this.BROWSER_EVENTS[i];

            // every browser event has a corresponding application event 
            // (whether it's listened for or not).
            this.listeners[ eventType ] = [];

            Event.observe(div, eventType, 
                this.handleBrowserEvent.bindAsEventListener(this));
        }

        // disable dragstart in IE so that mousedown/move/up works normally
        Event.observe(div, "dragstart", Event.stop);
    },

    /**
     * @param {String} type Name of the event to register
     * @param {Object} obj The object to bind the context to for the callback
     * @param {Function} func The callback function
     */
    register: function (type, obj, func) {
        if (func == null) {
            obj = this.object;
            func = obj;
        }
        var listeners = this.listeners[type];
        listeners.push( {obj: obj, func: func} );
    },
    
    /**
     * @param {String} type
     * @param {Object} obj
     * @param {Function} func
     */
    unregister: function (type, obj, func) {
        var listeners = this.listeners[type];
        for (var i = 0; i < listeners.length; i++) {
            if (listeners[i].obj == obj && listeners[i].type == type) {
                listeners.splice(i, 1);
                break;
            }
        }
    },

    /**
     * @param {String} type
     */
    remove: function(type) {
        this.listeners[type].pop();
    },

    /** Trigger a specified registered event
     * 
     * @param {String} type
     * @param {Event} evt
     */
    triggerEvent: function (type, evt) {
        if (evt == null) {
            evt = {};
        }
        evt.object = this.object;
        evt.div = this.div;

        var listeners = this.listeners[type];
        for (var i = 0; i < listeners.length; i++) {
            var callback = listeners[i];
            var continueChain = callback.func.call(callback.obj, evt);
            if (continueChain != null && !continueChain) break;
        }
    },

    /** Basically just a wrapper to the triggerEvent() function, but takes 
     *   care to set a property 'xy' on the event with the current mouse 
     *   position.
     * 
     * @private
     * 
     * @param {event} evt
     */
    handleBrowserEvent: function (evt) {
        evt.xy = this.getMousePosition(evt); 
        this.triggerEvent(evt.type, evt)
    },

    /**
     * @private 
     * 
     * @param {event} evt
     * 
     * @returns The current xy coordinate of the mouse, adjusted for offsets
     * @type OpenLayers.Pixel
     */
    getMousePosition: function (evt) {
        if (!this.div.offsets) {
            this.div.offsets = Position.page(this.div);
        }
        return new OpenLayers.Pixel(
                        evt.clientX - this.div.offsets[0], 
                        evt.clientY - this.div.offsets[1]); 
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Events"
};
