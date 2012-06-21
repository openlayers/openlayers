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
 * @param {!Event} evt
 * @return {boolean}
 * @export
 */
ol.event.isSingleTouch = function(evt) {
    return !!(evt.touches && evt.touches.length == 1);
};

/**
 * Determine whether event was caused by a multi touch
 *
 * @param {!Event} evt
 * @return {boolean}
 * @export
 */
ol.event.isMultiTouch = function(evt) {
    return !!(evt.touches && evt.touches.length > 1);
};


/**
 * Construct an ol.event.Events instance.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {Object} object The object we are creating this instance for.
 * @param {!EventTarget=} opt_element An optional element that we want to
 *     listen to browser events on.
 * @param {boolean=} opt_includeXY Should the 'xy' property automatically be
 *     created for browser pointer events? In general, this should be false. If
 *     it is true, then pointer events will automatically generate an 'xy'
 *     property on the event object that is passed, which represents the
 *     relative position of the pointer to the {@code element}. Default is
 *     false.
 * @param {Array.<Object>=} opt_sequences Event sequences to register with this
 *     events instance.
 * @export
 */
ol.event.Events = function(object, opt_element, opt_includeXY, opt_sequences) {
    
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
    
    /**
     * @private
     * @type {!Array.<Object>}
     */
    this.sequences_ = [];
    
    this.setElement(opt_element);
    this.setSequences(opt_sequences);
};
goog.inherits(ol.event.Events, goog.events.EventTarget);

/**
 * @param {Array.<ol.event.Sequence>} sequences
 */
ol.event.Events.prototype.setSequences = function(sequences) {
    this.sequences_ = sequences || [];
    for (var i=0, ii=this.sequences_.length; i<ii; ++i) {
        this.sequences_[i].setElement(this.element_);
    }
};

/**
 * @return {Object} The object that this instance is bound to.
 * @export
 */
ol.event.Events.prototype.getObject = function() {
    return this.object_;
};

/**
 * @param {boolean} includeXY
 * @export
 */
ol.event.Events.prototype.setIncludeXY = function(includeXY) {
    this.includeXY_ = includeXY;
};

/**
 * @return {EventTarget} The element that this instance currently
 *     listens to browser events on.
 * @export
 */
ol.event.Events.prototype.getElement = function() {
    return this.element_;
};

/**
 * Attach this instance to a DOM element. When called, all browser events fired
 * on the provided element will be relayed by this instance.
 *
 * @param {EventTarget} element A DOM element to attach
 *     browser events to. If called without this argument, all browser events
 *     will be detached from the element they are currently attached to.
 * @export
 */
ol.event.Events.prototype.setElement = function(element) {
    var t, types = {};
    goog.object.extend(types, goog.events.EventType);
    goog.object.extend(types, goog.fx.Dragger.EventType);
    if (this.element_) {
        for (t in types) {
            // register the event cross-browser
            goog.events.unlisten(
                this.element_, types[t], this.handleBrowserEvent, false, this
            );
        }
        delete this.element_;
    }
    this.element_ = element || null;
    if (goog.isDefAndNotNull(element)) {
        for (t in types) {
            // register the event cross-browser
            goog.events.listen(
                element, types[t], this.handleBrowserEvent, false, this
            );
        }
    }
    this.setSequences(this.sequences_);
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
 * @export
 */
ol.event.Events.prototype.register = function(type, listener, opt_scope,
                                              opt_priority) {
    goog.events.listen(
        this, type, listener, opt_priority, opt_scope || this.object_
    );
};

/**
 * Unregister a listener for an event
 *
 * @param {string} type Name of the event to unregister
 * @param {Function} listener The callback function.
 * @param {Object=} opt_scope The object to bind the context to for the
 *     listener. If no scope is specified, default is the event's default
 *     scope.
 * @export
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
 * @return {boolean} The last listener return.  If a listener returns false,
 *     the chain of listeners will stop getting called.
 * @export
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
 * @param {Event} evt
 */
ol.event.Events.prototype.handleSequences = function(evt) {
    var sequences = this.sequences_,
        type = evt.type,
        sequenceEvt, browserEvent, handled, providedEvents, providedEventType;
    for (var i=0, ii=sequences.length; i<ii; ++i) {
        providedEvents = sequences[i].getProvidedEvents();
        for (providedEventType in providedEvents) {
            // clone the original event
            sequenceEvt = {}; goog.object.extend(sequenceEvt, evt);
            browserEvent = providedEvents[providedEventType];
            handled = browserEvent[type];
            if (goog.typeOf(handled) === "function") {
                handled = handled(evt);
            }
            if (handled) {
                sequenceEvt.type = providedEventType;
                this.dispatchEvent(sequenceEvt);
            }
        }
    }
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
    this.handleSequences(evt);
    this.dispatchEvent(evt);
};

/**
 * Destroy this Events instance.
 * @export
 */
ol.event.Events.prototype.destroy = function() {
    this.setElement();
    for (var p in this) {
        delete this[p];
    }
};