/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Marker.js
 * @requires OpenLayers/Popup/AnchoredBubble.js
 */

/**
 * Class: OpenLayers.Feature
 * Features are combinations of geography and attributes. The OpenLayers.Feature
 *     class specifically combines a marker and a lonlat.
 */
OpenLayers.Feature = OpenLayers.Class({

    /** 
     * Property: layer 
     * {<OpenLayers.Layer>} 
     */
    layer: null,

    /** 
     * Property: id 
     * {String} 
     */
    id: null,
    
    /** 
     * Property: lonlat 
     * {<OpenLayers.LonLat>} 
     */
    lonlat: null,

    /** 
     * Property: data 
     * {Object} 
     */
    data: null,

    /** 
     * Property: marker 
     * {<OpenLayers.Marker>} 
     */
    marker: null,

    /**
     * APIProperty: popupClass
     * {<OpenLayers.Class>} The class which will be used to instantiate
     *     a new Popup. Default is <OpenLayers.Popup.AnchoredBubble>.
     */
    popupClass: OpenLayers.Popup.AnchoredBubble,

    /** 
     * Property: popup 
     * {<OpenLayers.Popup>} 
     */
    popup: null,

    /** 
     * Constructor: OpenLayers.Feature
     * Constructor for features.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer>} 
     * lonlat - {<OpenLayers.LonLat>} 
     * data - {Object} 
     * 
     * Returns:
     * {<OpenLayers.Feature>}
     */
    initialize: function(layer, lonlat, data) {
        this.layer = layer;
        this.lonlat = lonlat;
        this.data = (data != null) ? data : {};
        this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_"); 
    },

    /** 
     * Method: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {

        //remove the popup from the map
        if ((this.layer != null) && (this.layer.map != null)) {
            if (this.popup != null) {
                this.layer.map.removePopup(this.popup);
            }
        }

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
     * Method: onScreen
     * 
     * Returns:
     * {Boolean} Whether or not the feature is currently visible on screen
     *           (based on its 'lonlat' property)
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
     * Method: createMarker
     * Based on the data associated with the Feature, create and return a marker object.
     *
     * Returns: 
     * {<OpenLayers.Marker>} A Marker Object created from the 'lonlat' and 'icon' properties
     *          set in this.data. If no 'lonlat' is set, returns null. If no
     *          'icon' is set, OpenLayers.Marker() will load the default image.
     *          
     *          Note - this.marker is set to return value
     * 
     */
    createMarker: function() {

        if (this.lonlat != null) {
            this.marker = new OpenLayers.Marker(this.lonlat, this.data.icon);
        }
        return this.marker;
    },

    /**
     * Method: destroyMarker
     * Destroys marker.
     * If user overrides the createMarker() function, s/he should be able
     *   to also specify an alternative function for destroying it
     */
    destroyMarker: function() {
        this.marker.destroy();  
    },

    /**
     * Method: createPopup
     * Creates a popup object created from the 'lonlat', 'popupSize',
     *     and 'popupContentHTML' properties set in this.data. It uses
     *     this.marker.icon as default anchor. 
     *  
     *  If no 'lonlat' is set, returns null. 
     *  If no this.marker has been created, no anchor is sent.
     *
     *  Note - the returned popup object is 'owned' by the feature, so you
     *      cannot use the popup's destroy method to discard the popup.
     *      Instead, you must use the feature's destroyPopup
     * 
     *  Note - this.popup is set to return value
     * 
     * Parameters: 
     * closeBox - {Boolean} create popup with closebox or not
     * 
     * Returns:
     * {<OpenLayers.Popup>} Returns the created popup, which is also set
     *     as 'popup' property of this feature. Will be of whatever type
     *     specified by this feature's 'popupClass' property, but must be
     *     of type <OpenLayers.Popup>.
     * 
     */
    createPopup: function(closeBox) {

        if (this.lonlat != null) {
            
            var id = this.id + "_popup";
            var anchor = (this.marker) ? this.marker.icon : null;

            if (!this.popup) {
                this.popup = new this.popupClass(id, 
                                                 this.lonlat,
                                                 this.data.popupSize,
                                                 this.data.popupContentHTML,
                                                 anchor, 
                                                 closeBox); 
            }    
            if (this.data.overflow != null) {
                this.popup.contentDiv.style.overflow = this.data.overflow;
            }    
            
            this.popup.feature = this;
        }        
        return this.popup;
    },

    
    /**
     * Method: destroyPopup
     * Destroys the popup created via createPopup.
     *
     * As with the marker, if user overrides the createPopup() function, s/he 
     *   should also be able to override the destruction
     */
    destroyPopup: function() {
        if (this.popup) {
            this.popup.feature = null;
            this.popup.destroy();
            this.popup = null;
        }    
    },

    CLASS_NAME: "OpenLayers.Feature"
});
