goog.provide('ol.event');
goog.provide('ol.event.Events');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');
goog.require('goog.events.Listener');
goog.require('goog.style');


/**
 * Determine whether event was caused by a single touch
 *
 * @param {Event} evt
 * @return {boolean}
 */
ol.event.isSingleTouch = function(evt) {
    return evt.touches && evt.touches.length == 1;
};

/**
 * Determine whether event was caused by a multi touch
 *
 * @param {Event} evt
 * @return {boolean}
 */
ol.event.isMultiTouch = function(evt) {
    return evt.touches && evt.touches.length > 1;
};


/**
 * Construct an ol.event.Events instance.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {Object} object The object we are creating this instance for.
 * @param {!EventTarget=} opt_element An optional element that we want to listen to
 *     browser events on.
 * @param {boolean=} opt_includeXY Should the 'xy' property automatically be
 *     created for browser pointer events? In general, this should be false. If
 *     it is true, then pointer events will automatically generate an 'xy'
 *     property on the event object that is passed, which represents the
 *     relative position of the pointer to the {@code element}. Default is
 *     false.
 */
ol.event.Events = function(object, opt_element, opt_includeXY) {
    
    goog.base(this);

    /**
     * @private
     * @type {Object}
     * The object that this instance is bound to.
     */
    this.object_ = object;

    /**
     * @private
     * @type {EventTarget}
     * The element that this instance listens to mouse events on.
     */
    this.element_ = null;

    /**
     * @private
     * @type {boolean}
     */
    this.includeXY_ = goog.isDef(opt_includeXY) ? opt_includeXY : false;
    
    this.setElement(opt_element);
};
goog.inherits(ol.event.Events, goog.events.EventTarget);

/**
 * @return {Object} The object that this instance is bound to.
 */
ol.event.Events.prototype.getObject = function() {
    return this.object_;
};

/**
 * @param {boolean} includeXY
 */
ol.event.Events.prototype.setIncludeXY = function(includeXY) {
    this.includeXY_ = includeXY;
};

/**
 * @return {EventTarget} The element that this instance currently
 *     listens to browser events on.
 */
ol.event.Events.prototype.getElement = function() {
    return this.element_;
};

/**
 * Attach this instance to a DOM element. When called, all browser events fired
 * on the provided element will be relayed by this instance.
 *
 * @param {EventTarget=} opt_element A DOM element to attach
 *     browser events to. If called without this argument, all browser events
 *     will be detached from the element they are currently attached to.
 */
ol.event.Events.prototype.setElement = function(opt_element) {
    var t, types = goog.events.EventType;
    if (this.element_) {
        for (t in types) {
            // register the event cross-browser
            goog.events.unlisten(
                this.element_, types[t], this.handleBrowserEvent, false, this
            );
        }
        delete this.element_;
    }
    if (goog.isDef(opt_element)) {
        this.element_ = opt_element;
        for (t in types) {
            // register the event cross-browser
            goog.events.listen(
                opt_element, types[t], this.handleBrowserEvent, false, this
            );
        }
    }
};

/**
 * Convenience method for registering listeners with a common scope.
 * Internally, this method calls 'register' as shown in the examples below.
 *
 *     // register a single listener for the "loadstart" event
 *     events.on({"loadstart": loadStartListener});
 *
 *     // this is equivalent to the following
 *     events.register("loadstart", loadStartListener);
 *
 *     // register multiple listeners to be called with the same `this` object
 *     events.on({
 *         "loadstart": loadStartListener,
 *         "loadend": loadEndListener,
 *         scope: object
 *     });
 *
 *     // this is equivalent to the following
 *     events.register("loadstart", loadStartListener, object);
 *     events.register("loadend", loadEndListener, object);
 *
 * @param {Object} object
 */
ol.event.Events.prototype.on = function(object) {
    for (var type in object) {
        if (type != 'scope' && object.hasOwnProperty(type)) {
            this.register(type, object[type], object['scope']);
        }
    }
};

