/**
* @class
*/
OpenLayers.Layer.WFS = Class.create();
OpenLayers.Layer.WFS.prototype = 
  Object.extend( new OpenLayers.Layer.Grid(), {

    /** @final @type hash */
    DEFAULT_PARAMS: { service: "WFS",
                      version: "1.0.0",
                      request: "GetFeature",
                      typename: "docpoint"
                    },

    /**
    * @constructor
    *
    * @param {str} name
    * @param {str} url
    * @param {hash} params
    */
    initialize: function(name, url, params) {
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, arguments);
        OpenLayers.Util.applyDefaults(this.params, this.DEFAULT_PARAMS);
    },    
    
    /**
    * @param {String} name
    * @param {hash} params
    *
    * @returns A clone of this OpenLayers.Layer.WMS, with the passed-in
    *          parameters merged in.
    * @type OpenLayers.Layer.WMS
    */
    clone: function (name, params) {
        var mergedParams = {}
        Object.extend(mergedParams, this.params);
        Object.extend(mergedParams, params);
        var obj = new OpenLayers.Layer.WFS(name, this.url, mergedParams);
        obj.setTileSize(this.tileSize);
        return obj;
    },

    /**
    * addTile creates a tile, initializes it (via 'draw' in this case), and 
    * adds it to the layer div. 
    *
    * @param {OpenLayers.Bounds} bounds
    *
    * @returns The added OpenLayers.Tile.Image
    * @type OpenLayers.Tile.Image
    */
    addTile:function(bounds, position) {
        url = this.getFullRequestString(
                     {bbox:bounds.toBBOX(),
                      width:this.tileSize.w,
                      height:this.tileSize.h});
        var tile = new OpenLayers.Tile.Image(bounds, url, this.tileSize);
        tile.draw();
        tile.setPosition(position);
        this.div.appendChild(tile.img);
        return tile;
    },

    /** clear out the layer's main div
    */
    _initTiles: function() {
        this.div.innerHTML="";
        OpenLayers.Layer.Grid.prototype._initTiles.apply(this, arguments);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WFS"
});
