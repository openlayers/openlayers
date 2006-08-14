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

    /** Hashtable of Array(Function): events listener functions 
     * @type Object */
    listeners: null,

    /** @type Object: the code object issuing application events */
    object: null,

    /** @type DOMElement: the DOM element receiving browser events */
    element: null,

    /** @type Array: list of support application events */
    eventTypes: null,


    /**
     * @constructor 
     * 
     * @param {OpenLayers.Map} object The js object to which this Events object
     *                                is being added
     * @param {DOMElement} element A dom element to respond to browser events
     * @param {Array} eventTypes Array of custom application events
     */
    initialize: function (object, element, eventTypes) {
        this.object     = object;
        this.element    = element;
        this.eventTypes = eventTypes;
        this.listeners  = new Object();

        // if eventTypes is specified, create a listeners list for each 
        // custom application event.
        if (this.eventTypes != null) 
            for (var i = 0; i < this.eventTypes.length; i++)
                this.listeners[ this.eventTypes[i] ] = new Array();

        // if a dom element is specified, add a listeners list 
        // for browser events on the element and register them
        if (this.element != null)
            this.attachToElement(element);
    },

    /**
    * @param {HTMLDOMElement} element a DOM element to attach browser events to
    */
    attachToElement: function (element) {
        for (var i = 0; i < this.BROWSER_EVENTS.length; i++) {
            var eventType = this.BROWSER_EVENTS[i];

            // every browser event has a corresponding application event 
            // (whether it's listened for or not).
            if (this.listeners[eventType] == null)
                this.listeners[eventType] = new Array();

            // use Prototype to register the event cross-browser
            Event.observe(element, eventType, 
                this.handleBrowserEvent.bindAsEventListener(this));
        }
        // disable dragstart in IE so that mousedown/move/up works normally
        Event.observe(element, "dragstart", Event.stop);
    },

    /**
     * @param {String} type Name of the event to register
     * @param {Object} obj The object to bind the context to for the callback#.
     *                     If no object is specified, default is the Events's 
     *                     'object' property.
     * @param {Function} func The callback function. If no callback is 
     *                        specified, this function does nothing.
     * 
     * #When the event is triggered, the 'func' function will be called, in the
     *   context of 'obj'. Imagine we were to register an event, specifying an 
     *   OpenLayers.Bounds Object as 'obj'. When the event is triggered, the 
     *   context in the callback function will be our Bounds object. This means
     *   that within our callback function, we can access the properties and 
     *   methods of the Bounds object through the "this" variable. So our 
     *   callback could execute something like: 
     *   
     *     leftStr = "Left: " + this.left;
     *   
     *                   or
     *  
     *     centerStr = "Center: " + this.getCenterLonLat();
     * 
     */
    register: function (type, obj, func) {

        if (func != null) {
            if (obj == null)  {
                obj = this.object;
            }
            var listeners = this.listeners[type];
            if (listeners != null) {
                listeners.push( {obj: obj, func: func} );
            }
        }
    },
    
    /**
     * @param {String} type
     * @param {Object} obj If none specified, defaults to this.object
     * @param {Function} func
     */
    unregister: function (type, obj, func) {
        if (obj == null)  {
            obj = this.object;
        }
        var listeners = this.listeners[type];
        if (listeners != null) {
            for (var i = 0; i < listeners.length; i++) {
                if (listeners[i].obj == obj && listeners[i].func == func) {
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
    },

    /** Remove all listeners for a given event type. If type is not registered,
     *   does nothing.
     * 
     * @param {String} type
     */
    remove: function(type) {
        if (this.listeners[type] != null) {
            this.listeners[type] = new Array();
        }
    },

    /** Trigger a specified registered event
     * 
     * @param {String} type
     * @param {Event} evt
     */
    triggerEvent: function (type, evt) {

        // prep evt object with object & div references
        if (evt == null) {
            evt = new Object();
        }
        evt.object = this.object;
        evt.element = this.element;

        // execute all callbacks registered for specified type
        var listeners = this.listeners[type];
        if (listeners != null) {
    
            for (var i = 0; i < listeners.length; i++) {
                var callback = listeners[i];
                var continueChain;
                if (callback.obj != null) {
                    // use the 'call' method to bind the context to callback.obj
                    continueChain = callback.func.call(callback.obj, evt);
                } else {
                    continueChain = callback.func(evt);
                }
    
                if ((continueChain != null) && (continueChain == false)) {
                    // if callback returns false, execute no more callbacks.
                    break;
                }
            }
        }
    },

    /** Basically just a wrapper to the triggerEvent() function, but takes 
     *   care to set a property 'xy' on the event with the current mouse 
     *   position.
     * 
     * @private
     * 
     * @param {Event} evt
     */
    handleBrowserEvent: function (evt) {
        evt.xy = this.getMousePosition(evt); 
        this.triggerEvent(evt.type, evt)
    },

    /**
     * @private 
     * 
     * @param {Event} evt
     * 
     * @returns The current xy coordinate of the mouse, adjusted for offsets
     * @type OpenLayers.Pixel
     */
    getMousePosition: function (evt) {
        if (!this.element.offsets) {
            this.element.offsets = Position.page(this.element);
        }
        return new OpenLayers.Pixel(
                        evt.clientX - this.element.offsets[0], 
                        evt.clientY - this.element.offsets[1]); 
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Events"
};
