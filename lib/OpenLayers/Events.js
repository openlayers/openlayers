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
        if (this.eventTypes != null) {
            
            for (var i = 0; i < this.eventTypes.length; i++) {
                this.listeners[ this.eventTypes[i] ] = new Array();
            }
        }


        // if a dom element is specified, add a listeners list 
        // for browser events on the element and register them
        if (this.element != null) {

            for (var i = 0; i < this.BROWSER_EVENTS.length; i++) {
                var eventType = this.BROWSER_EVENTS[i];
    
                // every browser event has a corresponding application event 
                // (whether it's listened for or not).
                this.listeners[ eventType ] = new Array();
    
                // use Prototype to register the event cross-browser
                Event.observe(this.element, eventType, 
                    this.handleBrowserEvent.bindAsEventListener(this));
            }
    
            // disable dragstart in IE so that mousedown/move/up works normally
            Event.observe(this.element, "dragstart", Event.stop);
        }
    },

    /**
     * @param {String} type Name of the event to register
     * @param {Object} obj The object to bind the context to for the callback#
     * @param {Function} func The callback function
     * 
     * #When the event is triggered, the 'func' function will be called, in the
     *   context of 'obj'. Imagine we were to register an event, specifying an 
     *   OpenLayers.Bounds Object as 'obj'. When the event is triggered, the 
     *   context in the callback function will be our Bounds object. This means
     *   that within our callback function, we can access the properties and 
     *   methods of the Bounds object through the "this" variable. So our 
     *   callback could execute something like: 
     *   
     *     alert("Left: " + this.left);
     *   
     *                   or
     *  
     *     alert("Center: " + this.getCenterLonLat());
     * 
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

        // prep evt object with object & div references
        if (evt == null) {
            evt = new Object();
        }
        evt.object = this.object;
        evt.element = this.element;

        // execute all callbacks registered for specified type
        var listeners = this.listeners[type];
        for (var i = 0; i < listeners.length; i++) {
            var callback = listeners[i];

            // use the 'call' method to bind the context to callback.obj
            var continueChain = callback.func.call(callback.obj, evt);

            if ((continueChain != null) && (continueChain == false)) {
                // if callback returns false, execute no more callbacks.
                break;
            }
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
