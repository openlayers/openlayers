/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Handler/Drag.js
 */

/**
 * Class: OpenLayers.Handler.Box
 * Handler for dragging a rectangle across the map.  Box is displayed 
 * on mouse down, moves on mouse move, and is finished on mouse up.
 *
 * Inherits from:
 *  - <OpenLayers.Handler> 
 */
OpenLayers.Handler.Box = OpenLayers.Class(OpenLayers.Handler, {

    /** 
     * Property: dragHandler 
     * {<OpenLayers.Handler.Drag>} 
     */
    dragHandler: null,

    /**
     * APIProperty: boxDivClassName
     * {String} The CSS class to use for drawing the box. Default is
     *     olHandlerBoxZoomBox
     */
    boxDivClassName: 'olHandlerBoxZoomBox',
    
    /**
     * Property: boxCharacteristics
     * {Object} Caches some box characteristics from css. This is used
     *     by the getBoxCharacteristics method.
     */
    boxCharacteristics: null,

    /**
     * Constructor: OpenLayers.Handler.Box
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 
     * callbacks - {Object} An object containing a single function to be
     *                          called when the drag operation is finished.
     *                          The callback should expect to recieve a single
     *                          argument, the point geometry.
     * options - {Object} 
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

    /**
     * Method: setMap
     */
    setMap: function (map) {
        OpenLayers.Handler.prototype.setMap.apply(this, arguments);
        if (this.dragHandler) {
            this.dragHandler.setMap(map);
        }
    },

    /**
    * Method: startBox
    *
    * Parameters:
    * evt - {Event} 
    */
    startBox: function (xy) {
        this.zoomBox = OpenLayers.Util.createDiv('zoomBox',
                                                 this.dragHandler.start);
        this.zoomBox.className = this.boxDivClassName;                                         
        this.zoomBox.style.zIndex = this.map.Z_INDEX_BASE["Popup"] - 1;
        this.map.viewPortDiv.appendChild(this.zoomBox);

        // TBD: use CSS classes instead
        this.map.div.style.cursor = "crosshair";
    },

    /**
    * Method: moveBox
    */
    moveBox: function (xy) {
        var startX = this.dragHandler.start.x;
        var startY = this.dragHandler.start.y;
        var deltaX = Math.abs(startX - xy.x);
        var deltaY = Math.abs(startY - xy.y);
        this.zoomBox.style.width = Math.max(1, deltaX) + "px";
        this.zoomBox.style.height = Math.max(1, deltaY) + "px";
        this.zoomBox.style.left = xy.x < startX ? xy.x+"px" : startX+"px";
        this.zoomBox.style.top = xy.y < startY ? xy.y+"px" : startY+"px";

        // depending on the box model, modify width and height to take borders
        // of the box into account
        var box = this.getBoxCharacteristics(deltaX, deltaY);
        if (box.newBoxModel) {
            if (xy.x > startX) {
                this.zoomBox.style.width =
                    Math.max(1, deltaX - box.xOffset) + "px";
            }
            if (xy.y > startY) {
                this.zoomBox.style.height =
                    Math.max(1, deltaY - box.yOffset) + "px";
            }
        }
    },

    /**
    * Method: endBox
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
        this.map.div.style.cursor = "";

        this.callback("done", [result]);
    },

    /**
     * Method: removeBox
     * Remove the zoombox from the screen and nullify our reference to it.
     */
    removeBox: function() {
        this.map.viewPortDiv.removeChild(this.zoomBox);
        this.zoomBox = null;
        this.boxCharacteristics = null;
    },

    /**
     * Method: activate
     */
    activate: function () {
        if (OpenLayers.Handler.prototype.activate.apply(this, arguments)) {
            this.dragHandler.activate();
            return true;
        } else {
            return false;
        }
    },

    /**
     * Method: deactivate
     */
    deactivate: function () {
        if (OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            this.dragHandler.deactivate();
            return true;
        } else {
            return false;
        }
    },
    
    getBoxCharacteristics: function(dx, dy) {
        if (!this.boxCharacteristics) {
            var xOffset = parseInt(OpenLayers.Element.getStyle(this.zoomBox,
                "border-left-width")) + parseInt(OpenLayers.Element.getStyle(
                this.zoomBox, "border-right-width")) + 1;
            var yOffset = parseInt(OpenLayers.Element.getStyle(this.zoomBox,
                "border-top-width")) + parseInt(OpenLayers.Element.getStyle(
                this.zoomBox, "border-bottom-width")) + 1;
            // all browsers use the new box model, except IE in quirks mode
            var newBoxModel = OpenLayers.Util.getBrowserName() == "msie" ?
                document.compatMode != "BackCompat" : true;
            this.boxCharacteristics = {
                xOffset: xOffset,
                yOffset: yOffset,
                newBoxModel: newBoxModel
            };
        }
        return this.boxCharacteristics;
    },

    CLASS_NAME: "OpenLayers.Handler.Box"
});
