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
    
    }
});
