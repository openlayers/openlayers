/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 */
OpenLayers.Popup = Class.create();

OpenLayers.Popup.WIDTH = 200;
OpenLayers.Popup.HEIGHT = 200;
OpenLayers.Popup.COLOR = "white";
OpenLayers.Popup.OPACITY = 1;
OpenLayers.Popup.BORDER = "0px";

OpenLayers.Popup.prototype = {

    /** @type OpenLayers.Events*/
    events: null,
    
    /** @type String */
    id: "",

    /** @type OpenLayers.LonLat */
    lonlat: null,

    /** @type DOMElement */
    div: null,

    /** @type OpenLayers.Size*/
    size: null,    

    /** @type String */
    contentHTML: "",
    
    /** @type String */
    backgroundColor: "",
    
    /** @type float */
    opacity: "",

    /** @type String */
    border: "",

    /** this gets set in Map.js when the popup is added to the map
     * @type OpenLayers.Map */
    map: null,

    /** 
    * @constructor
    * 
    * @param {String} id
    * @param {OpenLayers.LonLat} lonlat
    * @param {OpenLayers.Size} size
    * @param {String} contentHTML
    */
    initialize:function(id, lonlat, size, contentHTML) {
        if (id == null) {
            id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
        }

        this.id = id;
        this.lonlat = lonlat;
        this.size = (size != null) ? size 
                                  : new OpenLayers.Size(
                                                   OpenLayers.Popup.WIDTH,
                                                   OpenLayers.Popup.HEIGHT);
        if (contentHTML != null) { 
             this.contentHTML = contentHTML;
        }
        this.backgroundColor = OpenLayers.Popup.COLOR;
        this.opacity = OpenLayers.Popup.OPACITY;
        this.border = OpenLayers.Popup.BORDER;

        this.div = OpenLayers.Util.createDiv(this.id, null, null, 
                                             null, null, null, "hidden");

        this.events = new OpenLayers.Events(this, this.div, null);
    },

    /** 
    */
    destroy: function() {
        if (this.map != null) {
            this.map.removePopup(this);
        }
        this.div = null;
        this.map = null;
    },

    /** 
    * @param {OpenLayers.Pixel} px
    * 
    * @returns Reference to a div that contains the drawn popup
    * @type DOMElement
    */
    draw: function(px) {
        if (px == null) {
            if ((this.lonlat != null) && (this.map != null)) {
                px = this.map.getLayerPxFromLonLat(this.lonlat);
            }
        }
        
        this.setSize();
        this.setBackgroundColor();
        this.setOpacity();
        this.setBorder();
        this.setContentHTML();
        this.moveTo(px);

        return this.div;
    },

    /** 
     * if the popup has a lonlat and its map members set, 
     *  then have it move itself to its proper position
     */
    updatePosition: function() {
        if ((this.lonlat) && (this.map)) {
                var px = this.map.getLayerPxFromLonLat(this.lonlat);
                this.moveTo(px);            
        }
    },

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function(px) {
        if ((px != null) && (this.div != null)) {
            this.div.style.left = px.x + "px";
            this.div.style.top = px.y + "px";
        }
    },

    /**
     * @returns Boolean indicating whether or not the popup is visible
     * @type Boolean
     */
    visible: function() {
        return Element.visible(this.div);
    },

    /**
     * 
     */
    toggle: function() {
        Element.toggle(this.div);
    },

    /**
     *
     */
    show: function() {
        Element.show(this.div);
    },

    /**
     *
     */
    hide: function() {
        Element.hide(this.div);
    },

    /**
    * @param {OpenLayers.Size} size
    */
    setSize:function(size) { 
        if (size != undefined) {
            this.size = size; 
        }
        
        if (this.div != null) {
            this.div.style.width = this.size.w + "px";
            this.div.style.height = this.size.h + "px";
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
            this.div.style.backgroundColor = this.backgroundColor;
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
            // for Mozilla and Safari
            this.div.style.opacity = this.opacity;

            // for IE
            this.div.style.filter = 'alpha(opacity=' + this.opacity*100 + ')';
        }
    },  
    
    /**
    * @param {int} border
    */
    setBorder:function(border) { 
        if (border != undefined) {
            this.border = border;
        }
        
        if (this.div != null) {
            this.div.style.border = this.border;
        }
    },      
    
    /**
    * @param {String} contentHTML
    */
    setContentHTML:function(contentHTML) {
        if (contentHTML != null) {
            this.contentHTML = contentHTML;
        }
        
        if (this.div != null) {
            this.div.innerHTML = this.contentHTML;
        }    
    },

    CLASS_NAME: "OpenLayers.Popup"
};
