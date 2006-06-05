// @require: OpenLayers/Tile.js
/**
* @class
*/
OpenLayers.Tile.Image = Class.create();
OpenLayers.Tile.Image.prototype = 
  Object.extend( new OpenLayers.Tile(), {
    
    /** @type DOMElement img */
    img:null,

    /** 
    * @constructor
    *
    * @param {OpenLayers.Grid} layer
    * @param {OpenLayers.Pixel} position
    * @param {OpenLayers.Bounds} bounds
    * @param {String} url
    * @param {OpenLayers.Size} size
    */
    initialize: function(layer, position, bounds, url, size) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);
    },

    destroy: function() {
        if ((this.img != null) && (this.img.parentNode == this.layer.div)) {
            this.layer.div.removeChild(this.img);
        }
        this.img = null;
    },

    /**
    */
    draw:function() {
        this.img = OpenLayers.Util.createImage(null,
                                               this.position,
                                               this.size,
                                               this.url,
                                               "absolute");
        this.layer.div.appendChild(this.img);
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.Image"
  }
);
