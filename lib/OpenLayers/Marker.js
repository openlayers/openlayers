OpenLayers.Marker = Class.create();
OpenLayers.Marker.prototype = {
    
    /** @type OpenLayers.Icon */
    icon: null,

    /** location of object
    * @type OpenLayers.LonLat */
    lonlat: null,
    
    /** the data object associated with the marker
    * @type Object */
    data: null,
    
    /** @type */
    events: null,
    
    /** @type OpenLayers.Map */
    map: null,
    

    /** 
    * @param {OpenLayers.Icon} icon
    * @param {OpenLayers.LonLat lonlat
    */
    initialize: function(icon, lonlat) {
        this.icon = icon;
        this.lonlat = lonlat;
    },
    generateMarker: function(pixel) {
        var markerObject;
        // Create a div here, and set the location to the pixel above
        return markerObject;
    } 
}
