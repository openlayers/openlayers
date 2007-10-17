/* Copyright (c) 2006-2007 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Popup/Anchored.js
 * 
 * Class: OpenLayers.Popup.AnchoredBubble
 * 
 * Inherits from: 
 *  - <OpenLayers.Popup.Anchored>
 */
OpenLayers.Popup.AnchoredBubble = 
  OpenLayers.Class(OpenLayers.Popup.Anchored, {

    /**
     * Property: rounded
     * {Boolean} Has the popup been rounded yet?
     */
    rounded: false, 
    
    /** 
     * Constructor: OpenLayers.Popup.AnchoredBubble
     * 
     * Parameters:
     * id - {String}
     * lonlat - {<OpenLayers.LonLat>}
     * size - {<OpenLayers.Size>}
     * contentHTML - {String}
     * anchor - {Object} Object to which we'll anchor the popup. Must expose 
     *     a 'size' (<OpenLayers.Size>) and 'offset' (<OpenLayers.Pixel>) 
     *     (Note that this is generally an <OpenLayers.Icon>).
     * closeBox - {Boolean}
     * closeBoxCallback - {Function} Function to be called on closeBox click.
     */
    initialize:function(id, lonlat, size, contentHTML, anchor, closeBox,
                        closeBoxCallback) {
        OpenLayers.Popup.Anchored.prototype.initialize.apply(this, arguments);
    },

    /** 
     * Method: draw
     * 
     * Parameters:
     * px - {<OpenLayers.Pixel>}
     * 
     * Returns:
     * {DOMElement} Reference to a div that contains the drawn popup.
     */
    draw: function(px) {
        
        OpenLayers.Popup.Anchored.prototype.draw.apply(this, arguments);

        this.setContentHTML();
        
        //set the popup color and opacity           
        this.setBackgroundColor(); 
        this.setOpacity();

        return this.div;
    },

    /**
     * Method: moveTo
     * The popup may have been moved to a new relative location, in which case
     *     we will want to re-do the rico corners.
     * 
     * Parameters:
     * px - {<OpenLayers.Pixel>}
     */
    moveTo: function(px) {
        OpenLayers.Popup.Anchored.prototype.moveTo.apply(this, arguments);
        this.setRicoCorners(!this.rounded);
        this.rounded = true;
    },

    /**
     * APIMethod: setSize
     * 
     * Parameters:
     * size - {<OpenLayers.Size>}
     */
    setSize:function(size) { 
        OpenLayers.Popup.Anchored.prototype.setSize.apply(this, arguments);
        
        if (this.contentDiv != null) {

            var contentSize = this.size.clone();
            contentSize.h -= (2 * OpenLayers.Popup.AnchoredBubble.CORNER_SIZE);
            contentSize.h -= (2 * this.padding);
    
            this.contentDiv.style.height = contentSize.h + "px";
            this.contentDiv.style.width  = contentSize.w + "px";
            
            if (this.map) {
                //size has changed - must redo corners        
                this.setRicoCorners(!this.rounded);
                this.rounded = true;
            }    
        }
    },  

    /**
     * APIMethod: setBackgroundColor
     * 
     * Parameters:
     * color - {String}
     */
    setBackgroundColor:function(color) { 
        if (color != undefined) {
            this.backgroundColor = color; 
        }
        
        if (this.div != null) {
            if (this.contentDiv != null) {
                this.div.style.background = "transparent";
                OpenLayers.Rico.Corner.changeColor(this.contentDiv, 
                                                   this.backgroundColor);
            }
        }
    },  
    
    /**
     * APIMethod: setOpacity
     * 
     * Parameters: 
     * opacity - {float}
     */
    setOpacity:function(opacity) { 
        if (opacity != undefined) {
            this.opacity = opacity; 
        }
        
        if (this.div != null) {
            if (this.contentDiv != null) {
                OpenLayers.Rico.Corner.changeOpacity(this.contentDiv, 
                                                     this.opacity);
            }
        }
    },  
 
    /** 
     * Method: setBorder
     * Always sets border to 0. Bubble Popups can not have a border.
     * 
     * Parameters:
     * border - {Integer}
     */
    setBorder:function(border) { 
        this.border = 0;
    },      
 
    /** 
     * Method: setRicoCorners
     * Update RICO corners according to the popup's current relative postion.
     *  
     * Parameters:
     * firstTime - {Boolean} This the first time the corners are being rounded.
     */
    setRicoCorners:function(firstTime) {
    
        var corners = this.getCornersToRound(this.relativePosition);
        var options = {corners: corners,
                         color: this.backgroundColor,
                       bgColor: "transparent",
                         blend: false};

        if (firstTime) {
            OpenLayers.Rico.Corner.round(this.div, options);
        } else {
            OpenLayers.Rico.Corner.reRound(this.groupDiv, options);
            //set the popup color and opacity
            this.setBackgroundColor(); 
            this.setOpacity();
        }
    },

    /** 
     * Method: getCornersToRound
     *  
     * Returns:
     * {String} The proper corners string ("tr tl bl br") for rico to round.
     */
    getCornersToRound:function() {

        var corners = ['tl', 'tr', 'bl', 'br'];

        //we want to round all the corners _except_ the opposite one. 
        var corner = OpenLayers.Bounds.oppositeQuadrant(this.relativePosition);
        OpenLayers.Util.removeItem(corners, corner);

        return corners.join(" ");
    },

    CLASS_NAME: "OpenLayers.Popup.AnchoredBubble"
});

/**
 * Constant: CORNER_SIZE
 * {Integer} 5. Border space for the RICO corners.
 */
OpenLayers.Popup.AnchoredBubble.CORNER_SIZE = 5;