/**
 * Register a listener for an event.
 *
 * When the event is triggered, the 'listener' function will be called, in the
 * context of 'scope'. Imagine we were to register an event, specifying an 
 * ol.Bounds instance as 'scope'.  When the event is triggered, the context in
 * the listener function will be our Bounds instance.  This means that within
 * our listener function, we can access the properties and methods of the
 * Bounds instance through the 'this' keyword. So our listener could execute
 * something like:
 *
 *     var leftStr = "Left: " + this.minX();
 *
 * @param {string} type Name of the event to register.
 * @param {Function} listener The callback function.
 * @param {Object=} opt_scope The object to bind the context to for the
 *     listener. If no scope is specified, default is this intance's 'object'
 *     property.
 * @param {boolean=} opt_priority Register the listener as priority listener,
 *     so it gets executed before other listeners? Default is false.
 */
ol.event.Events.prototype.register = function(type, listener, opt_scope,
                                              opt_priority) {
    goog.events.listen(
        this, type, listener, opt_priority, opt_scope || this.object_
    );
};

/**
 * Convenience method for unregistering listeners with a common scope.
 * Internally, this method calls 'unregister' as shown in the examples below.
 * 
 *     // unregister a single listener for the "loadstart" event
 *     events.un({"loadstart": loadStartListener});
 *
 *     // this is equivalent to the following
 *     events.unregister("loadstart", loadStartListener);
 *
 *     // unregister multiple listeners with the same `this` object
 *     events.un({
 *         "loadstart": loadStartListener,
 *         "loadend": loadEndListener,
 *         scope: object
 *     });
 *
 *     // this is equivalent to the following
 *     events.unregister("loadstart", loadStartListener, object);
 *     events.unregister("loadend", loadEndListener, object);
 *
 * @param {Object} object
 */
ol.event.Events.prototype.un = function(object) {
    for (var type in object) {
        if (type != 'scope' && object.hasOwnProperty(type)) {
            this.unregister(type, object[type], object['scope']);
        }
    }
};

/**
 * Unregister a listener for an event
 *
 * @param {string} type Name of the event to unregister
 * @param {Function} listener The callback function.
 * @param {Object=} opt_scope The object to bind the context to for the
 *     listener. If no scope is specified, default is the event's default
 *     scope.
 */
ol.event.Events.prototype.unregister = function(type, listener, opt_scope) {
    goog.events.unlisten(
        this, type, listener, false, opt_scope || this.object_
    );
};

/**
 * Trigger a specified registered event.  
 *
 * @param {string} type The type of the event to trigger.
 * @param {Object} evt The event object that will be passed to listeners.
 *
 * @return {Boolean} The last listener return.  If a listener returns false,
 *     the chain of listeners will stop getting called.
 */
ol.event.Events.prototype.triggerEvent = function(type, evt) {
    var returnValue,
        listeners = goog.events.getListeners(this, type, true)
            .concat(goog.events.getListeners(this, type, false));
    if (arguments.length === 1) {
        evt = {type: type};
    }
    for (var i=0, ii=listeners.length; i<ii; ++i) {
        returnValue = listeners[i].handleEvent(evt);
        if (returnValue === false) {
            break;
        }
    }
    return returnValue;
};

/**
 * Basically just a wrapper to the triggerEvent() function, but takes 
 * care to set a property 'xy' on the event with the current mouse position.
 * 
 * @param {Event} evt
 */
ol.event.Events.prototype.handleBrowserEvent = function(evt) {
    if (!goog.isDef(this.element_)) {
        return;
    }
    var type = evt.type,
        listeners = goog.events.getListeners(this.element_, type, false)
            .concat(goog.events.getListeners(this.element_, type, true));
    if (!listeners || listeners.length === 0) {
        // noone's listening, bail out
        return;
    }
    // add clientX & clientY to all events - corresponds to average x, y
    var touches = evt.touches;
    if (touches && touches[0]) {
        var x = 0;
        var y = 0;
        var num = touches.length;
        var touch;
        for (var i=0; i<num; ++i) {
            touch = touches[i];
            x += touch.clientX;
            y += touch.clientY;
        }
        evt.clientX = x / num;
        evt.clientY = y / num;
    }
    if (this.includeXY_) {
        var element = /** @type {!Element} */ this.element_;
        evt.xy = goog.style.getRelativePosition(evt, element);
    }
    this.dispatchEvent(evt);
};

/**
 * Destroy this Events instance.
 */
ol.event.Events.prototype.destroy = function() {
    this.setElement();
    for (var p in this) {
        delete this[p];
    }
};