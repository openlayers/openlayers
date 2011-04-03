/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Handler.js
 */

/**
 * Class: OpenLayers.Handler.Drag
 * The drag handler is used to deal with sequences of browser events related
 *     to dragging.  The handler is used by controls that want to know when
 *     a drag sequence begins, when a drag is happening, and when it has
 *     finished.
 *
 * Controls that use the drag handler typically construct it with callbacks
 *     for 'down', 'move', and 'done'.  Callbacks for these keys are called
 *     when the drag begins, with each move, and when the drag is done.  In
 *     addition, controls can have callbacks keyed to 'up' and 'out' if they
 *     care to differentiate between the types of events that correspond with
 *     the end of a drag sequence.  If no drag actually occurs (no mouse move)
 *     the 'down' and 'up' callbacks will be called, but not the 'done'
 *     callback.
 *
 * Create a new drag handler with the <OpenLayers.Handler.Drag> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Handler>
 */
OpenLayers.Handler.Drag = OpenLayers.Class(OpenLayers.Handler, {
  
    /** 
     * Property: started
     * {Boolean} When a mousedown or touchstart event is received, we want to
     * record it, but not set 'dragging' until the mouse moves after starting.
     */
    started: false,

    /**
     * Property: stopDown
     * {Boolean} Stop propagation of mousedown events from getting to listeners
     *     on the same element.  Default is true.
     */
    stopDown: true,

    /** 
     * Property: dragging 
     * {Boolean} 
     */
    dragging: false,

    /**
     * Property: touch
     * {Boolean} When a touchstart event is fired, touch will be true and all
     *     mouse related listeners will do nothing.
     */
    touch: false,

    /** 
     * Property: last
     * {<OpenLayers.Pixel>} The last pixel location of the drag.
     */
    last: null,

    /** 
     * Property: start
     * {<OpenLayers.Pixel>} The first pixel location of the drag.
     */
    start: null,

    /**
     * Property: lastMoveEvt
     * {Object} The last mousemove event that occurred. Used to
     *     position the map correctly when our "delay drag"
     *     timeout expired.
     */
    lastMoveEvt: null,

    /**
     * Property: oldOnselectstart
     * {Function}
     */
    oldOnselectstart: null,
    
    /**
     * Property: interval
     * {Integer} In order to increase performance, an interval (in 
     *     milliseconds) can be set to reduce the number of drag events 
     *     called. If set, a new drag event will not be set until the 
     *     interval has passed. 
     *     Defaults to 0, meaning no interval. 
     */
    interval: 0,
    
    /**
     * Property: timeoutId
     * {String} The id of the timeout used for the mousedown interval.
     *     This is "private", and should be left alone.
     */
    timeoutId: null,
    
    /**
     * APIProperty: documentDrag
     * {Boolean} If set to true, the handler will also handle mouse moves when
     *     the cursor has moved out of the map viewport. Default is false.
     */
    documentDrag: false,
    
    /**
     * Property: documentEvents
     * {Boolean} Are we currently observing document events?
     */
    documentEvents: null,

    /**
     * Constructor: OpenLayers.Handler.Drag
     * Returns OpenLayers.Handler.Drag
     * 
     * Parameters:
     * control - {<OpenLayers.Control>} The control that is making use of
     *     this handler.  If a handler is being used without a control, the
     *     handlers setMap method must be overridden to deal properly with
     *     the map.
     * callbacks - {Object} An object containing a single function to be
     *     called when the drag operation is finished. The callback should
     *     expect to recieve a single argument, the pixel location of the event.
     *     Callbacks for 'move' and 'done' are supported. You can also speficy
     *     callbacks for 'down', 'up', and 'out' to respond to those events.
     * options - {Object} 
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.prototype.initialize.apply(this, arguments);
        
        if (this.documentDrag === true) {
            var me = this;
            this._docMove = function(evt) {
                me.mousemove({
                    xy: {x: evt.clientX, y: evt.clientY},
                    element: document
                });
            };
            this._docUp = function(evt) {
                me.mouseup({xy: {x: evt.clientX, y: evt.clientY}});
            };
        }
    },

    
    /**
     * Method: dragstart
     * This private method is factorized from mousedown and touchstart methods
     *
     * Parameters:
     * evt - {Event} The event
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    dragstart: function (evt) {
        var propagate = true;
        this.dragging = false;
        if (this.checkModifiers(evt) &&
               (OpenLayers.Event.isLeftClick(evt) ||
                OpenLayers.Event.isSingleTouch(evt))) {
            this.started = true;
            this.start = evt.xy;
            this.last = evt.xy;
            OpenLayers.Element.addClass(
                this.map.viewPortDiv, "olDragDown"
            );
            this.down(evt);
            this.callback("down", [evt.xy]);

            OpenLayers.Event.stop(evt);

            if(!this.oldOnselectstart) {
                this.oldOnselectstart = document.onselectstart ?
                    document.onselectstart : OpenLayers.Function.True;
            }
            document.onselectstart = OpenLayers.Function.False;

            propagate = !this.stopDown;
        } else {
            this.started = false;
            this.start = null;
            this.last = null;
        }
        return propagate;
    },

    /**
     * Method: dragmove
     * This private method is factorized from mousemove and touchmove methods
     *
     * Parameters:
     * evt - {Event} The event
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    dragmove: function (evt) {
        this.lastMoveEvt = evt;
        if (this.started && !this.timeoutId && (evt.xy.x != this.last.x ||
                                                evt.xy.y != this.last.y)) {
            if(this.documentDrag === true && this.documentEvents) {
                if(evt.element === document) {
                    this.adjustXY(evt);
                    // do setEvent manually because the documentEvents are not
                    // registered with the map
                    this.setEvent(evt);
                } else {
                    this.removeDocumentEvents();
                }
            }
            if (this.interval > 0) {
                this.timeoutId = setTimeout(
                    OpenLayers.Function.bind(this.removeTimeout, this),
                    this.interval);
            }
            this.dragging = true;

            this.move(evt);
            this.callback("move", [evt.xy]);
            if(!this.oldOnselectstart) {
                this.oldOnselectstart = document.onselectstart;
                document.onselectstart = OpenLayers.Function.False;
            }
            this.last = evt.xy;
        }
        return true;
    },

    /**
     * Method: dragend
     * This private method is factorized from mouseup and touchend methods
     *
     * Parameters:
     * evt - {Event} The event
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    dragend: function (evt) {
        if (this.started) {
            if(this.documentDrag === true && this.documentEvents) {
                this.adjustXY(evt);
                this.removeDocumentEvents();
            }
            var dragged = (this.start != this.last);
            this.started = false;
            this.dragging = false;
            OpenLayers.Element.removeClass(
                this.map.viewPortDiv, "olDragDown"
            );
            this.up(evt);
            this.callback("up", [evt.xy]);
            if(dragged) {
                this.callback("done", [evt.xy]);
            }
            document.onselectstart = this.oldOnselectstart;
        }
        return true;
    },

    /**
     * The four methods below (down, move, up, and out) are used by subclasses
     *     to do their own processing related to these mouse events.
     */

    /**
     * Method: down
     * This method is called during the handling of the mouse down event.
     *     Subclasses can do their own processing here.
     *
     * Parameters:
     * evt - {Event} The mouse down event
     */
    down: function(evt) {
    },

    /**
     * Method: move
     * This method is called during the handling of the mouse move event.
     *     Subclasses can do their own processing here.
     *
     * Parameters:
     * evt - {Event} The mouse move event
     *
     */
    move: function(evt) {
    },

    /**
     * Method: up
     * This method is called during the handling of the mouse up event.
     *     Subclasses can do their own processing here.
     *
     * Parameters:
     * evt - {Event} The mouse up event
     */
    up: function(evt) {
    },

    /**
     * Method: out
     * This method is called during the handling of the mouse out event.
     *     Subclasses can do their own processing here.
     *
     * Parameters:
     * evt - {Event} The mouse out event
     */
    out: function(evt) {
    },

    /**
     * The methods below are part of the magic of event handling.  Because
     *     they are named like browser events, they are registered as listeners
     *     for the events they represent.
     */

    /**
     * Method: mousedown
     * Handle mousedown events
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    mousedown: function(evt) {
        return this.dragstart(evt);
    },

    /**
     * Method: touchstart
     * Handle touchstart events
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    touchstart: function(evt) {
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                scope: this
            });
        }
        return this.dragstart(evt);
    },

    /**
     * Method: mousemove
     * Handle mousemove events
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    mousemove: function(evt) {
        return this.dragmove(evt);
    },

    /**
     * Method: touchmove
     * Handle touchmove events
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    touchmove: function(evt) {
        return this.dragmove(evt);
    },

    /**
     * Method: removeTimeout
     * Private. Called by mousemove() to remove the drag timeout.
     */
    removeTimeout: function() {
        this.timeoutId = null;
        // if timeout expires while we're still dragging (mouseup
        // hasn't occurred) then call mousemove to move to the
        // correct position
        if(this.dragging) {
            this.mousemove(this.lastMoveEvt);
        }
    },

    /**
     * Method: mouseup
     * Handle mouseup events
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    mouseup: function(evt) {
        return this.dragend(evt);
    },

    /**
     * Method: touchend
     * Handle touchend events
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    touchend: function(evt) {
        // override evt.xy with last position since touchend does not have
        // any touch position
        evt.xy = this.last;
        return this.dragend(evt);
    },

    /**
     * Method: mouseout
     * Handle mouseout events
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean} Let the event propagate.
     */
    mouseout: function (evt) {
        if (this.started && OpenLayers.Util.mouseLeft(evt, this.map.eventsDiv)) {
            if(this.documentDrag === true) {
                this.addDocumentEvents();
            } else {
                var dragged = (this.start != this.last);
                this.started = false; 
                this.dragging = false;
                OpenLayers.Element.removeClass(
                    this.map.viewPortDiv, "olDragDown"
                );
                this.out(evt);
                this.callback("out", []);
                if(dragged) {
                    this.callback("done", [evt.xy]);
                }
                if(document.onselectstart) {
                    document.onselectstart = this.oldOnselectstart;
                }
            }
        }
        return true;
    },

    /**
     * Method: click
     * The drag handler captures the click event.  If something else registers
     *     for clicks on the same element, its listener will not be called 
     *     after a drag.
     * 
     * Parameters: 
     * evt - {Event} 
     * 
     * Returns:
     * {Boolean} Let the event propagate.
     */
    click: function (evt) {
        // let the click event propagate only if the mouse moved
        return (this.start == this.last);
    },

    /**
     * Method: activate
     * Activate the handler.
     * 
     * Returns:
     * {Boolean} The handler was successfully activated.
     */
    activate: function() {
        var activated = false;
        if(OpenLayers.Handler.prototype.activate.apply(this, arguments)) {
            this.dragging = false;
            activated = true;
        }
        return activated;
    },

    /**
     * Method: deactivate 
     * Deactivate the handler.
     * 
     * Returns:
     * {Boolean} The handler was successfully deactivated.
     */
    deactivate: function() {
        var deactivated = false;
        if(OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            this.touch = false;
            this.started = false;
            this.dragging = false;
            this.start = null;
            this.last = null;
            deactivated = true;
            OpenLayers.Element.removeClass(
                this.map.viewPortDiv, "olDragDown"
            );
        }
        return deactivated;
    },
    
    /**
     * Method: adjustXY
     * Converts event coordinates that are relative to the document body to
     * ones that are relative to the map viewport. The latter is the default in
     * OpenLayers.
     * 
     * Parameters:
     * evt - {Object}
     */
    adjustXY: function(evt) {
        var pos = OpenLayers.Util.pagePosition(this.map.viewPortDiv);
        evt.xy.x -= pos[0];
        evt.xy.y -= pos[1];
    },
    
    /**
     * Method: addDocumentEvents
     * Start observing document events when documentDrag is true and the mouse
     * cursor leaves the map viewport while dragging.
     */
    addDocumentEvents: function() {
        OpenLayers.Element.addClass(document.body, "olDragDown");
        this.documentEvents = true;
        OpenLayers.Event.observe(document, "mousemove", this._docMove);
        OpenLayers.Event.observe(document, "mouseup", this._docUp);
    },
    
    /**
     * Method: removeDocumentEvents
     * Stops observing document events when documentDrag is true and the mouse
     * cursor re-enters the map viewport while dragging.
     */
    removeDocumentEvents: function() {
        OpenLayers.Element.removeClass(document.body, "olDragDown");
        this.documentEvents = false;
        OpenLayers.Event.stopObserving(document, "mousemove", this._docMove);
        OpenLayers.Event.stopObserving(document, "mouseup", this._docUp);
    },

    CLASS_NAME: "OpenLayers.Handler.Drag"
});
