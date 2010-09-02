/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Box.js
 */

/**
 * Class: OpenLayers.Control.ZoomBox
 * The ZoomBox control enables zooming directly to a given extent, by drawing 
 * a box on the map. The box is drawn by holding down shift, whilst dragging 
 * the mouse.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.ZoomBox = OpenLayers.Class(OpenLayers.Control, {
    /**
     * Property: type
     * {OpenLayers.Control.TYPE}
     */
    type: OpenLayers.Control.TYPE_TOOL,

    /**
     * Property: out
     * {Boolean} Should the control be used for zooming out?
     */
    out: false,

    /**
     * Property: alwaysZoom
     * {Boolean} Always zoom in/out, when box drawed 
     */
    alwaysZoom: false,

    /**
     * Method: draw
     */    
    draw: function() {
        this.handler = new OpenLayers.Handler.Box( this,
                            {done: this.zoomBox}, {keyMask: this.keyMask} );
    },

    /**
     * Method: zoomBox
     *
     * Parameters:
     * position - {<OpenLayers.Bounds>} or {<OpenLayers.Pixel>}
     */
    zoomBox: function (position) {
        if (position instanceof OpenLayers.Bounds) {
            var bounds;
            if (!this.out) {
                var minXY = this.map.getLonLatFromPixel(
                            new OpenLayers.Pixel(position.left, position.bottom));
                var maxXY = this.map.getLonLatFromPixel(
                            new OpenLayers.Pixel(position.right, position.top));
                bounds = new OpenLayers.Bounds(minXY.lon, minXY.lat,
                                               maxXY.lon, maxXY.lat);
            } else {
                var pixWidth = Math.abs(position.right-position.left);
                var pixHeight = Math.abs(position.top-position.bottom);
                var zoomFactor = Math.min((this.map.size.h / pixHeight),
                    (this.map.size.w / pixWidth));
                var extent = this.map.getExtent();
                var center = this.map.getLonLatFromPixel(
                    position.getCenterPixel());
                var xmin = center.lon - (extent.getWidth()/2)*zoomFactor;
                var xmax = center.lon + (extent.getWidth()/2)*zoomFactor;
                var ymin = center.lat - (extent.getHeight()/2)*zoomFactor;
                var ymax = center.lat + (extent.getHeight()/2)*zoomFactor;
                bounds = new OpenLayers.Bounds(xmin, ymin, xmax, ymax);
            }
            // always zoom in/out 
            var lastZoom = this.map.getZoom(); 
            this.map.zoomToExtent(bounds);
            if (lastZoom == this.map.getZoom() && this.alwaysZoom == true){ 
                this.map.zoomTo(lastZoom + (this.out ? -1 : 1)); 
            }
        } else { // it's a pixel
            if (!this.out) {
                this.map.setCenter(this.map.getLonLatFromPixel(position),
                               this.map.getZoom() + 1);
            } else {
                this.map.setCenter(this.map.getLonLatFromPixel(position),
                               this.map.getZoom() - 1);
            }
        }
    },

    CLASS_NAME: "OpenLayers.Control.ZoomBox"
});
