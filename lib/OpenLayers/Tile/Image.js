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
                                               this.size);
    },

    /**
     * @param OpenLayers.Pixel
     */
    setPosition:function(point) {
        if (this.img) {
            this.img.style.top = point.y + "px";
            this.img.style.left = point.x + "px";
            this.img.style.position = "absolute";
            this.position = point;
        }
    },

    /**
    * @type OpenLayers.Pixel
    */
    getPosition: function() {
        return this.position;
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.Image"
  }
);
