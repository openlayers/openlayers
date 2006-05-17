OpenLayers.Layer.Marker = Class.create();
OpenLayers.Layer.Marker.prototype = 
  Object.extend( new OpenLayers.Layer(), {
    
    // markers: store internal marker list
    markers:null,
    
    initialize: function(name) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);
    },
    
    // Implement this. It may not need to do anything usually.
    moveTo:function(bounds,zoomChanged) {
    
    },
    addMarker:function(marker) {
        this.markers.append(marker);
        var resolution = this.map.getResolution();
        var extent = this.map.getExtent();
        var pixel = new OpenLayers.Pixel(
                       resolution * (this.lonlat.lon - extent.minlon),
                       resolution * (extent.maxlat - this.lonlat.lat)
                       );
        var m = marker.generateMarker(pixel);
        this.div.appendChild(m);
    },
});
