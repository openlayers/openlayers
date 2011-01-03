/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
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
    initialize: function (name, options) {
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * Method: drawMarker 
     * Calculate the pixel location for the marker, create it, and
     *    add it to the layer's div
     *
     * Parameters: 
     * marker - {<OpenLayers.Marker.Box>} 
     */
    drawMarker: function(marker) {
        var bounds   = marker.bounds;
        var topleft  = this.map.getLayerPxFromLonLat(
                            new OpenLayers.LonLat(bounds.left,  bounds.top));
        var botright = this.map.getLayerPxFromLonLat(
                             new OpenLayers.LonLat(bounds.right, bounds.bottom));
        if (botright == null || topleft == null) {
            marker.display(false);
        } else {
            var sz = new OpenLayers.Size(
                Math.max(1, botright.x - topleft.x),
                Math.max(1, botright.y - topleft.y));
            var markerDiv = marker.draw(topleft, sz);
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
