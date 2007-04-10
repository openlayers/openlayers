/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * Handler for dragging a rectangle across the map.  Drag is displayed 
 * on mouse down, moves on mouse move, and is finished on mouse up.
 * 
 * @class
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Events.js
 */
OpenLayers.Handler.Drag = OpenLayers.Class.create();
OpenLayers.Handler.Drag.prototype = OpenLayers.Class.inherit( OpenLayers.Handler, {
    /** 
     * When a mousedown event is received, we want to record it, but not set 
     * 'dragging' until the mouse moves after starting. 
     * 
     * @type Boolean 
     **/
    started: false,
    
    /** @type Boolean **/
    dragging: false,

    /** @type OpenLayers.Pixel **/
    start: null,

    /**
     * @type Function
     * @private
     */
    oldOnselectstart: null,

    /**
     * @constructor
     *
     * @param {OpenLayers.Control} control
     * @param {Object} callbacks An object containing a single function to be
     *                          called when the drag operation is finished.
     *                          The callback should expect to recieve a single
     *                          argument, the point geometry.
     * @param {Object} options
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * Handle mousedown events
     * @param {Event} evt
     * @type Boolean
     * @return Should the event propagate
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
     * Handle mousemove events
     * @param {Event} evt
     * @type Boolean
     * @return Should the event propagate
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
     * Handle mouseup events
     * @param {Event} evt
     * @type Boolean
     * @return Should the event propagate
     */
    mouseup: function (evt) {
        if (this.started) {
            this.started = false;
            this.dragging = false;
            // TBD replace with CSS classes
            this.map.div.style.cursor = "";
            this.callback("up", [evt.xy]);
            document.onselectstart = this.oldOnselectstart;
        }
        return true;
    },

    /**
     * Handle mouseout events
     * @param {Event} evt
     * @type Boolean
     * @return Should the event propagate
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
        }
        return true;
    },

    /**
     * The drag handler captures the click event.  If something else registers
     * for clicks on the same element, its listener will not be called after a
     * drag.
     * @param {Event} evt
     * @type Boolean
     * @return Should the event propagate
     */
    click: function (evt) {
        // throw away the first left click event that happens after a mouse up
        if (OpenLayers.Event.isLeftClick(evt) && this.dragging) {
            this.dragging = true;
            return false; 
        }
        this.started = false;
        return true;
    },

    /**
     * Activate the handler.
     * @type Boolean
     * @return Was activation successful.  Returns false if already active.
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
     * Deactivate the handler.
     * @type Boolean
     * @return Was deactivation successful.  Returns false if not already active.
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
