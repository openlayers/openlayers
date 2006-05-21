/**
* @class
*/
OpenLayers.Popup = Class.create();
OpenLayers.Popup.prototype = {

    /** @type String */
    id: "",

    /** @type DOMElement */
    div: null,

    /** @type OpenLayers.Pixel */
    px: null,    

    /** @type OpenLayers.Size*/
    size: null,    

    /** 
    * @constructor
    * 
    * @param {String} id
    * @param {OpenLayers.Pixel} px
    * @param {OpenLayers.Size} size
    */
    initialize:function(id, px, size) {
        this.id = id;
        this.px = px;
        this.size = size;
    },

    /** 
    */
    destroy: function() {
    
    },

    /** 
    */
    draw: function() {
        if (this.div == null) {
            this.div = OpenLayers.Util.createDiv(this.id + "_div",
                                                 this.px,
                                                 this.size
                                                 );
                                                 
            this.div.style.backgroundColor = "red";
        }
        return this.div;
    },    
    
    
    
    CLASS_NAME: "OpenLayers.Popup"
};