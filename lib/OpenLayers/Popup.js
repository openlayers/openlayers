// @require: OpenLayers/Util.js

/**
* @class
*/
OpenLayers.Popup = Class.create();

OpenLayers.Popup.count = 0;
OpenLayers.Popup.SIZE = new OpenLayers.Size(200, 200);
OpenLayers.Popup.COLOR = "white";
OpenLayers.Popup.OPACITY = 1;
OpenLayers.Popup.BORDER = "0px";

OpenLayers.Popup.prototype = {

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


    /** 
    * @constructor
    * 
    * @param {String} id
    * @param {OpenLayers.LonLat} lonlat
    * @param {OpenLayers.Size} size
    * @param {String} contentHTML
    */
    initialize:function(id, lonlat, size, contentHTML) {
        OpenLayers.Popup.count += 1;
        this.id = (id != null) ? id : "Popup" + OpenLayers.Popup.count;
        this.lonlat = lonlat;
        this.size = (size != null) ? size : OpenLayers.Popup.SIZE;
        if (contentHTML != null) { 
             this.contentHTML = contentHTML;
        }
        this.backgroundColor = OpenLayers.Popup.COLOR;
        this.opacity = OpenLayers.Popup.OPACITY;
        this.border = OpenLayers.Popup.BORDER;
    },

    /** 
    */
    destroy: function() {
        if ((this.div) && (this.div.parentNode)) {
            this.div.parentNode.removeChild(this.div);
        }
        this.div = null;
    },

    /** 
    * @param {OpenLayers.Pixel} px
    */
    draw: function(px) {
        if (this.div == null) {
            this.div = OpenLayers.Util.createDiv(this.id + "_div",
                                                  null,
                                                  null,
                                                  "hidden");
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
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function(px) {
        if ((px != null) && (this.div != null)) {
            this.div.style.left = px.x + "px";
            this.div.style.top = px.y + "px";
        }
    },

    /**
    * @param {OpenLayers.Size} size
    */
    setSize:function(size) { 
        if (size != undefined) {
            this.size = size; 
        }
        
        if (this.div != null) {
    		this.div.style.width = this.size.w;
    		this.div.style.height = this.size.h;
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
