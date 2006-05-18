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
    * @param {OpenLayers.Bounds} bounds
    * @param {String} url
    * @param {OpenLayers.Size} size
    */
    initialize: function(bounds,url,size) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);
    },

    /**
    */
    draw:function() {
        OpenLayers.Tile.prototype.draw.apply(this, arguments);
        this.img = OpenLayers.Util.createImage(this.url,
                                               this.size,
                                               null,
                                               "absolute");
    },

    /**
     * @param OpenLayers.Pixel
     */
    setPosition:function(pixel) {
        if (this.img) {
            this.img.style.top = pixel.y + "px";
            this.img.style.left = pixel.x + "px";
            this.position = pixel;
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.Image"
  }
);
