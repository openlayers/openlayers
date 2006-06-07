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
    
    /** @type OpenLayers.Layer */
    layer: null,
    
    /** @type String url of the request */
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
    * @param {OpenLayers.Layer} layer
    * @param {OpenLayers.Pixel} position
    * @param {OpenLayers.Bounds} bounds
    * @param {String} url
    * @param {OpenLayers.Size} size
    */   
    initialize: function(layer, position, bounds, url, size) {
        if (arguments.length > 0) {
            this.layer = layer;
            this.position = position;
            this.bounds = bounds;
            this.url = url;
            this.size = size;
        }
    },
    
    /** nullify references to prevent circular references and memory leaks
    */
    destroy:function() {
        this.layer  = null;
        this.bounds = null;
        this.size = null;
    },

    /**
    */
    draw:function() {

    // HACK HACK - should we make it a standard to put this sort of warning
    //             message in functions that are supposed to be overridden?
    //
    //        Log.warn(this.CLASS_NAME + ": draw() not implemented");

    },

    /** remove this tile from the ds
    */
    remove:function() {
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

