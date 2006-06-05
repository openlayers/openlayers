// @require: OpenLayers/Layer.js
/**
* @class
*/
OpenLayers.Layer.Markers = Class.create();
OpenLayers.Layer.Markers.prototype = 
  Object.extend( new OpenLayers.Layer(), {
    
    /** internal marker list
    * @type Array(OpenLayers.Marker) */
    markers: null,
    
    /**
    * @constructor
    *
    * @param {String} name
    */
    initialize: function(name) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);
        this.markers = new Array();
    },
    
    /** 
    * @param {OpenLayers.Bounds} bounds
    * @param {Boolean} zoomChanged
    */
    moveTo: function(bounds, zoomChanged) {
        if (zoomChanged) {
            this.redraw();
        }
    },

    /**
    * @param {OpenLayers.Marker} marker
    */
    addMarker: function(marker) {
        this.markers.append(marker);
        if (this.map && this.map.getExtent()) {
            this.drawMarker(marker);
        }
    },

    /**
     * @param {OpenLayers.Marker} marker
     */
    removeMarker: function(marker) {
        var index = null;
        for(var i=0; i < this.markers.length; i++) {
            if (this.markers[i] == marker) {
                index = i;        
            }
        }
        if (index != null) {
            this.markers.splice(index, 1);
        }
        if ((marker.icon != null) && (marker.icon.imageDiv != null) &&
            (marker.icon.imageDiv.parentNode == this.div) ) {
            this.div.removeChild(marker.icon.imageDiv);    
        }
    },

    /** clear all the marker div's from the layer and then redraw all of them.
    *    Use the map to recalculate new placement of markers.
    */
    redraw: function() {
        for(i=0; i < this.markers.length; i++) {
            this.drawMarker(this.markers[i]);
        }
    },

    /** Calculate the screen pixel location for the marker, create it, and 
    *    add it to the layer's div
    * 
    * @private 
    * 
    * @param {OpenLayers.Marker} marker
    */
    drawMarker: function(marker) {
        var px = this.map.getLayerPxFromLonLat(marker.lonlat);
        var markerImg = marker.draw(px);
        if (!marker.drawn) {
            this.div.appendChild(markerImg);
            marker.drawn = true;
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Markers"
});
