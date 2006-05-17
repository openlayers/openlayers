OpenLayers.Icon = Class.create();
OpenLayers.Icon.prototype = {
    
    // string: image url
    url: null,
    
    // {OpenLayers.Size}: size of image
    size:null,
    
    initialize: function(url, size) {
        this.size = size;
        this.url = url;
    },

    // Create a copy of this icon.
    clone: function() {
        return new OpenLayers.Icon(this.size, this.url);
    }
}
