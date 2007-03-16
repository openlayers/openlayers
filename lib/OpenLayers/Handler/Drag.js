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
     * @type boolean 
     **/
    started: false,
    
    /** @type boolean **/
    dragging: null,

    /** @type OpenLayers.Pixel **/
    start: null,

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
    
    mousedown: function (evt) {
        if (this.checkModifiers(evt) && OpenLayers.Event.isLeftClick(evt)) {
            this.started = true;
            this.dragging = null;
            this.start = evt.xy.clone();
            // TBD replace with CSS classes
            this.map.div.style.cursor = "move";
            this.callback("down", [evt.xy]);
            OpenLayers.Event.stop(evt);
            return false;
        }
    },

    mousemove: function (evt) {
        if (this.started) {
            this.dragging = true;
            this.callback("move", [evt.xy]);
        }
    },

    mouseup: function (evt) {
        if (this.started) {
            this.started = false; 
            // TBD replace with CSS classes
            this.map.div.style.cursor = "default";
            this.callback("up", [evt.xy]);
        }
    },

    mouseout: function (evt) {
        if (this.started && OpenLayers.Util.mouseLeft(evt, this.map.div)) {
            this.started = false; 
            this.dragging = null;
            // TBD replace with CSS classes
            this.map.div.style.cursor = "default";
            this.callback("out", []);
        }
    },

    /**
     * @param {Event} evt
     * 
     * @type Boolean
     */
    click: function (evt) {
        // throw away the first left click event that happens after a mouse up
        if (OpenLayers.Event.isLeftClick(evt) && this.dragging != null) {
            this.dragging = null;
            return false; 
        }
        this.started = false;
    },

    activate: function (evt) {
        OpenLayers.Handler.prototype.activate.apply(this, arguments);
        document.onselectstart = function() { return false; };
        this.dragging = null;
    },

    deactivate: function (evt) {
        OpenLayers.Handler.prototype.deactivate.apply(this, arguments);
        document.onselectstart = null;
        this.dragging = null;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Handler.Drag"
});
