/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/BaseTypes/Class.js
 */

/**
 * Class: OpenLayers.Icon
 * 
 * The icon represents a graphical icon on the screen.  Typically used in
 * conjunction with a <OpenLayers.Marker> to represent markers on a screen.
 *
 * An icon has a url, size and position.  It also contains an offset which 
 * allows the center point to be represented correctly.  This can be
 * provided either as a fixed offset or a function provided to calculate
 * the desired offset. 
 * 
 */
OpenLayers.Icon = OpenLayers.Class({
    
    /** 
     * Property: url 
     * {String}  image url
     */
    url: null,
    
    /** 
     * Property: size 
     * {<OpenLayers.Size>|Object} An OpenLayers.Size or
     * an object with a 'w' and 'h' properties.
     */
    size: null,

    /** 
     * Property: offset 
     * {<OpenLayers.Pixel>|Object} distance in pixels to offset the
     * image when being rendered. An OpenLayers.Pixel or an object
     * with a 'x' and 'y' properties.
     */
    offset: null,    
    
    /** 
     * Property: calculateOffset 
     * {Function} Function to calculate the offset (based on the size)
     */
    calculateOffset: null,    
    
    /** 
     * Property: imageDiv 
     * {DOMElement} 
     */
    imageDiv: null,

    /** 
     * Property: px 
     * {<OpenLayers.Pixel>|Object} An OpenLayers.Pixel or an object
     * with a 'x' and 'y' properties.
     */
    px: null,
    
    /** 
     * Constructor: OpenLayers.Icon
     * Creates an icon, which is an image tag in a div.  
     *
     * url - {String} 
     * size - {<OpenLayers.Size>|Object} An OpenLayers.Size or an
     *                                   object with a 'w' and 'h'
     *                                   properties.
     * offset - {<OpenLayers.Pixel>|Object} An OpenLayers.Pixel or an
     *                                      object with a 'x' and 'y'
     *                                      properties.
     * calculateOffset - {Function} 
     */
    initialize: function(url, size, offset, calculateOffset) {
        this.url = url;
        this.size = size || {w: 20, h: 20};
        this.offset = offset || {x: -(this.size.w/2), y: -(this.size.h/2)};
        this.calculateOffset = calculateOffset;

        var id = OpenLayers.Util.createUniqueID("OL_Icon_");
        this.imageDiv = OpenLayers.Util.createAlphaImageDiv(id);
    },
    
    /** 
     * Method: destroy
     * Nullify references and remove event listeners to prevent circular 
     * references and memory leaks
     */
    destroy: function() {
        // erase any drawn elements
        this.erase();

        OpenLayers.Event.stopObservingElement(this.imageDiv.firstChild); 
        this.imageDiv.innerHTML = "";
        this.imageDiv = null;
    },

    /** 
     * Method: clone
     * 
     * Returns:
     * {<OpenLayers.Icon>} A fresh copy of the icon.
     */
    clone: function() {
        return new OpenLayers.Icon(this.url, 
                                   this.size, 
                                   this.offset, 
                                   this.calculateOffset);
    },
    
    /**
     * Method: setSize
     * 
     * Parameters:
     * size - {<OpenLayers.Size>|Object} An OpenLayers.Size or
     * an object with a 'w' and 'h' properties.
     */
    setSize: function(size) {
        if (size != null) {
            this.size = size;
        }
        this.draw();
    },
    
    /**
     * Method: setUrl
     * 
     * Parameters:
     * url - {String} 
     */
    setUrl: function(url) {
        if (url != null) {
            this.url = url;
        }
        this.draw();
    },

    /** 
     * Method: draw
     * Move the div to the given pixel.
     * 
     * Parameters:
     * px - {<OpenLayers.Pixel>|Object} An OpenLayers.Pixel or an
     *                                  object with a 'x' and 'y' properties.
     * 
     * Returns:
     * {DOMElement} A new DOM Image of this icon set at the location passed-in
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
     * Method: erase
     * Erase the underlying image element.
     */
    erase: function() {
        if (this.imageDiv != null && this.imageDiv.parentNode != null) {
            OpenLayers.Element.remove(this.imageDiv);
        }
    }, 
    
    /** 
     * Method: setOpacity
     * Change the icon's opacity
     *
     * Parameters:
     * opacity - {float} 
     */
    setOpacity: function(opacity) {
        OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv, null, null, null, 
                                            null, null, null, null, opacity);

    },
    
    /**
     * Method: moveTo
     * move icon to passed in px.
     *
     * Parameters:
     * px - {<OpenLayers.Pixel>|Object} the pixel position to move to.
     * An OpenLayers.Pixel or an object with a 'x' and 'y' properties.
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
                OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv, null, {
                    x: this.px.x + this.offset.x,
                    y: this.px.y + this.offset.y
                });
            }
        }
    },
    
    /** 
     * Method: display
     * Hide or show the icon
     *
     * Parameters:
     * display - {Boolean} 
     */
    display: function(display) {
        this.imageDiv.style.display = (display) ? "" : "none"; 
    },
    

    /**
     * APIMethod: isDrawn
     * 
     * Returns:
     * {Boolean} Whether or not the icon is drawn.
     */
    isDrawn: function() {
        // nodeType 11 for ie, whose nodes *always* have a parentNode
        // (of type document fragment)
        var isDrawn = (this.imageDiv && this.imageDiv.parentNode && 
                       (this.imageDiv.parentNode.nodeType != 11));    

        return isDrawn;   
    },

    CLASS_NAME: "OpenLayers.Icon"
});
