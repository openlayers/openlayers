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
    
    /** 
    * @param {OpenLayers.Pixel} pixel
    * 
    * @return A new DOM Image with this marker´s icon set at the 
    *         location passed-in
    * @type DOMElement
    */
    generateMarker: function(pixel) {
        // Create a div here, and set the location to the pixel above modified
        // by the icon size.
        var markerOffset = new OpenLayers.Pixel(this.icon.size.w / 2, 
                                                this.icon.size.h);
        var iconPosition = pixel.diff(markerOffset);
        var markerObject = OpenLayers.Util.createImage(this.icon.url,
                                                       this.icon.size,
                                                       iconPosition);
        return markerObject;
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Marker"
}
