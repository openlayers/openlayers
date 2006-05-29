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
    
    /** @type DOMElement */
    image: null,
    
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
        this.offset = (offset) ? offset 
                               : new OpenLayers.Pixel(0,0); 

        this.image = OpenLayers.Util.createAlphaImageDiv(null,
                                                 null,
                                                 this.size,
                                                 this.url,
                                                 "absolute"
                                                );
    },

    /** 
    * @returns A fresh copy of the icon.
    * @type OpenLayers.Icon
    */
    clone: function() {
        return new OpenLayers.Icon(this.size, this.url, this.offset);
    },
    
    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return A new DOM Image of this icon set at the location passed-in
    * @type DOMElement
    */
    draw: function(px) {
        this.moveTo(px);
        return this.image;
    }, 

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function (px) {
        if ((px != null) && (this.image != null)) {
            offsetPx = px.offset(this.offset);
            this.image.style.left = offsetPx.x + "px"; 
            this.image.style.top = offsetPx.y + "px"
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Icon"
};