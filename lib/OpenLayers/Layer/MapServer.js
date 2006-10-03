/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Layer/Grid.js
/**
* @class
*/
OpenLayers.Layer.MapServer = Class.create();
OpenLayers.Layer.MapServer.prototype =
  Object.extend( new OpenLayers.Layer.Grid(), {

    /** @final @type hash */
    DEFAULT_PARAMS: {
                      mode: "map",
                      map_imagetype: "png",
                     },

    /**
    * @constructor
    *
    * @param {str} name
    * @param {str} url
    * @param {hash} params
    */
    initialize: function(name, url, params) {
        var newArguments = new Array();
        if (arguments.length > 0) {
            //uppercase params
            params = OpenLayers.Util.upperCaseObject(params);
            newArguments.push(name, url, params);
        }
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);

        if (arguments.length > 0) {
            OpenLayers.Util.applyDefaults(
                           this.params,
                           OpenLayers.Util.upperCaseObject(this.DEFAULT_PARAMS)
                           );
        }
    },


    /** 
     * @type Boolean
     */
    isBaseLayer: function() {
        return (this.params.TRANSPARENT != 'true');
    },

    /**
    * @param {String} name
    * @param {hash} params
    *
    * @returns A clone of this OpenLayers.Layer.MapServer, with the passed-in
    *          parameters merged in.
    * @type OpenLayers.Layer.MapServer
    */
    clone: function (name, params) {
        var mergedParams = {};
        Object.extend(mergedParams, this.params);
        Object.extend(mergedParams, params);
        var obj = new OpenLayers.Layer.MapServer(name, this.url, mergedParams);
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
        var url = this.getURL(bounds);
        return new OpenLayers.Tile.Image(this, position, bounds, url, this.tileSize);
    },
        
    /**
     * @param {OpenLayers.Bounds} bounds
     * 
     * @returns A string with the layer's url and parameters and also the 
     *           passed-in bounds and appropriate tile size specified as 
     *           parameters
     * @type String
     */
    getURL: function (bounds) {

        var url = this.getFullRequestString(
                     {mapext:bounds.toBBOX().replace(/,/g,"+"),
                      imgext:bounds.toBBOX().replace(/,/g,"+"),
                      map_size:this.tileSize.w+'+'+this.tileSize.h,
                      imgx: this.tileSize.w/2,
                      imgy: this.tileSize.h/2,
                      imgxy: this.tileSize.w+"+"+this.tileSize.h
                      });
        return url;
    },
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.MapServer"
});
