/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Util.js
 */
OpenLayers.Feature = OpenLayers.Class.create();
OpenLayers.Feature.prototype= {

    /** @type OpenLayers.Events */
    events:null,

    /** @type OpenLayers.Layer */
    layer: null,

    /** @type String */
    id: null,
    
    /** @type OpenLayers.LonLat */
    lonlat:null,

    /** @type Object */
    data:null,

    /** @type OpenLayers.Marker */
    marker: null,

    /** @type OpenLayers.Popup */
    popup: null,

    /** 
     * @constructor
     * 
     * @param {OpenLayers.Layer} layer
     * @param {OpenLayers.LonLat} lonlat
     * @param {Object} data
     */
    initialize: function(layer, lonlat, data) {
        this.layer = layer;
        this.lonlat = lonlat;
        this.data = (data != null) ? data : new Object();
        this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_"); 
    },

    /**
     * 
     */
    destroy: function() {

        //remove the popup from the map
        if ((this.layer != null) && (this.layer.map != null)) {
            if (this.popup != null) {
                this.layer.map.removePopup(this.popup);
            }
        }

        this.events = null;
        this.layer = null;
        this.id = null;
        this.lonlat = null;
        this.data = null;
        if (this.marker != null) {
            this.destroyMarker(this.marker);
            this.marker = null;
        }
        if (this.popup != null) {
            this.destroyPopup(this.popup);
            this.popup = null;
        }
    },
    
    /**
     * @returns Whether or not the feature is currently visible on screen
     *           (based on its 'lonlat' property)
     * @type Boolean
     */
    onScreen:function() {
        
        var onScreen = false;
        if ((this.layer != null) && (this.layer.map != null)) {
            var screenBounds = this.layer.map.getExtent();
            onScreen = screenBounds.containsLonLat(this.lonlat);
        }    
        return onScreen;
    },
    

    /**
     * @returns A Marker Object created from the 'lonlat' and 'icon' properties
     *          set in this.data. If no 'lonlat' is set, returns null. If no
     *          'icon' is set, OpenLayers.Marker() will load the default image.
     *          
     *          Note: this.marker is set to return value
     * 
     * @type OpenLayers.Marker
     */
    createMarker: function() {

        var marker = null;
        
        if (this.lonlat != null) {
            this.marker = new OpenLayers.Marker(this.lonlat, this.data.icon);
        }
        return this.marker;
    },

    /** If user overrides the createMarker() function, s/he should be able
     *   to also specify an alternative function for destroying it
     */
    destroyMarker: function() {
        this.marker.destroy();  
    },

    /**
     * @returns A Popup Object created from the 'lonlat', 'popupSize',
     *          and 'popupContentHTML' properties set in this.data. It uses
     *          this.marker.icon as default anchor. 
     *          
     *          If no 'lonlat' is set, returns null. 
     *          If no this.marker has been created, no anchor is sent.
     * 
     *          Note: this.popup is set to return value
     * 
     * @type OpenLayers.Popup.AnchoredBubble
     */
    createPopup: function() {

        if (this.lonlat != null) {
            
            var id = this.id + "_popup";
            var anchor = (this.marker) ? this.marker.icon : null;

            this.popup = new OpenLayers.Popup.AnchoredBubble(id, 
                                                    this.lonlat,
                                                    this.data.popupSize,
                                                    this.data.popupContentHTML,
                                                    anchor); 
        }        
        return this.popup;
    },

    
    /** As with the marker, if user overrides the createPopup() function, s/he 
     *   should also be able to override the destruction
     */
    destroyPopup: function() {
        this.popup.destroy() 
    },
    
    CLASS_NAME: "OpenLayers.Feature"
};
