OpenLayers.Layer.Google = Class.create();
OpenLayers.Layer.Google.prototype = Object.extend( new OpenLayers.Layer(), {
    // gmap stores the Google Map element
    gmap:null,
    initialize: function(name) {
        OpenLayers.Layer.prototype.initialize.apply(this, [name]);
        this.gmap = new GMap2(this.div);
    },
    moveTo: function() {
        center = this.map.getCenter();
        this.gmap.setCenter(
           new GLatLng(center.lat, center.lon), 
           this.map.getZoom()
        );
    } 
    
});
