OpenLayers.Layer.WFS = Class.create();
OpenLayers.Layer.WFS.prototype = 
  Object.extend( new OpenLayers.Layer.Grid(), {

    // hash
    DEFAULT_PARAMS: {
        service: "WFS",
        version: "1.0.0",
        request: "GetFeature",
    },

    /**
    * @param {str} name
    * @param {str} url
    * @param {hash} params
    */
    initialize: function(name, url, params) {
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, arguments);
        OpenLayers.Util.applyDefaults( this.params, this.DEFAULT_PARAMS );
    },    
    
    /**
    * @param
    */
    clone: function (name, params) {
        var mergedParams = {}
        Object.extend(mergedParams, this.params);
        Object.extend(mergedParams, params);
        var obj = new OpenLayers.Layer.WFS(name, this.url, mergedParams);
        obj.setTileSize( this.tileSize );
        return obj;
    },

    /**
    * addTile creates a tile, initializes it (via 'draw' in this case), and 
    * adds it to the layer div. THe tile itself is then returned so that info
    * about it can be stored for later reuse.
    * @param {OpenLayers.Bounds} bounds
    */
    addTile:function(bounds,position) {
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

    _initTiles: function () {
        this.div.innerHTML="";
        OpenLayers.Layer.Grid.prototype._initTiles.apply(this, arguments);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WFS"
});
