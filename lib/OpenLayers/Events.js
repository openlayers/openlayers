OpenLayers.Events = Class.create();

OpenLayers.Events.prototype = {
    // Array: supported events
    BROWSER_EVENTS: [
        "mouseover", "mouseout",
        "mousedown", "mouseup", "mousemove", 
        "click", "dblclick",
        "resize", "focus", "blur"
    ],

    // hash of Array(Function): events listener functions
    listeners: null,

    // Object: the code object issuing application events
    object: null,

    // DOMElement: the DOM element receiving browser events
    div: null,

    // Array: list of support application events
    eventTypes: null,

    /**
    * @param {OpenLayers.Map} map
    * @param {DOMElement} div
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
    * @param {str} type
    * @param {Object} obj
    * @param {Function} func
    */
    register: function (type, obj, func) {
        if (func == null) {
            obj = this.object;
            func = obj;
        }
        var listeners = this.listeners[type];
        listeners.push( {obj: obj, func: func} );
    },
    
    unregister: function (type, obj, func) {
        var listeners = this.listeners[type];
        for (var i = 0; i < listeners.length; i++) {
            if (listeners[i].obj == obj && listeners[i].type == type) {
                listeners.splice(i, 1);
                break;
            }
        }
    },

    remove: function(type) {
        this.listeners[type].pop();
    },

    /**
    * @param {event} evt
    */
    handleBrowserEvent: function (evt) {
        evt.xy = this.getMousePosition(evt); 
        this.triggerEvent(evt.type, evt)
    },

    /**
    * @param {event} evt
    * 
    * @return {OpenLayers.Pixel}
    */
    getMousePosition: function (evt) {
        if (!this.div.offsets) {
            this.div.offsets = Position.page(this.div);
        }
        return new OpenLayers.Pixel(
                        evt.clientX - this.div.offsets[0], 
                        evt.clientY - this.div.offsets[1]); 
    },

    /**
    * @param {str} type
    * @param {event} evt
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
    }
};
