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
    * @param {OpenLayers.Grid} grid
    * @param {OpenLayers.Bounds} bounds
    * @param {String} url
    * @param {OpenLayers.Size} size
    */
    initialize: function(grid, bounds, url, size) {
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
        OpenLayers.Tile.prototype.setPosition.apply(this, arguments);

        //update the image's location
        if (this.img) {
            this.img.style.top = this.position.y + "px";
            this.img.style.left = this.position.x + "px";
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.Image"
  }
);
