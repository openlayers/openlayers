/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Util.js
 */

/**
 * Namespace: OpenLayers.Event
 * Utility functions for event handling.
 */
OpenLayers.Event = {

    /** 
     * Property: observers 
     * {Object} A hashtable cache of the event observers. Keyed by
     * element._eventCacheID 
     */
    observers: false,
    
    /** 
     * Constant: KEY_BACKSPACE 
     * {int} 
     */
    KEY_BACKSPACE: 8,

    /** 
     * Constant: KEY_TAB 
     * {int} 
     */
    KEY_TAB: 9,

    /** 
     * Constant: KEY_RETURN 
     * {int} 
     */
    KEY_RETURN: 13,

    /** 
     * Constant: KEY_ESC 
     * {int} 
     */
    KEY_ESC: 27,

    /** 
     * Constant: KEY_LEFT 
     * {int} 
     */
    KEY_LEFT: 37,

    /** 
     * Constant: KEY_UP 
     * {int} 
     */
    KEY_UP: 38,

    /** 
     * Constant: KEY_RIGHT 
     * {int} 
     */
    KEY_RIGHT: 39,

    /** 
     * Constant: KEY_DOWN 
     * {int} 
     */
    KEY_DOWN: 40,

    /** 
     * Constant: KEY_DELETE 
     * {int} 
     */
    KEY_DELETE: 46,


    /**
     * Method: element
     * Cross browser event element detection.
     * 
     * Parameters:
     * event - {Event} 
     * 
     * Returns:
     * {DOMElement} The element that caused the event 
     */
    element: function(event) {
        return event.target || event.srcElement;
    },

    /**
     * Method: isLeftClick
     * Determine whether event was caused by a left click. 
     *
     * Parameters:
     * event - {Event} 
     * 
     * Returns:
     * {Boolean}
     */
    isLeftClick: function(event) {
        return (((event.which) && (event.which == 1)) ||
                ((event.button) && (event.button == 1)));
    },

    /**
     * Method: isRightClick
     * Determine whether event was caused by a right mouse click. 
     *
     * Parameters:
     * event - {Event} 
     * 
     * Returns:
     * {Boolean}
     */
     isRightClick: function(event) {
        return (((event.which) && (event.which == 3)) ||
                ((event.button) && (event.button == 2)));
    },
     
    /**
     * Method: stop
     * Stops an event from propagating. 
     *
     * Parameters: 
     * event - {Event} 
     * allowDefault - {Boolean} If true, we stop the event chain but 
     *                               still allow the default browser 
     *                               behaviour (text selection, radio-button 
     *                               clicking, etc)
     *                               Default false
     */
    stop: function(event, allowDefault) {
        
        if (!allowDefault) { 
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        }
                
        if (event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.cancelBubble = true;
        }
    },

    /** 
     * Method: findElement
     * 
     * Parameters:
     * event - {Event} 
     * tagName - {String} 
     * 
     * Returns:
     * {DOMElement} The first node with the given tagName, starting from the
     * node the event was triggered on and traversing the DOM upwards
     */
    findElement: function(event, tagName) {
        var element = OpenLayers.Event.element(event);
        while (element.parentNode && (!element.tagName ||
              (element.tagName.toUpperCase() != tagName.toUpperCase()))){
            element = element.parentNode;
        }
        return element;
    },

    /** 
     * Method: observe
     * 
     * Parameters:
     * elementParam - {DOMElement || String} 
     * name - {String} 
     * observer - {function} 
     * useCapture - {Boolean} 
     */
    observe: function(elementParam, name, observer, useCapture) {
        var element = OpenLayers.Util.getElement(elementParam);
        useCapture = useCapture || false;

        if (name == 'keypress' &&
           (navigator.appVersion.match(/Konqueror|Safari|KHTML/)
           || element.attachEvent)) {
            name = 'keydown';
        }

        //if observers cache has not yet been created, create it
        if (!this.observers) {
            this.observers = {};
        }

        //if not already assigned, make a new unique cache ID
        if (!element._eventCacheID) {
            var idPrefix = "eventCacheID_";
            if (element.id) {
                idPrefix = element.id + "_" + idPrefix;
            }
            element._eventCacheID = OpenLayers.Util.createUniqueID(idPrefix);
        }

        var cacheID = element._eventCacheID;

        //if there is not yet a hash entry for this element, add one
        if (!this.observers[cacheID]) {
            this.observers[cacheID] = [];
        }

        //add a new observer to this element's list
        this.observers[cacheID].push({
            'element': element,
            'name': name,
            'observer': observer,
            'useCapture': useCapture
        });

        //add the actual browser event listener
        if (element.addEventListener) {
            element.addEventListener(name, observer, useCapture);
        } else if (element.attachEvent) {
            element.attachEvent('on' + name, observer);
        }
    },

    /** 
     * Method: stopObservingElement
     * Given the id of an element to stop observing, cycle through the 
     *   element's cached observers, calling stopObserving on each one, 
     *   skipping those entries which can no longer be removed.
     * 
     * parameters:
     * elementParam - {DOMElement || String} 
     */
    stopObservingElement: function(elementParam) {
        var element = OpenLayers.Util.getElement(elementParam);
        var cacheID = element._eventCacheID;

        this._removeElementObservers(OpenLayers.Event.observers[cacheID]);
    },

    /**
     * Method: _removeElementObservers
     *
     * Parameters:
     * elementObservers - {Array(Object)} Array of (element, name, 
     *                                         observer, usecapture) objects, 
     *                                         taken directly from hashtable
     */
    _removeElementObservers: function(elementObservers) {
        if (elementObservers) {
            for(var i = elementObservers.length-1; i >= 0; i--) {
                var entry = elementObservers[i];
                var args = new Array(entry.element,
                                     entry.name,
                                     entry.observer,
                                     entry.useCapture);
                var removed = OpenLayers.Event.stopObserving.apply(this, args);
            }
        }
    },

    /**
     * Method: stopObserving
     * 
     * Parameters:
     * elementParam - {DOMElement || String} 
     * name - {String} 
     * observer - {function} 
     * useCapture - {Boolean} 
     *  
     * Returns:
     * {Boolean} Whether or not the event observer was removed
     */
    stopObserving: function(elementParam, name, observer, useCapture) {
        useCapture = useCapture || false;
    
        var element = OpenLayers.Util.getElement(elementParam);
        var cacheID = element._eventCacheID;

        if (name == 'keypress') {
            if ( navigator.appVersion.match(/Konqueror|Safari|KHTML/) || 
                 element.detachEvent) {
              name = 'keydown';
            }
        }

        // find element's entry in this.observers cache and remove it
        var foundEntry = false;
        var elementObservers = OpenLayers.Event.observers[cacheID];
        if (elementObservers) {
    
            // find the specific event type in the element's list
            var i=0;
            while(!foundEntry && i < elementObservers.length) {
                var cacheEntry = elementObservers[i];
    
                if ((cacheEntry.name == name) &&
                    (cacheEntry.observer == observer) &&
                    (cacheEntry.useCapture == useCapture)) {
    
                    elementObservers.splice(i, 1);
                    if (elementObservers.length == 0) {
                        delete OpenLayers.Event.observers[cacheID];
                    }
                    foundEntry = true;
                    break; 
                }
                i++;           
            }
        }
    
        //actually remove the event listener from browser
        if (foundEntry) {
            if (element.removeEventListener) {
                element.removeEventListener(name, observer, useCapture);
            } else if (element && element.detachEvent) {
                element.detachEvent('on' + name, observer);
            }
        }
        return foundEntry;
    },
    
    /** 
     * Method: unloadCache
     * Cycle through all the element entries in the events cache and call
     *   stopObservingElement on each. 
     */
    unloadCache: function() {
        // check for OpenLayers.Event before checking for observers, because
        // OpenLayers.Event may be undefined in IE if no map instance was
        // created
        if (OpenLayers.Event && OpenLayers.Event.observers) {
            for (var cacheID in OpenLayers.Event.observers) {
                var elementObservers = OpenLayers.Event.observers[cacheID];
                OpenLayers.Event._removeElementObservers.apply(this, 
                                                           [elementObservers]);
            }
            OpenLayers.Event.observers = false;
        }
    },

    CLASS_NAME: "OpenLayers.Event"
};

