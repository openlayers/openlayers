/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer.js
 * @requires OpenLayers/Layer/Markers.js
 */

/**
 * Class: OpenLayers.Layer.Boxes
 * Draw divs as 'boxes' on the layer. 
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Markers>
 */
OpenLayers.Layer.Boxes = OpenLayers.Class(OpenLayers.Layer.Markers, {

    /**
     * Constructor: OpenLayers.Layer.Boxes
     *
     * Parameters:
     * name - {String} 
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    
    /**
     * Method: drawMarker 
     * Calculate the pixel location for the marker, create it, and
     *    add it to the layer's div
     *
     * Parameters: 
     * marker - {<OpenLayers.Marker.Box>} 
     */
    drawMarker: function(marker) {
        var topleft = this.map.getLayerPxFromLonLat({
            lon: marker.bounds.left,
            lat: marker.bounds.top
        });
        var botright = this.map.getLayerPxFromLonLat({
            lon: marker.bounds.right,
            lat: marker.bounds.bottom
        });
        if (botright == null || topleft == null) {
            marker.display(false);
        } else {
            var markerDiv = marker.draw(topleft, {
                w: Math.max(1, botright.x - topleft.x),
                h: Math.max(1, botright.y - topleft.y)
            });
            if (!marker.drawn) {
                this.div.appendChild(markerDiv);
                marker.drawn = true;
            }
        }
    },


    /**
     * APIMethod: removeMarker 
     * 
     * Parameters:
     * marker - {<OpenLayers.Marker.Box>} 
     */
    removeMarker: function(marker) {
        OpenLayers.Util.removeItem(this.markers, marker);
        if ((marker.div != null) &&
            (marker.div.parentNode == this.div) ) {
            this.div.removeChild(marker.div);    
        }
    },

    CLASS_NAME: "OpenLayers.Layer.Boxes"
});
