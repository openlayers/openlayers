/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 * 
 * @requires OpenLayers/Layer.js
 * @requires OpenLayers/Layer/Markers.js
 */
OpenLayers.Layer.Boxes = OpenLayers.Class.create();
OpenLayers.Layer.Boxes.prototype = 
    OpenLayers.Class.inherit( OpenLayers.Layer.Markers, {

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
                Math.max(1, botright.x - topleft.x),
                Math.max(1, botright.y - topleft.y));
            var markerDiv = marker.draw(topleft, sz);
            if (!marker.drawn) {
                this.div.appendChild(markerDiv);
                marker.drawn = true;
            }
        }
    },


    /** OVERRIDDEN
     * 
     * @param {OpenLayers.Marker} marker
     */
    removeMarker: function(marker) {
        OpenLayers.Util.removeItem(this.markers, marker);
        if ((marker.div != null) &&
            (marker.div.parentNode == this.div) ) {
            this.div.removeChild(marker.div);    
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Boxes"
});
