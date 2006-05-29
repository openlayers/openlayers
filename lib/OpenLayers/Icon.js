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
    
    /** Function to calculate the offset (based on the size) 
     * @type OpenLayers.Pixel */
    calculateOffset: null,    
    
    /** @type DOMElement */
    imageDiv: null,

    /** @type OpenLayers.Pixel */
    px: null,
    
    /** 
    * @constructor
    *
    * @param {String} url
    * @param {OpenLayers.Size} size
    * @param {Function} calculateOffset
    */
    initialize: function(url, size, offset, calculateOffset) {
        this.url = url;
        this.size = (size) ? size : new OpenLayers.Size(20,20);
        this.offset = (offset) ? offset : new OpenLayers.Pixel(0,0);
        this.calculateOffset = calculateOffset;

        this.imageDiv = OpenLayers.Util.createAlphaImageDiv();
    },

    /** 
    * @returns A fresh copy of the icon.
    * @type OpenLayers.Icon
    */
    clone: function() {
        return new OpenLayers.Icon(this.size, this.url, this.offset);
    },
    
    /**
     * @param {OpenLayers.Size} size
     */
    setSize: function(size) {
        if (size != null) {
            this.size = size;
        }
        this.draw();
    },

    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @return A new DOM Image of this icon set at the location passed-in
    * @type DOMElement
    */
    draw: function(px) {
        OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv, 
                                            null, 
                                            null, 
                                            this.size, 
                                            this.url, 
                                            "absolute");
        this.moveTo(px);
        return this.imageDiv;
    }, 

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function (px) {
        //if no px passed in, use stored location
        if (px != null) {
            this.px = px;
        }

        if ((this.px != null) && (this.imageDiv != null)) {
            if (this.calculateOffset) {
                this.offset = this.calculateOffset(this.size);  
            }
            var offsetPx = this.px.offset(this.offset);
            OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv, null, offsetPx);
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Icon"
};