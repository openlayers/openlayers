/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 * 
 * @requires OpenLayers/Popup/Anchored.js
 */
OpenLayers.Popup.AnchoredBubble = OpenLayers.Class.create();

//Border space for the rico corners
OpenLayers.Popup.AnchoredBubble.CORNER_SIZE = 5;

OpenLayers.Popup.AnchoredBubble.prototype =
   OpenLayers.Class.inherit( OpenLayers.Popup.Anchored, {

    rounded: false, 
    
    /** 
    * @constructor
    * 
    * @param {String} id
    * @param {OpenLayers.LonLat} lonlat
    * @param {OpenLayers.Size} size
    * @param {String} contentHTML
    * @param {Object} anchor  Object which must expose a 
    *                         - 'size' (OpenLayers.Size) and 
    *                         - 'offset' (OpenLayers.Pixel) 
    *                         (this is generally an OpenLayers.Icon)
    * @param {Boolean} closeBox
    */
    initialize:function(id, lonlat, size, contentHTML, anchor, closeBox) {
        OpenLayers.Popup.Anchored.prototype.initialize.apply(this, arguments);
    },

    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @returns Reference to a div that contains the drawn popup
    * @type DOMElement
    */
    draw: function(px) {
        
        OpenLayers.Popup.Anchored.prototype.draw.apply(this, arguments);

        this.setContentHTML();
        
        this.setRicoCorners(!this.rounded);
        this.rounded = true;
        
        //set the popup color and opacity           
        this.setBackgroundColor(); 
        this.setOpacity();

        return this.div;
    },

    /**
    * @param {OpenLayers.Size} size
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
     * @param {String} color
     */
    setBackgroundColor:function(color) { 
        if (color != undefined) {
            this.backgroundColor = color; 
        }
        
        if (this.div != null) {
            if (this.contentDiv != null) {
                this.div.style.background = "transparent";
                OpenLayers.Rico.Corner.changeColor(this.contentDiv, this.backgroundColor);
            }
        }
    },  
    
    /**
     * @param {float} opacity
     */
    setOpacity:function(opacity) { 
        if (opacity != undefined) {
            this.opacity = opacity; 
        }
        
        if (this.div != null) {
            if (this.contentDiv != null) {
            OpenLayers.Rico.Corner.changeOpacity(this.contentDiv, this.opacity);
            }
        }
    },  
 
    /** Bubble Popups can not have a border
     * 
     * @param {int} border
     */
    setBorder:function(border) { 
        this.border = 0;
    },      
 
    /** 
     * @private
     * 
     * @param {Boolean} firstTime Is this the first time the corners are being
     *                             rounded?
     * 
     * update the rico corners according to the popup's
     * current relative postion 
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
     * @private
     * 
     * @returns The proper corners string ("tr tl bl br") for rico
     *           to round
     * @type String
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
