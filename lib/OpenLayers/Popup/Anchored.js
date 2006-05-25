// @require: OpenLayers/Popup.js

/**
* @class
*/
OpenLayers.Popup.Anchored = Class.create();
OpenLayers.Popup.Anchored.prototype =
   Object.extend( new OpenLayers.Popup(), {

    /** "lr", "ll", "tr", "tl" - relative position of the popup.
     * @type String */
    relativePosition: null,

    /** @type OpenLayers.Size */
    anchorSize: null,

    /** 
    * @constructor
    * 
    * @param {String} id
    * @param {OpenLayers.LonLat} lonlat
    * @param {OpenLayers.Size} size
    * @param {String} contentHTML
    */
    initialize:function(id, lonlat, size, contentHTML, anchorSize) {

        var newArguments = new Array(id, lonlat, size, contentHTML);
        OpenLayers.Popup.prototype.initialize.apply(this, newArguments);

        this.anchorSize = (anchorSize != null) ? anchorSize 
                                               : new OpenLayers.Size(0,0);
        
    },

    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @returns Reference to a div that contains the drawn popup
    * @type DOMElement
    */
    draw: function(px) {
        
        //calculate relative position
        this.relativePosition = this.calculateRelativePosition(px);
        
        return OpenLayers.Popup.prototype.draw.apply(this, arguments);
    },
    
    /** 
     * @private
     * 
     * @param {OpenLayers.Pixel} px
     * 
     * @returns The relative position ("br" "tr" "tl "bl") at which the popup
     *           should be placed
     * @type String
     */
    calculateRelativePosition:function(px) {
        var lonlat = this.map.getLonLatFromLayerPx(px);        
        
        var extent = this.map.getExtent();
        var quadrant = extent.determineQuadrant(lonlat);
        
        return this.oppositeQuadrant(quadrant);
    }, 

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function(px) {
        
        var newPx = this.calculateNewPx(px);
        
        var newArguments = new Array(newPx);        
        OpenLayers.Popup.prototype.moveTo.apply(this, newArguments);
    },
    
    /** 
     * @private 
     * 
     * @param {OpenLayers.Pixel} px
     * 
     * @returns The the new px position of the popup on the screen
     *           relative to the passed-in px
     * @type OpenLayers.Pixel
     */
    calculateNewPx:function(px) {

        var newPx = px.copyOf();

        var top = (this.relativePosition.charAt(0) == 't');
        newPx.y += (top) ? -this.size.h : this.anchorSize.h;
        
        var left = (this.relativePosition.charAt(1) == 'l');
        newPx.x += (left) ? -this.size.w : this.anchorSize.w;

        return newPx;   
    },

    /**
     * @private 
     * 
     * @param {String} quadrant 
     * 
     * @returns The opposing quadrant ("br" "tr" "tl" "bl"). For Example, if 
     *           you pass in "bl" it returns "tr", if you pass in "br" it 
     *           returns "tl", etc.
     * @type String
     */
    oppositeQuadrant: function(quadrant) {
        var opp = "";
        
        opp += (quadrant.charAt(0) == 't') ? 'b' : 't';
        opp += (quadrant.charAt(1) == 'l') ? 'r' : 'l';
        
        return opp;
    },

    CLASS_NAME: "OpenLayers.Popup.Anchored"
});
