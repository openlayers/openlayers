OpenLayers.Icon = Class.create();
OpenLayers.Icon.prototype = {
    
    // string: image url
    url: null,
    
    // {OpenLayers.Size}: size of image
    size:null,

    /** distance in pixels to offset the image when being rendered
    * @type OpenLayers.Pixel */
    offset: null,    
    
    initialize: function(url, size, offset) {
        this.size = size;
        this.url = url;

        this.offset = offset;
        if (offset == null) {
            // default offset
            this.offset = new OpenLayers.Pixel(size.w / 2, size.h);
        }
            
    },

    // Create a copy of this icon.
    clone: function() {
        return new OpenLayers.Icon(this.size, this.url);
    }
}
