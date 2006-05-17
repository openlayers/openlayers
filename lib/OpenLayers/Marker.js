OpenLayers.Marker = Class.create();
OpenLayers.Marker.prototype = {
    
    // icon: {OpenLayers.Icon} for marker
    icon: null,

    // latlon: {OpenLayers.LatLon} location of object
    latlon: null,
    
    // events
    events: null,
    
    // map
    map: null,
    
    initialize: function(icon, latlon) {
        this.icon = icon;
        this.latlon = latlon;
    },

    draw: function() {
        var resolution = this.map.getResolution();
        var extent = this.map.getExtent();
        if (this.latlon.lat > extent.minlat && 
               this.latlon.lat < extent.maxlat &&
               this.lonlon.lon > extent.minlon && 
               this.lonlon.lon < extent.maxlon) {
            var pixel = new OpenLayers.Pixel(
                          resolution * (this.latlon.lon - extent.minlon),
                          resolution * (extent.maxlat - this.latlon.lat)
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
