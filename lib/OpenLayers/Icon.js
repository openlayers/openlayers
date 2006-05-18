/**
* @class
*/
OpenLayers.Icon = Class.create();
OpenLayers.Icon.prototype = {
    
    /** image url
    * @type String */
    url: null,
    
    /** @type OpenLayers.Size */
    size:null,

    /** distance in pixels to offset the image when being rendered
    * @type OpenLayers.Pixel */
    offset: null,    
    
    /** 
    * @constructor
    *
    * @param {String} url
    * @param {OpenLayers.Size} size
    * @param {OpenLayers.Pixel} offset
    */
    initialize: function(url, size, offset) {
        this.size = size;
        this.url = url;

        this.offset = offset;
        if (offset == null) {
            // default offset
            this.offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
        }
            
    },

    /** 
    * @returns A fresh copy of the icon.
    * @type OpenLayers.Icon
    */
    clone: function() {
        return new OpenLayers.Icon(this.size, this.url, this.offset);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Icon"
}
