OpenLayers.Layer.WMS = Class.create();
OpenLayers.Layer.WMS.prototype = 
  Object.extend( new OpenLayers.Layer.Grid(), {

    // hash
    DEFAULT_PARAMS: {
        service: "WMS",
        version: "1.1.1",
        request: "GetMap",
        srs: "EPSG:4326",
        exceptions: "application/vnd.ogc.se_inimage"
    },

    /**
    * @param {str} name
    * @param {str} url
    * @param {hash} params
    */
    initialize: function(name, url, params) {
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, arguments);
        Object.extend(this.params, this.DEFAULT_PARAMS);
    },    
    
    /**
    * @param
    */
    clone: function (name, params) {
        var mergedParams = {}
        Object.extend(mergedParams, this.params);
        Object.extend(mergedParams, params);
        var obj = new OpenLayers.Layer.WMS(name, this.url, mergedParams);
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
    }
});
