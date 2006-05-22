/**
* @class
*/
OpenLayers.Layer.Marker = Class.create();
OpenLayers.Layer.Marker.prototype = 
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


    /** clear all the marker div's from the layer and then redraw all of them.
    *    Use the map to recalculate new placement of markers.
    */
    redraw: function() {

        this.clear();
        for(i=0; i < this.markers.length; i++) {
            this.drawMarker(this.markers[i]);
        }

    },

    /** This function clears the visual display of the markers, without
    *    removing them from memory (this.markers array). 
    *
    * @private
    */
    clear: function() {
        this.div.innerHTML = "";
    },


    /** Calculate the screen pixel location for the marker, create it, and 
    *    add it to the layer's div
    * 
    * @private 
    * 
    * @param {OpenLayers.Marker} marker
    */
    drawMarker: function(marker) {
        var px = this.map.getPixelFromLonLat(marker.lonlat);
        var markerDiv = marker.draw(px);
        this.div.appendChild(markerDiv);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Marker"
});
