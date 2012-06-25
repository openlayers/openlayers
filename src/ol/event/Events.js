goog.provide('ol.event');
goog.provide('ol.event.Events');

goog.require('goog.object');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');
goog.require('goog.events.KeyCodes');
goog.require('goog.style');

/**
 * @enum {Object}
 */
ol.event.SEQUENCE_PROVIDER_MAP = {};

/**
 * @param {string} name
 * @param {Function} Sequence
 */
ol.event.addSequenceProvider = function(name, Sequence) {
    ol.event.SEQUENCE_PROVIDER_MAP[name] = Sequence;
};

/**
 * Determine whether event was caused by a single touch
 *
 * @param {!Event} evt
 * @return {boolean}
 */
ol.event.isSingleTouch = function(evt) {
    return !!(evt.touches && evt.touches.length == 1);
};

/**
 * Determine whether event was caused by a multi touch
 *
 * @param {!Event} evt
 * @return {boolean}
 */
ol.event.isMultiTouch = function(evt) {
    return !!(evt.touches && evt.touches.length > 1);
};

/**
 * Is the event a keyboard event with Enter or Space pressed?
 *
 * @param {!Event} evt
 * @return {boolean}
 */
ol.event.isEnterOrSpace = function(evt) {
    return evt.type === "keypress" &&
        (evt.keyCode === goog.events.KeyCodes.ENTER ||
        evt.keyCode === goog.events.KeyCodes.SPACE ||
        evt.keyCode === goog.events.KeyCodes.MAC_ENTER);
};


/**
 * Construct an ol.event.Events instance.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {Object} object The object we are creating this instance for.
 * @param {!Element=} opt_element An optional element that we want to
 *     listen to browser events on.
 * @param {boolean=} opt_includeXY Should the 'xy' property automatically be
 *     created for browser pointer events? In general, this should be false. If
 *     it is true, then pointer events will automatically generate an 'xy'
 *     property on the event object that is passed, which represents the
 *     relative position of the pointer to the {@code element}. Default is
 *     false.
 * @param {Array.<String>=} opt_sequences Event sequences to register with
 *     this Events instance.
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
     * @type {Element}
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
     * @type {Array.<String>}
     */
    this.sequenceProviders_ = goog.isDef(opt_sequences) ? opt_sequences : [];
    
    /**
     * @private
     * @type {Array.<ol.event.ISequence>}
     */
    this.sequences_ = [];
    
    /**
     * @private
     * @type {Object}
     */
    this.listenerCount_ = {};
    
    if (goog.isDef(opt_element)) {
        this.setElement(opt_element);
    }
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
 * @return {Element} The element that this instance currently
 *     listens to browser events on.
 */
ol.event.Events.prototype.getElement = function() {
    return this.element_;
};

/**
 * Attach this instance to a DOM element. When called, all browser events fired
 * on the provided element will be relayed by this instance.
 *
 * @param {Element|Node} element A DOM element to attach
 *     browser events to. If called without this argument, all browser events
 *     will be detached from the element they are currently attached to.
 */
ol.event.Events.prototype.setElement = function(element) {
    var types = goog.events.EventType, t;    
    if (this.element_) {
        for (t in types) {
            goog.events.unlisten(
                this.element_, types[t], this.handleBrowserEvent, true, this
            );
        }
        this.destroySequences();
        delete this.element_;
    }
    this.element_ = /** @type {Element} */ (element) || null;
    if (goog.isDefAndNotNull(element)) {
        this.createSequences();
        for (t in types) {
            goog.events.listen(
                element, types[t], this.handleBrowserEvent, true, this
            );
        }
    }
};

ol.event.Events.prototype.createSequences = function() {
    for (var i=0, ii=this.sequenceProviders_.length; i<ii; ++i) {
        this.sequences_.push(
            new ol.event.SEQUENCE_PROVIDER_MAP[this.sequenceProviders_[i]](
                this
            )
        );
    }
};

ol.event.Events.prototype.destroySequences = function() {
    for (var i=this.sequences_.length-1; i>=0; --i) {
        this.sequences_[i].destroy();
    }
    this.sequences_ = [];
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
    this.listenerCount_[type] = (this.listenerCount_[type] || 0) + 1;
};

/**
 * Unregister a listener for an event
 *
 * @param {string} type Name of the event to unregister
 * @param {Function} listener The callback function.
 * @param {Object=} opt_scope The object to bind the context to for the
 *     listener. If no scope is specified, default is the event's default
 *     scope.
 * @param {boolean=} opt_priority Listener was registered as priority listener,
 *     so it gets executed before other listeners. Default is false.
 */
ol.event.Events.prototype.unregister = function(type, listener, opt_scope,
                                                opt_priority) {
    var removed = goog.events.unlisten(
        this, type, listener, opt_priority, opt_scope || this.object_
    );
    if (removed) {
        this.listenerCount_[type] = (this.listenerCount_[type] || 1) - 1;
    }
};

/**
 * Trigger a specified registered event.  
 *
 * @param {string} type The type of the event to trigger.
 * @param {Object=} opt_evt The event object that will be passed to listeners.
 *      This object will always have a 'type' property with the event type and
 *      an 'object' property referencing this Events instance.
 *
 * @return {boolean} The last listener return.  If a listener returns false,
 *     the chain of listeners will stop getting called.
 */
ol.event.Events.prototype.triggerEvent = function(type, opt_evt) {
    var returnValue,
        listeners = goog.events.getListeners(this, type, true)
            .concat(goog.events.getListeners(this, type, false));
    if (arguments.length === 1) {
        opt_evt = {'type': type};
    }
    opt_evt['object'] = this.object_;
    for (var i=0, ii=listeners.length; i<ii; ++i) {
        returnValue = listeners[i].handleEvent(opt_evt);
        if (returnValue === false) {
            break;
        }
    }
    return returnValue;
};

/**
 * Prepares browser events before they are dispatched. This takes care to set a
 * property 'xy' on the event with the current pointer position (if 
 * {@code includeXY} is set to true), and normalizes clientX and clientY for
 * multi-touch events.
 * 
 * @param {Event} evt Event object.
 */
ol.event.Events.prototype.handleBrowserEvent = function(evt) {
    var type = evt.type;
    if (this.listenerCount_[type] > 0) {
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
            evt.xy = this.getPointerPosition(evt);
        }
        this.triggerEvent(evt.type, evt);
    }
};

/**
 * Get the mouse position relative to this Event instance's target element for
 * the provided event.
 *
 * @param {Event} evt Event object
 */
ol.event.Events.prototype.getPointerPosition = function(evt) {
    return goog.style.getRelativePosition(evt, this.element_);
};

/**
 * Destroy this Events instance.
 */
ol.event.Events.prototype.destroy = function() {
    this.setElement(null);
    goog.object.clear(this);
};