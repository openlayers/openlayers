/**
* @class
*/
OpenLayers.Tile.WFS = Class.create();
OpenLayers.Tile.WFS.prototype = 
  Object.extend( new OpenLayers.Tile(), {

    /** 
    * @constructor
    *
    * @param {OpenLayers.Bounds} bounds
    * @param {String} url
    * @param {OpenLayers.Size} size
    */
    initialize: function(bounds, url, size) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);
    },

    /**
    */
    draw:function() {
        OpenLayers.Tile.prototype.draw.apply(this, arguments);
    },

    /**
     * @param OpenLayers.Pixel
     */
    setPosition:function(pixel) {
        this.position = pixel;
    },

    /**
    * @type OpenLayers.Pixel
    */
    getPosition: function() {
        return this.position;
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Tile.WFS"
  }
);
