/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Box.js
 */
OpenLayers.Control.ZoomBox = OpenLayers.Class.create();
OpenLayers.Control.ZoomBox.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control, {
    /** @type OpenLayers.Control.TYPE_* */
    type: OpenLayers.Control.TYPE_TOOL,

    /**
     * 
     */    
    draw: function() {
        this.handler = new OpenLayers.Handler.Box( this,
                            {done: this.zoomBox}, {keyMask: this.keyMask} );
    },

    zoomBox: function (position) {
        if (position instanceof OpenLayers.Bounds) {
            var minXY = this.map.getLonLatFromPixel(
                            new OpenLayers.Pixel(position.left, position.bottom));
            var maxXY = this.map.getLonLatFromPixel(
                            new OpenLayers.Pixel(position.right, position.top));
            var bounds = new OpenLayers.Bounds(minXY.lon, minXY.lat,
                                               maxXY.lon, maxXY.lat);
            this.map.zoomToExtent(bounds);
        } else { // it's a pixel
            this.map.setCenter(this.map.getLonLatFromPixel(position),
                               this.map.getZoom() + 1);
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.ZoomBox"
});
