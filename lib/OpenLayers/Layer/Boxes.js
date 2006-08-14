/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Layer.js
 * @requires OpenLayers/Layer/Markers.js
 */
OpenLayers.Layer.Boxes = Class.create();
OpenLayers.Layer.Boxes.prototype = 
    Object.extend( new OpenLayers.Layer.Markers(), {

    initialize: function () {
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, arguments);
    },
    
    /** Calculate the pixel location for the marker, create it, and
    *    add it to the layer's div
    *
    * @private
    *
    * @param {OpenLayers.Marker.Box} marker
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
                botright.x - topleft.x, botright.y - topleft.y);
            var markerDiv = marker.draw(topleft, sz);
            if (!marker.drawn) {
                this.div.appendChild(markerDiv);
                marker.drawn = true;
            }
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Boxes"
});
