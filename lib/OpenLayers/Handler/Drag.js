/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Events.js
 * 
 * Class: OpenLayers.Handler.Drag
 */
OpenLayers.Handler.Drag = OpenLayers.Class.create();
OpenLayers.Handler.Drag.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Handler, {
  
    /** 
     * Property: started
     * {Boolean} When a mousedown event is received, we want to record it, but
     *           not set 'dragging' until the mouse moves after starting. 
     */
    started: false,
    
    /** 
     * Property: dragging 
     * {Boolean} 
     */
    dragging: false,

    /** 
     * Property: start 
     * {<OpenLayers.Pixel>} 
     */
    start: null,

    /**
     * Property: oldOnselectstart
     * {Function}
     */
    oldOnselectstart: null,

    /**
     * Constructor: OpenLayers.Handler.Drag
     * Returns OpenLayers.Handler.Drag
     * 
     * Parameters:
     * control - {<OpenLayers.Control>} 
     * callbacks - {Object} An object containing a single function to be
     *                      called when the drag operation is finished.
     *                      The callback should expect to recieve a single
     *                      argument, the pixel location of the event.
     *                      Callbacks for 'move' and 'done' are supported. 
     *                      You can also speficy callbacks for 'down', 'up', 
     *                      and 'out' to respond to those events.
     * options - {Object} 
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * Method: mousedown
     * Handle mousedown events
     *
     * Parameters:
     * evt - {Event} 
     *
     * Return: {Boolean} Should the event propagate
     */
    mousedown: function (evt) {
        if (this.checkModifiers(evt) && OpenLayers.Event.isLeftClick(evt)) {
            this.started = true;
            this.dragging = false;
            this.start = evt.xy.clone();
            // TBD replace with CSS classes
            this.map.div.style.cursor = "move";
            this.callback("down", [evt.xy]);
            OpenLayers.Event.stop(evt);
            return false;
        }
        return true;
    },

    /**
     * Method: mousemove
     * Handle mousemove events
     *
     * Parameters:
     * evt - {Event} 
     *
     * Return: {Boolean} Should the event propagate
     */
    mousemove: function (evt) {
        if (this.started) {
            this.dragging = true;
            this.callback("move", [evt.xy]);
            if(!this.oldOnselectstart) {
                this.oldOnselectstart = document.onselectstart;
                document.onselectstart = function() {return false;}
            }
        }
        return true;
    },

    /**
     * Method: mouseup
     * Handle mouseup events
     *
     * Parameters:
     * evt - {Event} 
     *
     * Return: {Boolean} Should the event propagate
     */
    mouseup: function (evt) {
        if (this.started) {
            this.started = false;
            // TBD replace with CSS classes
            this.map.div.style.cursor = "";
            this.callback("up", [evt.xy]);
            this.callback("done", [evt.xy]);
            document.onselectstart = this.oldOnselectstart;
        }
        return true;
    },

    /**
     * Method: mouseout
     * Handle mouseout events
     *
     * Parameters:
     * evt - {Event} 
     *
     * Return: {Boolean} Should the event propagate
     */
    mouseout: function (evt) {
        if (this.started && OpenLayers.Util.mouseLeft(evt, this.map.div)) {
            this.started = false; 
            this.dragging = false;
            // TBD replace with CSS classes
            this.map.div.style.cursor = "";
            this.callback("out", []);
            if(document.onselectstart) {
                document.onselectstart = this.oldOnselectstart;
            }
            this.callback("done", [evt.xy])
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
     * Return: {Boolean} Should the event propagate
     */
    click: function (evt) {
        // throw away the first left click event that happens after a mouse up
        if (this.dragging) {
            this.dragging = false;
            return false; 
        }
        this.started = false;
        return true;
    },

    /**
     * Method: activate
     * Activate the handler.
     * 
     * Return: {Boolean} Was activation successful.  
     *                   Returns false if already active.
     */
    activate: function() {
        if(OpenLayers.Handler.prototype.activate.apply(this, arguments)) {
            this.dragging = false;
            return true;
        } else {
            return false;
        }
    },

    /**
     * Method: deactivate 
     * Deactivate the handler.
     * 
     * Return: {Boolean} Was deactivation successful.  
     *                   Returns false if already active.
     */
    deactivate: function() {
        if(OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            this.dragging = false;
            return true;
        } else {
            return false;
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Handler.Drag"
});
