/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/* @requires OpenLayers/Util.js
 */

OpenLayers.Event = {
  KEY_BACKSPACE: 8,
  KEY_TAB:       9,
  KEY_RETURN:   13,
  KEY_ESC:      27,
  KEY_LEFT:     37,
  KEY_UP:       38,
  KEY_RIGHT:    39,
  KEY_DOWN:     40,
  KEY_DELETE:   46,

  element: function(event) {
    return event.target || event.srcElement;
  },

  isLeftClick: function(event) {
    return (((event.which) && (event.which == 1)) ||
            ((event.button) && (event.button == 1)));
  },

  pointerX: function(event) {
    return event.pageX || (event.clientX +
      (document.documentElement.scrollLeft || document.body.scrollLeft));
  },

  pointerY: function(event) {
    return event.pageY || (event.clientY +
      (document.documentElement.scrollTop || document.body.scrollTop));
  },

  stop: function(event) {
    if (event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.returnValue = false;
      event.cancelBubble = true;
    }
  },

  // find the first node with the given tagName, starting from the
  // node the event was triggered on; traverses the DOM upwards
  findElement: function(event, tagName) {
    var element = OpenLayers.Event.element(event);
    while (element.parentNode && (!element.tagName ||
        (element.tagName.toUpperCase() != tagName.toUpperCase())))
      element = element.parentNode;
    return element;
  },

  /** A hashtable cach of the event observers, keyed by element.id
   * 
   * @type Object
   */
  observers: false,

  _observeAndCache: function(element, name, observer, useCapture) {
    if (!this.observers) this.observers = new Object();

    //if there is not yet a hash entry for this element, add one
    if (!this.observers[element.id]) {
        this.observers[element.id] = new Array();
    }
    //add a new observer to this element's list
    this.observers[element.id].push({
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

    /** Given the id of an element to stop observing, cycle through the 
     *   element's cached observers, calling stopObserving on each one, 
     *   skipping those entries which can no longer be removed.
     * 
     * @param {String} elementId
     */
    stopObservingElement: function(elementId) {
        var elementObservers = OpenLayers.Event.observers[elementId];
        if (elementObservers) {
            var i=0;
            while(i < elementObservers.length) {
                var entry = elementObservers[0];
                var args = new Array(entry.element,
                                     entry.name,
                                     entry.observer,
                                     entry.useCapture);
                var removed = OpenLayers.Event.stopObserving.apply(this, args);
                if (!removed) {
                    i++;
                }
            }
        }
    },

    /** Cycle through all the element entries in the events cache and call
     *   stopObservingElement on each. 
     */
    unloadCache: function() {
        if (!OpenLayers.Event.observers) return;
        for (var elementId in OpenLayers.Event.observers) {
            OpenLayers.Event.stopObservingElement.apply(this, [elementId]);
        }
        OpenLayers.Event.observers = false;
    },

  observe: function(elementParam, name, observer, useCapture) {
    var element = OpenLayers.Util.getElement(elementParam);
    useCapture = useCapture || false;

    if (name == 'keypress' &&
        (navigator.appVersion.match(/Konqueror|Safari|KHTML/)
        || element.attachEvent))
      name = 'keydown';

    this._observeAndCache(element, name, observer, useCapture);
  },

    /**
     * @param {DOMElement || String} elementParam
     * @param {String} name
     * @param {function} observer
     * @param {Boolean} useCapture
     * 
     * @returns Whether or not the event observer was removed
     * @type Boolean
     */
    stopObserving: function(elementParam, name, observer, useCapture) {
        var foundEntry = false;
        var element = OpenLayers.Util.getElement(elementParam);
        if (element) {
    
            useCapture = useCapture || false;
        
            if (name == 'keypress') {
                if ( navigator.appVersion.match(/Konqueror|Safari|KHTML/) || 
                     element.detachEvent) {
                  name = 'keydown';
                }
            }
        
            // find element's entry in this.observers cache and remove it
            var elementObservers = OpenLayers.Event.observers[element.id];
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
                            OpenLayers.Event.observers[element.id] = null;
                        }
                        break; 
                        foundEntry = true;
                    }
                    i++;           
                }
            }
        
            //actually remove the event listener from browser
            if (element.removeEventListener) {
                element.removeEventListener(name, observer, useCapture);
            } else if (element && element.detachEvent) {
                element.detachEvent('on' + name, observer);
            }
        }
        return foundEntry;
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Event"
};

