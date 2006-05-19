/*
 * OpenLayers.Tile 
 *
 * @class This is a class designed to designate a single tile, however
 * it is explicitly designed to do relatively little. Tiles store information
 * about themselves -- such as the URL that they are related to, and their 
 * size - but do not add themselves to the layer div automatically, for 
 * example.
 */
OpenLayers.Tile = Class.create();
OpenLayers.Tile.prototype = {
    
    /** @type OpenLayers.Grid */
    grid: null,
    
    /** @type STring url of the request */
    url:null,

    /** @type OpenLayers.Bounds */
    bounds:null,
    
    /** @type OpenLayers.Size */
    size:null,
    
    /** Top Left pixel of the tile
    * @type OpenLayers.Pixel */
    position:null,

    /**
    * @constructor
    *
    * @param {OpenLayers.Grid} grid
    * @param {OpenLayers.Bounds} bounds
    * @param {String} url
    * @param {OpenLayers.Size} size
    */   
    initialize: function(grid, bounds, url, size) {
        if (arguments.length > 0) {
            this.grid = grid;
            this.url = url;
            this.bounds = bounds;
            this.size = size;
        }
    },

    /**
    */
    draw:function() {

    // HACK HACK - should we make it a standard to put this sort of warning
    //             message in functions that are supposed to be overridden?
    //
    //        ol.Log.warn(this.CLASS_NAME + ": draw() not implemented");

    },

    /** remove this tile from the ds
    */
    remove:function() {
    },

    /** This should be overridden by subclasses if they have special needs
    *
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
    CLASS_NAME: "OpenLayers.Tile"
};

