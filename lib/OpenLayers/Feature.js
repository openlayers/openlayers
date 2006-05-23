/**
 * @class
 */
OpenLayers.Feature = Class.create();
OpenLayers.Feature.prototype= {

    /** @type OpenLayers.Events */
    events:null,
    
    /** @type String */
    id: null,
    
    /** @type OpenLayers.LonLat */
    lonlat:null,

    /** @type Object */
    data:null,

    /** 
     * @constructor
     * 
     * @param {String} id
     * @param {OpenLayers.LonLat} lonlat
     * @param {Object} data
     */
    initialize: function(id, lonlat, data) {
        this.id = id;
        this.lonlat = lonlat;
        this.data = data;
    },

    destroy: function() {
    },
    

    createMarker: function(layer) {
        if (this.lonlat && this.data.iconURL 
                        && this.data.iconW 
                        && this.data.iconH) {
            var size = new OpenLayers.Size(this.data.iconW, this.data.iconH);
            var icon = new OpenLayers.Icon(this.data.iconURL, size);
            var marker = new OpenLayers.Marker(this.lonlat,icon);
            if (this.title) { 
                var popup = new OpenLayers.Popup(this.latlon, 
                               this.getContentHTML());
                marker.events.register('click', this, popup.open());
            }
            this.marker = marker;
            layer.addMarker(marker);
        }
    },
    
    /** html content based on feature information
    *
	* ret(str): 
    */
    getContentHTML:function() {
    
        var contentHTML = "";
        
        contentHTML += "<div style='margin: 0.25em'>" 
        
        contentHTML += "<div style='height: 1.5em; overflow: hidden'>" 
        contentHTML += "<span style='font-size: 1.2em; font-weight: bold'>" 
        contentHTML +=     this.data.title;
        contentHTML += "</span>"
        contentHTML += "</div>"

        contentHTML += "</div>"

        return contentHTML;
    },

    CLASS_NAME: "OpenLayers.Feature"
};
