/**
 * @class
 */
OpenLayers.Feature = Class.create();
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

    /** @type OpenLayers.Icon */
    icon: null,

    /** @type OpenLayers.Marker */
    marker: null,

    /** @type OpenLayers.Popup */
    popup: null,

    /** 
     * @constructor
     * 
     * @param {OpenLayers.Layer} layer
     * @param {String} id
     * @param {OpenLayers.LonLat} lonlat
     * @param {Object} data
     */
    initialize: function(layer, lonlat, data, id) {
        this.layer = layer;
        this.lonlat = lonlat;
        this.data = (data != null) ? data : new Object();
        this.id = (id ? id : 'f'+Math.random());
    },

    /**
     * 
     */
    destroy: function() {
        this.layer = null;
    },
    

    /**
     * 
     */
    createMarker: function() {

        var imgLocation = OpenLayers.Util.getImagesLocation();

        if (this.lonlat != null) {

            var imgURL = (this.data.iconURL) ? this.data.iconURL 
                                             : imgLocation + "marker.png";

            var imgSize = (this.data.iconSize) ? this.data.iconSize
                                               : new OpenLayers.Size(21, 25);

            var imgOffset = (this.data.iconOffset) ? this.data.iconOffset
                                                   : null;

            this.icon = new OpenLayers.Icon(imgURL, imgSize, imgOffset);

            this.marker = new OpenLayers.Marker(this.lonlat, 
                                                this.icon);
        }
        return this.marker;
    },

    /**
     * 
     */
    createPopup: function() {

        if (this.lonlat != null) {
            
            if (this.marker) {
                var anchorSize = this.marker.icon.size;
            }
            
            this.popup = 
               new OpenLayers.Popup.AnchoredBubble(this.id + "_popup", 
                                                   this.lonlat,
                                                   this.data.popupSize,
                                                   this.data.popupContentHTML,
                                                   anchorSize); 
        }        
        return this.popup;
    },

    CLASS_NAME: "OpenLayers.Feature"
};