/* prevent memory leaks in IE */
OpenLayers.Event.observe(window, 'unload', OpenLayers.Event.unloadCache, false);

// FIXME: Remove this in 3.0. In 3.0, Event.stop will no longer be provided
// by OpenLayers.
if (window.Event) {
    OpenLayers.Util.applyDefaults(window.Event, OpenLayers.Event);
} else {
    var Event = OpenLayers.Event;
}

/**
 * Class: OpenLayers.Events
 */
OpenLayers.Events = OpenLayers.Class({

    /** 
     * Constant: BROWSER_EVENTS
     * {Array(String)} supported events 
     */
    BROWSER_EVENTS: [
        "mouseover", "mouseout",
        "mousedown", "mouseup", "mousemove", 
        "click", "dblclick", "rightclick", "dblrightclick",
        "resize", "focus", "blur"
    ],

    /** 
     * Property: listeners 
     * {Object} Hashtable of Array(Function): events listener functions  
     */
    listeners: null,

    /** 
     * Property: object 
     * {Object}  the code object issuing application events 
     */
    object: null,

    /** 
     * Property: element 
     * {DOMElement}  the DOM element receiving browser events 
     */
    element: null,

    /** 
     * Property: eventTypes 
     * {Array(String)}  list of support application events 
     */
    eventTypes: null,

    /** 
     * Property: eventHandler 
     * {Function}  bound event handler attached to elements 
     */
    eventHandler: null,

    /** 
     * APIProperty: fallThrough 
     * {Boolean} 
     */
    fallThrough: null,

    /** 
     * APIProperty: includeXY
     * {Boolean} Should the .xy property automatically be created for browser
     *    mouse events? In general, this should be false. If it is true, then
     *    mouse events will automatically generate a '.xy' property on the 
     *    event object that is passed. (Prior to OpenLayers 2.7, this was true
     *    by default.) Otherwise, you can call the getMousePosition on the
     *    relevant events handler on the object available via the 'evt.object'
     *    property of the evt object. So, for most events, you can call:
     *    function named(evt) { 
     *        this.xy = this.object.events.getMousePosition(evt) 
     *    } 
     *
     *    This option typically defaults to false for performance reasons:
     *    when creating an events object whose primary purpose is to manage
     *    relatively positioned mouse events within a div, it may make
     *    sense to set it to true.
     *
     *    This option is also used to control whether the events object caches
     *    offsets. If this is false, it will not: the reason for this is that
     *    it is only expected to be called many times if the includeXY property
     *    is set to true. If you set this to true, you are expected to clear 
     *    the offset cache manually (using this.clearMouseCache()) if:
     *        the border of the element changes
     *        the location of the element in the page changes
    */
    includeXY: false,      

    /**
     * Method: clearMouseListener
     * A version of <clearMouseCache> that is bound to this instance so that
     *     it can be used with <OpenLayers.Event.observe> and
     *     <OpenLayers.Event.stopObserving>.
     */
    clearMouseListener: null,

    /**
     * Constructor: OpenLayers.Events
     * Construct an OpenLayers.Events object.
     *
     * Parameters:
     * object - {Object} The js object to which this Events object  is being
     * added element - {DOMElement} A dom element to respond to browser events
     * eventTypes - {Array(String)} Array of custom application events 
     * fallThrough - {Boolean} Allow events to fall through after these have
     *                         been handled?
     * options - {Object} Options for the events object.
     */
    initialize: function (object, element, eventTypes, fallThrough, options) {
        OpenLayers.Util.extend(this, options);
        this.object     = object;
        this.fallThrough = fallThrough;
        this.listeners  = {};

        // keep a bound copy of handleBrowserEvent() so that we can
        // pass the same function to both Event.observe() and .stopObserving()
        this.eventHandler = OpenLayers.Function.bindAsEventListener(
            this.handleBrowserEvent, this
        );
        
        // to be used with observe and stopObserving
        this.clearMouseListener = OpenLayers.Function.bind(
            this.clearMouseCache, this
        );

        // if eventTypes is specified, create a listeners list for each 
        // custom application event.
        this.eventTypes = [];
        if (eventTypes != null) {
            for (var i=0, len=eventTypes.length; i<len; i++) {
                this.addEventType(eventTypes[i]);
            }
        }
        
        // if a dom element is specified, add a listeners list 
        // for browser events on the element and register them
        if (element != null) {
            this.attachToElement(element);
        }
    },

    /**
     * APIMethod: destroy
     */
    destroy: function () {
        if (this.element) {
            OpenLayers.Event.stopObservingElement(this.element);
            if(this.element.hasScrollEvent) {
                OpenLayers.Event.stopObserving(
                    window, "scroll", this.clearMouseListener
                );
            }
        }
        this.element = null;

        this.listeners = null;
        this.object = null;
        this.eventTypes = null;
        this.fallThrough = null;
        this.eventHandler = null;
    },

    /**
     * APIMethod: addEventType
     * Add a new event type to this events object.
     * If the event type has already been added, do nothing.
     * 
     * Parameters:
     * eventName - {String}
     */
    addEventType: function(eventName) {
        if (!this.listeners[eventName]) {
            this.eventTypes.push(eventName);
            this.listeners[eventName] = [];
        }
    },

    /**
     * Method: attachToElement
     *
     * Parameters:
     * element - {HTMLDOMElement} a DOM element to attach browser events to
     */
    attachToElement: function (element) {
        if(this.element) {
            OpenLayers.Event.stopObservingElement(this.element);
        }
        this.element = element;
        for (var i=0, len=this.BROWSER_EVENTS.length; i<len; i++) {
            var eventType = this.BROWSER_EVENTS[i];

            // every browser event has a corresponding application event 
            // (whether it's listened for or not).
            this.addEventType(eventType);
            
            // use Prototype to register the event cross-browser
            OpenLayers.Event.observe(element, eventType, this.eventHandler);
        }
        // disable dragstart in IE so that mousedown/move/up works normally
        OpenLayers.Event.observe(element, "dragstart", OpenLayers.Event.stop);
    },
    
    /**
     * APIMethod: on
     * Convenience method for registering listeners with a common scope.
     *     Internally, this method calls <register> as shown in the examples
     *     below.
     *
     * Example use:
     * (code)
     * // register a single listener for the "loadstart" event
     * events.on({"loadstart", loadStartListener});
     *
     * // this is equivalent to the following
     * events.register("loadstart", undefined, loadStartListener);
     *
     * // register multiple listeners to be called with the same `this` object
     * events.on({
     *     "loadstart": loadStartListener,
     *     "loadend": loadEndListener,
     *     scope: object
     * });
     *
     * // this is equivalent to the following
     * events.register("loadstart", object, loadStartListener);
     * events.register("loadstart", object, loadEndListener);
     * (end)
     */
    on: function(object) {
        for(var type in object) {
            if(type != "scope") {
                this.register(type, object.scope, object[type]);
            }
        }
    },

    /**
     * APIMethod: register
     * Register an event on the events object.
     *
     * When the event is triggered, the 'func' function will be called, in the
     * context of 'obj'. Imagine we were to register an event, specifying an 
     * OpenLayers.Bounds Object as 'obj'. When the event is triggered, the 
     * context in the callback function will be our Bounds object. This means
     * that within our callback function, we can access the properties and 
     * methods of the Bounds object through the "this" variable. So our 
     * callback could execute something like: 
     * :    leftStr = "Left: " + this.left;
     *   
     *                   or
     *  
     * :    centerStr = "Center: " + this.getCenterLonLat();
     *
     * Parameters:
     * type - {String} Name of the event to register
     * obj - {Object} The object to bind the context to for the callback#.
     *                     If no object is specified, default is the Events's 
     *                     'object' property.
     * func - {Function} The callback function. If no callback is 
     *                        specified, this function does nothing.
     * 
     * 
     */
    register: function (type, obj, func) {

        if ( (func != null) && 
             (OpenLayers.Util.indexOf(this.eventTypes, type) != -1) ) {

            if (obj == null)  {
                obj = this.object;
            }
            var listeners = this.listeners[type];
            listeners.push( {obj: obj, func: func} );
        }
    },

    /**
     * APIMethod: registerPriority
     * Same as register() but adds the new listener to the *front* of the
     *     events queue instead of to the end.
     *    
     *     TODO: get rid of this in 3.0 - Decide whether listeners should be 
     *     called in the order they were registered or in reverse order.
     *
     *
     * Parameters:
     * type - {String} Name of the event to register
     * obj - {Object} The object to bind the context to for the callback#.
     *                If no object is specified, default is the Events's 
     *                'object' property.
     * func - {Function} The callback function. If no callback is 
     *                   specified, this function does nothing.
     */
    registerPriority: function (type, obj, func) {

        if (func != null) {
            if (obj == null)  {
                obj = this.object;
            }
            var listeners = this.listeners[type];
            if (listeners != null) {
                listeners.unshift( {obj: obj, func: func} );
            }
        }
    },
    
    /**
     * APIMethod: un
     * Convenience method for unregistering listeners with a common scope.
     *     Internally, this method calls <unregister> as shown in the examples
     *     below.
     *
     * Example use:
     * (code)
     * // unregister a single listener for the "loadstart" event
     * events.un({"loadstart", loadStartListener});
     *
     * // this is equivalent to the following
     * events.unregister("loadstart", undefined, loadStartListener);
     *
     * // unregister multiple listeners with the same `this` object
     * events.un({
     *     "loadstart": loadStartListener,
     *     "loadend": loadEndListener,
     *     scope: object
     * });
     *
     * // this is equivalent to the following
     * events.unregister("loadstart", object, loadStartListener);
     * events.unregister("loadstart", object, loadEndListener);
     * (end)
     */
    un: function(object) {
        for(var type in object) {
            if(type != "scope") {
                this.unregister(type, object.scope, object[type]);
            }
        }
    },

    /**
     * APIMethod: unregister
     *
     * Parameters:
     * type - {String} 
     * obj - {Object} If none specified, defaults to this.object
     * func - {Function} 
     */
    unregister: function (type, obj, func) {
        if (obj == null)  {
            obj = this.object;
        }
        var listeners = this.listeners[type];
        if (listeners != null) {
            for (var i=0, len=listeners.length; i<len; i++) {
                if (listeners[i].obj == obj && listeners[i].func == func) {
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
    },

    /** 
     * Method: remove
     * Remove all listeners for a given event type. If type is not registered,
     *     does nothing.
     *
     * Parameters:
     * type - {String} 
     */
    remove: function(type) {
        if (this.listeners[type] != null) {
            this.listeners[type] = [];
        }
    },

    /**
     * APIMethod: triggerEvent
     * Trigger a specified registered event.  
     * 
     * Parameters:
     * type - {String} 
     * evt - {Event}
     *
     * Returns:
     * {Boolean} The last listener return.  If a listener returns false, the
     *     chain of listeners will stop getting called.
     */
    triggerEvent: function (type, evt) {
        var listeners = this.listeners[type];

        // fast path
        if(!listeners || listeners.length == 0) {
            return;
        }

        // prep evt object with object & div references
        if (evt == null) {
            evt = {};
        }
        evt.object = this.object;
        evt.element = this.element;
        if(!evt.type) {
            evt.type = type;
        }
    
        // execute all callbacks registered for specified type
        // get a clone of the listeners array to
        // allow for splicing during callbacks
        var listeners = listeners.slice(), continueChain;
        for (var i=0, len=listeners.length; i<len; i++) {
            var callback = listeners[i];
            // bind the context to callback.obj
            continueChain = callback.func.apply(callback.obj, [evt]);

            if ((continueChain != undefined) && (continueChain == false)) {
                // if callback returns false, execute no more callbacks.
                break;
            }
        }
        // don't fall through to other DOM elements
        if (!this.fallThrough) {           
            OpenLayers.Event.stop(evt, true);
        }
        return continueChain;
    },

    /**
     * Method: handleBrowserEvent
     * Basically just a wrapper to the triggerEvent() function, but takes 
     *     care to set a property 'xy' on the event with the current mouse 
     *     position.
     *
     * Parameters:
     * evt - {Event} 
     */
    handleBrowserEvent: function (evt) {
        if (this.includeXY) {
            evt.xy = this.getMousePosition(evt);
        } 
        this.triggerEvent(evt.type, evt);
    },

    /**
     * APIMethod: clearMouseCache
     * Clear cached data about the mouse position. This should be called any 
     *     time the element that events are registered on changes position 
     *     within the page.
     */
    clearMouseCache: function() { 
        this.element.scrolls = null;
        this.element.lefttop = null;
        this.element.offsets = null;
    },      

    /**
     * Method: getMousePosition
     * 
     * Parameters:
     * evt - {Event} 
     * 
     * Returns:
     * {<OpenLayers.Pixel>} The current xy coordinate of the mouse, adjusted
     *                      for offsets
     */
    getMousePosition: function (evt) {
        if (!this.includeXY) {
            this.clearMouseCache();
        } else if (!this.element.hasScrollEvent) {
            OpenLayers.Event.observe(window, "scroll", this.clearMouseListener);
            this.element.hasScrollEvent = true;
        }
        
        if (!this.element.scrolls) {
            this.element.scrolls = [
                (document.documentElement.scrollLeft
                         || document.body.scrollLeft),
                (document.documentElement.scrollTop
                         || document.body.scrollTop)
            ];
        }

        if (!this.element.lefttop) {
            this.element.lefttop = [
                (document.documentElement.clientLeft || 0),
                (document.documentElement.clientTop  || 0)
            ];
        }
        
        if (!this.element.offsets) {
            this.element.offsets = OpenLayers.Util.pagePosition(this.element);
            this.element.offsets[0] += this.element.scrolls[0];
            this.element.offsets[1] += this.element.scrolls[1];
        }
        return new OpenLayers.Pixel(
            (evt.clientX + this.element.scrolls[0]) - this.element.offsets[0]
                         - this.element.lefttop[0], 
            (evt.clientY + this.element.scrolls[1]) - this.element.offsets[1]
                         - this.element.lefttop[1]
        ); 
    },

    CLASS_NAME: "OpenLayers.Events"
});
