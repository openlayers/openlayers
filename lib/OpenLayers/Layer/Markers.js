/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @requires OpenLayers/Layer.js
 * 
 * Class: OpenLayers.Layer.Markers
 * 
 * Inherits from:
 *  - <OpenLayers.Layer> 
 */
OpenLayers.Layer.Markers = OpenLayers.Class(OpenLayers.Layer, {
    
    /** 
     * APIProperty: isBaseLayer 
     * {Boolean} Markers layer is never a base layer.  
     */
    isBaseLayer: false,
    
    /** 
     * Property: markers 
     * Array({<OpenLayers.Marker>}) internal marker list 
     */
    markers: null,


    /** 
     * Property: drawn 
     * {Boolean} internal state of drawing. This is a workaround for the fact
     * that the map does not call moveTo with a zoomChanged when the map is
     * first starting up. This lets us catch the case where we have *never*
     * drawn the layer, and draw it even if the zoom hasn't changed.
     */
    drawn: false,
    
    /**
     * Constructor: OpenLayers.Layer.Markers 
     * Create a Markers layer.
     *
     * Parameters:
     * name - {String} 
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, options) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);
        this.markers = new Array();
    },
    
    /**
     * APIMethod: destroy 
     */
    destroy: function() {
        this.clearMarkers();
        this.markers = null;
        OpenLayers.Layer.prototype.destroy.apply(this, arguments);
    },

    
    /** 
     * Method: moveTo
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} 
     * zoomChanged - {Boolean} 
     * dragging - {Boolean} 
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

        if (zoomChanged || !this.drawn) {
            for(i=0; i < this.markers.length; i++) {
                this.drawMarker(this.markers[i]);
            }
            this.drawn = true;
        }
    },

    /**
     * APIMethod: addMarker
     *
     * Parameters:
     * marker - {<OpenLayers.Marker>} 
     */
    addMarker: function(marker) {
        this.markers.push(marker);
        if (this.map && this.map.getExtent()) {
            marker.map = this.map;
            this.drawMarker(marker);
        }
    },

    /**
     * APIMethod: removeMarker
     *
     * Parameters:
     * marker - {<OpenLayers.Marker>} 
     */
    removeMarker: function(marker) {
        OpenLayers.Util.removeItem(this.markers, marker);
        if ((marker.icon != null) && (marker.icon.imageDiv != null) &&
            (marker.icon.imageDiv.parentNode == this.div) ) {
            this.div.removeChild(marker.icon.imageDiv);    
            marker.drawn = false;
        }
    },

    /**
     * Method: clearMarkers
     * This method removes all markers from a layer. The markers are not
     * destroyed by this function, but are removed from the list of markers.
     */
    clearMarkers: function() {
        if (this.markers != null) {
            while(this.markers.length > 0) {
                this.removeMarker(this.markers[0]);
            }
        }
    },

    /** 
     * Method: drawMarker
     * Calculate the pixel location for the marker, create it, and 
     *    add it to the layer's div
     *
     * Parameters:
     * marker - {<OpenLayers.Marker>} 
     */
    drawMarker: function(marker) {
        var px = this.map.getLayerPxFromLonLat(marker.lonlat);
        if (px == null) {
            marker.display(false);
        } else {
            var markerImg = marker.draw(px);
            if (!marker.drawn) {
                this.div.appendChild(markerImg);
                marker.drawn = true;
            }
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Markers"
});
