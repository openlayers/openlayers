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
    */
    draw: function() {
        var resolution = this.map.getResolution();
        var extent = this.map.getExtent();
        if ( (this.lonlat.lat > extent.minlat)
             && (this.lonlat.lat < extent.maxlat)
             && (this.lonlat.lon > extent.minlon)
             && (this.lonlat.lon < extent.maxlon)) {

            var pixel = new OpenLayers.Pixel(
                          resolution * (this.lonlat.lon - extent.minlon),
                          resolution * (extent.maxlat - this.lonlat.lat)
                          );
            // need to account for how much layer has moved...
            /* Psuedocode:
               div = map.markersDiv;
               marker = OpenLayers.Util.createDiv('marker'+rand(), pixel, this.icon.size, null, this.icon.url);
               div.appendChild(marker);
               */
        }
    } 
}
