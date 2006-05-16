OpenLayers.Events = Class.create();

OpenLayers.Events.prototype = {
    // hash of Array(Function)
    listeners: null,

    // OpenLayers.Map
    map: null,

    // DOMElement
    div: null,

    // supported events
    BROWSER_EVENTS: [
        "mouseover", "mouseout",
        "mousedown", "mouseup", "mousemove", 
        "click", "dblclick"
    ],
    MAP_EVENTS: [ 
        "mouseover", "mouseout", 
        "mousedown", "mouseup", "mousemove",
        "click", "dblclick"
    ],

    /**
    * @param {OpenLayers.Map} map
    * @param {DOMElement} div
    */
    initialize: function (map, div) {
        this.listeners = {};
        this.map      = map;
        this.div      = div;
        for (var i = 0; i < this.MAP_EVENTS.length; i++) {
            this.listeners[ this.MAP_EVENTS[i] ] = [];
        }
        for (var i = 0; i < this.BROWSER_EVENTS.length; i++) {
            var eventName = this.BROWSER_EVENTS[i];
            Event.observe(div, eventName, 
                this.handleBrowserEvent.bindAsEventListener(this));
        }
    },

    /**
    * @param {str} eventName
    * @param {Object} obj
    * @param {Function} func
    */
    register: function (eventName, obj, func) {
        var listeners = this.listeners[eventName];
        listeners.push( func.bindAsEventListener(obj) );
    },

    /**
    * @param {event} evt
    */
    handleBrowserEvent: function (evt) {
        evt.xy = this.getMousePosition(evt); 
        this.triggerMapEvent(evt.type, evt)
    },

    /**
    * @param {event} evt
    */
    getMousePosition: function (evt) {
        var offsets = Position.page(this.div); 
        return new OpenLayers.Pixel(
                        evt.clientX - offsets[0], 
                        evt.clientY - offsets[1]); 
    },

    /**
    * @param {str} type
    * @param {event} evt
    */
    triggerMapEvent: function (type, evt) {
        evt.map = this.map;

        var listeners = this.listeners[type];
        for (var i = 0; i < listeners.length; i++) {
            var callback = listeners[i];
            callback(evt);
        }
    }
};