/* prevent memory leaks in IE */
OpenLayers.Event.observe(window, 'unload', OpenLayers.Event.unloadCache, false);

if (window.Event) {
  OpenLayers.Util.extend(window.Event, OpenLayers.Event);
} else {
  var Event = OpenLayers.Event;
}

/**
 * @class
 */
OpenLayers.Events = OpenLayers.Class.create();
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
    * @type Function: bound event handler attached to elements
    * @private
    */
    eventHandler: null,

    /** @type Boolean */
    fallThrough: null,

    /**
     * @constructor 
     * 
     * @param {OpenLayers.Map} object The js object to which this Events object
     *                                is being added
     * @param {DOMElement} element A dom element to respond to browser events
     * @param {Array} eventTypes Array of custom application events
     * @param {Boolean} fallThrough Allow events to fall through after these 
     *                              have been handled?
     */
    initialize: function (object, element, eventTypes, fallThrough) {
        this.object     = object;
        this.element    = element;
        this.eventTypes = eventTypes;
        this.fallThrough = fallThrough;
        this.listeners  = new Object();

        // keep a bound copy of handleBrowserEvent() so that we can
        // pass the same function to both Event.observe() and .stopObserving()
        this.eventHandler = this.handleBrowserEvent.bindAsEventListener(this);

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
     * 
     */
    destroy: function () {
        if (this.element) {
            this.detachFromElement();
        }
        this.element = null;

        this.listeners = null;
        this.object = null;
        this.eventTypes = null;
        this.fallThrough = null;
        this.eventHandler = null;
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
            OpenLayers.Event.observe(element, eventType, this.eventHandler);
        }
        // disable dragstart in IE so that mousedown/move/up works normally
        OpenLayers.Event.observe(element, "dragstart", OpenLayers.Event.stop);
    },
    
    /**
     * @private
     */
    detachFromElement: function () {
        for (var i = 0; i < this.BROWSER_EVENTS.length; i++) {
            var eventType = this.BROWSER_EVENTS[i];

            OpenLayers.Event.stopObserving(
                this.element, eventType, this.eventHandler);
        }

        // re-enable dragstart in IE
        OpenLayers.Event.stopObserving(
            this.element, "dragstart", OpenLayers.Event.stop);
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
     *   TODO: get rid of this in 3.0 - Decide whether listeners should be 
     *         called in the order they were registered or in reverse order.
     * 
     * @param {String} type Name of the event to register
     * @param {Object} obj The object to bind the context to for the callback#.
     *                     If no object is specified, default is the Events's 
     *                     'object' property.
     * @param {Function} func The callback function. If no callback is 
     *                        specified, this function does nothing.
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
        // get a clone of the listeners array to
        // allow for splicing during callbacks
        var listeners = (this.listeners[type]) ?
                            this.listeners[type].slice() : null;
        if ((listeners != null) && (listeners.length > 0)) {
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
            // don't fall through to other DOM elements
            if (!this.fallThrough) {           
                OpenLayers.Util.safeStopPropagation(evt);
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
            this.element.offsets = OpenLayers.Util.pagePosition(this.element);
            this.element.offsets[0] += (document.documentElement.scrollLeft
                         || document.body.scrollLeft);
            this.element.offsets[1] += (document.documentElement.scrollTop
                         || document.body.scrollTop);
        }
        return new OpenLayers.Pixel(
            (evt.clientX + (document.documentElement.scrollLeft
                         || document.body.scrollLeft)) - this.element.offsets[0], 
            (evt.clientY + (document.documentElement.scrollTop
                         || document.body.scrollTop)) - this.element.offsets[1] 
        ); 
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Events"
};
