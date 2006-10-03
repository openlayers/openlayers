/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

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
    
    destroy: function() {
        this.imageDiv = null;
    },

    /** 
    * @returns A fresh copy of the icon.
    * @type OpenLayers.Icon
    */
    clone: function() {
        return new OpenLayers.Icon(this.url, 
                                   this.size, 
                                   this.offset, 
                                   this.calculateOffset);
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

    
    /** Change the icon's opacity
     * @param {float} opacity
     */
    setOpacity: function(opacity) {
        OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv, null, null, null, 
                                            null, null, null, null, opacity);

    },
    
    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function (px) {
        //if no px passed in, use stored location
        if (px != null) {
            this.px = px;
        }

        if (this.imageDiv != null) {
            if (this.px == null) {
                this.display(false);
            } else {
                if (this.calculateOffset) {
                    this.offset = this.calculateOffset(this.size);  
                }
                var offsetPx = this.px.offset(this.offset);
                OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv, null, offsetPx);
                this.display(true);
            }
        }
    },
    
    /** Hide or show the icon
     * 
     * @param {Boolean} display
     */
    display: function(display) {
        this.imageDiv.style.display = (display) ? "" : "none"; 
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Icon"
};