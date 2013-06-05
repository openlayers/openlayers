/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
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
     * APIProperty: keyMask
     * {Integer} Zoom only occurs if the keyMask matches the combination of 
     *     keys down. Use bitwise operators and one or more of the
     *     <OpenLayers.Handler> constants to construct a keyMask. Leave null if 
     *     not used mask. Default is null.
     */
    keyMask: null,

    /**
     * APIProperty: alwaysZoom
     * {Boolean} Always zoom in/out when box drawn, even if the zoom level does
     * not change.
     */
    alwaysZoom: false,
    
    /**
     * APIProperty: zoomOnClick
     * {Boolean} Should we zoom when no box was dragged, i.e. the user only
     * clicked? Default is true.
     */
    zoomOnClick: true,

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
            var bounds,
                targetCenterPx = position.getCenterPixel();
            if (!this.out) {
                var minXY = this.map.getLonLatFromPixel({
                    x: position.left,
                    y: position.bottom
                });
                var maxXY = this.map.getLonLatFromPixel({
                    x: position.right,
                    y: position.top
                });
                bounds = new OpenLayers.Bounds(minXY.lon, minXY.lat,
                                               maxXY.lon, maxXY.lat);
            } else {
                var pixWidth = position.right - position.left;
                var pixHeight = position.bottom - position.top;
                var zoomFactor = Math.min((this.map.size.h / pixHeight),
                    (this.map.size.w / pixWidth));
                var extent = this.map.getExtent();
                var center = this.map.getLonLatFromPixel(targetCenterPx);
                var xmin = center.lon - (extent.getWidth()/2)*zoomFactor;
                var xmax = center.lon + (extent.getWidth()/2)*zoomFactor;
                var ymin = center.lat - (extent.getHeight()/2)*zoomFactor;
                var ymax = center.lat + (extent.getHeight()/2)*zoomFactor;
                bounds = new OpenLayers.Bounds(xmin, ymin, xmax, ymax);
            }
            // always zoom in/out 
            var lastZoom = this.map.getZoom(),
                size = this.map.getSize(),
                centerPx = {x: size.w / 2, y: size.h / 2},
                zoom = this.map.getZoomForExtent(bounds),
                oldRes = this.map.getResolution(),
                newRes = this.map.getResolutionForZoom(zoom);
            if (oldRes == newRes) {
                this.map.setCenter(this.map.getLonLatFromPixel(targetCenterPx));
            } else {
              var zoomOriginPx = {
                    x: (oldRes * targetCenterPx.x - newRes * centerPx.x) /
                        (oldRes - newRes),
                    y: (oldRes * targetCenterPx.y - newRes * centerPx.y) /
                        (oldRes - newRes)
                };
                this.map.zoomTo(zoom, zoomOriginPx);
            }
            if (lastZoom == this.map.getZoom() && this.alwaysZoom == true){ 
                this.map.zoomTo(lastZoom + (this.out ? -1 : 1)); 
            }
        } else if (this.zoomOnClick) { // it's a pixel
            if (!this.out) {
                this.map.zoomTo(this.map.getZoom() + 1, position);
            } else {
                this.map.zoomTo(this.map.getZoom() - 1, position);
            }
        }
    },

    CLASS_NAME: "OpenLayers.Control.ZoomBox"
});
