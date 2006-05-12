/*
 * OpenLayers.Tile is a class designed to designate a single tile, however
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
    
    // OpenLayers.Point Bottom Left pixel of the tile
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

    /** get the full request string from the ds and the tile params 
    *     and call the AJAX loadURL(). 
    *
    *     input are function pointers for what to do on success and failure.
    * 
    * @param {function} success
    * @param {function} failure
    */
    loadFeaturesForRegion:function(success, failure) {

        if (!this.loaded) {
        
            var server = this.ds.serverPath;
            
            if (server != "") {
        
                var queryString = this.getFullRequestString();
                // TODO: Hmmm, this stops multiple loads of the data when a 
                //       result isn't immediately retrieved, but it's hacky. 
                //       Do it better.
                this.loaded = true; 
                OpenLayers.Application.loadURL(queryString, null, this, 
                                       success, failure);
            }
        }
    },


    /**
    */
    draw:function() {
    },

    /** remove this tile from the ds
    */
    remove:function() {
    },


    ////////////////////
    who:function(){return "tiled.js";} // last!
};

