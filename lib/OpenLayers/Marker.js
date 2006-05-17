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
        // Create a div here, and set the location to the pixel above modified
        // by the icon size.
        var markerObject = OpenLayers.Util.createImage(
            this.icon.url,
            this.icon.size,
            new OpenLayers.Pixel(
              pixel.x-(this.icon.size.w/2), 
              pixel.y-this.icon.size.h)
            );
        return markerObject;
    } 
}
