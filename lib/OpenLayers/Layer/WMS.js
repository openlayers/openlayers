/**
* @class
*/
OpenLayers.Layer.WMS = Class.create();
OpenLayers.Layer.WMS.prototype = 
  Object.extend( new OpenLayers.Layer.Grid(), {

    /** @final @type hash */
    DEFAULT_PARAMS: { service: "WMS",
                      version: "1.1.1",
                      request: "GetMap",
                      srs: "EPSG:4326",
                      styles: "",
                      exceptions: "application/vnd.ogc.se_inimage",
                      format: "image/jpeg"
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
        var mergedParams = {};
        Object.extend(mergedParams, this.params);
        Object.extend(mergedParams, params);
        var obj = new OpenLayers.Layer.WMS(name, this.url, mergedParams);
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

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WMS"
});
