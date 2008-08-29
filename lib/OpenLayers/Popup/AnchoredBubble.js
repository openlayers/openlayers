/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Popup/Anchored.js
 */

/**
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
     * contentSize - {<OpenLayers.Size>}
     * contentHTML - {String}
     * anchor - {Object} Object to which we'll anchor the popup. Must expose 
     *     a 'size' (<OpenLayers.Size>) and 'offset' (<OpenLayers.Pixel>) 
     *     (Note that this is generally an <OpenLayers.Icon>).
     * closeBox - {Boolean}
     * closeBoxCallback - {Function} Function to be called on closeBox click.
     */
    initialize:function(id, lonlat, contentSize, contentHTML, anchor, closeBox,
                        closeBoxCallback) {
        
        this.padding = new OpenLayers.Bounds(
            0, OpenLayers.Popup.AnchoredBubble.CORNER_SIZE,
            0, OpenLayers.Popup.AnchoredBubble.CORNER_SIZE
        );
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
     * Method: updateRelativePosition
     * The popup has been moved to a new relative location, in which case
     *     we will want to re-do the rico corners.
     */
    updateRelativePosition: function() {
        this.setRicoCorners();
    },

    /**
     * APIMethod: setSize
     * 
     * Parameters:
     * contentSize - {<OpenLayers.Size>} the new size for the popup's 
     *     contents div (in pixels).
     */
    setSize:function(contentSize) { 
        OpenLayers.Popup.Anchored.prototype.setSize.apply(this, arguments);

        this.setRicoCorners();
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
                OpenLayers.Rico.Corner.changeColor(this.groupDiv, 
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
        OpenLayers.Popup.Anchored.prototype.setOpacity.call(this, opacity);
        
        if (this.div != null) {
            if (this.groupDiv != null) {
                OpenLayers.Rico.Corner.changeOpacity(this.groupDiv, 
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
     */
    setRicoCorners:function() {
    
        var corners = this.getCornersToRound(this.relativePosition);
        var options = {corners: corners,
                         color: this.backgroundColor,
                       bgColor: "transparent",
                         blend: false};

        if (!this.rounded) {
            OpenLayers.Rico.Corner.round(this.div, options);
            this.rounded = true;
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

