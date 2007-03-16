/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * Handler for dragging a rectangle across the map.  Box is displayed 
 * on mouse down, moves on mouse move, and is finished on mouse up.
 * 
 * @class
 * @requires OpenLayers/Handler.js
 */
OpenLayers.Handler.Box = OpenLayers.Class.create();
OpenLayers.Handler.Box.prototype = OpenLayers.Class.inherit( OpenLayers.Handler, {
    /**
     * @type OpenLayers.Handler.Drag
     */
    dragHandler: null,

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
        var callbacks = {
            "down": this.startBox, 
            "move": this.moveBox, 
            "out":  this.removeBox,
            "up":   this.endBox
        };
        this.dragHandler = new OpenLayers.Handler.Drag(
                                this, callbacks, {keyMask: this.keyMask});
    },

    setMap: function (map) {
        OpenLayers.Handler.prototype.setMap.apply(this, arguments);
        if (this.dragHandler) {
            this.dragHandler.setMap(map);
        }
    },

    /**
    * @param {Event} evt
    */
    startBox: function (xy) {
        this.zoomBox = OpenLayers.Util.createDiv('zoomBox',
                                                 this.dragHandler.start,
                                                 null,
                                                 null,
                                                 "absolute",
                                                 "2px solid red");
        this.zoomBox.style.backgroundColor = "white";
        this.zoomBox.style.filter = "alpha(opacity=50)"; // IE
        this.zoomBox.style.opacity = "0.50";
        this.zoomBox.style.fontSize = "1px";
        this.zoomBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
        this.map.viewPortDiv.appendChild(this.zoomBox);

        // TBD: use CSS classes instead
        this.map.div.style.cursor = "crosshair";
    },

    /**
    */
    moveBox: function (xy) {
        var deltaX = Math.abs(this.dragHandler.start.x - xy.x);
        var deltaY = Math.abs(this.dragHandler.start.y - xy.y);
        this.zoomBox.style.width = Math.max(1, deltaX) + "px";
        this.zoomBox.style.height = Math.max(1, deltaY) + "px";
        if (xy.x < this.dragHandler.start.x) {
            this.zoomBox.style.left = xy.x+"px";
        }
        if (xy.y < this.dragHandler.start.y) {
            this.zoomBox.style.top = xy.y+"px";
        }
    },

    /**
    */
    endBox: function(end) {
        var result;
        if (Math.abs(this.dragHandler.start.x - end.x) > 5 ||    
            Math.abs(this.dragHandler.start.y - end.y) > 5) {   
            var start = this.dragHandler.start;
            var top = Math.min(start.y, end.y);
            var bottom = Math.max(start.y, end.y);
            var left = Math.min(start.x, end.x);
            var right = Math.max(start.x, end.x);
            result = new OpenLayers.Bounds(left, bottom, right, top);
        } else {
            result = this.dragHandler.start.clone(); // i.e. OL.Pixel
        } 
        this.removeBox();

        // TBD: use CSS classes instead
        this.map.div.style.cursor = "default";

        this.callback("done", [result]);
    },

    /**
     * Remove the zoombox from the screen and nullify our reference to it.
     */
    removeBox: function() {
        this.map.viewPortDiv.removeChild(this.zoomBox);
        this.zoomBox = null;
    },

    activate: function () {
        OpenLayers.Handler.prototype.activate.apply(this, arguments);
        this.dragHandler.activate();
    },

    deactivate: function () {
        OpenLayers.Handler.prototype.deactivate.apply(this, arguments);
        this.dragHandler.deactivate();
    },

    CLASS_NAME: "OpenLayers.Handler.Box"
});
