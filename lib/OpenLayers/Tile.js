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
    
    // str - url of the request
    url:null,

    // OpenLayers.Bounds
    bounds:null,
    
    // OpenLayers.Size
    size:null,
    
    // OpenLayers.Pixel Top Left pixel of the tile
    position:null,

    /**
    * @param {OpenLayers.Layer} layer
    * @param {OpenLayers.LatLon} coord
    */   
    initialize: function(bounds,url,size) {
        if (arguments.length > 0) {
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

    CLASS_NAME: "OpenLayers.Tile"
};

