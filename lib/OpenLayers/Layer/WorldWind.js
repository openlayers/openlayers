/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Layer/Grid.js
 */
OpenLayers.Layer.WorldWind = Class.create();
OpenLayers.Layer.WorldWind.prototype = 
  Object.extend( new OpenLayers.Layer.Grid(), {
    
    DEFAULT_PARAMS: {
    },

    /** WorldWind layer is always a base layer
     * 
     * @type Boolean
     */
    isBaseLayer: true,    

    // LevelZeroTileSizeDegrees
    lzd: null,

    zoomLevels: null,
        
    initialize: function(name, url, lzd, zoomLevels, params, options) {
        this.lzd = lzd;
        this.zoomLevels = zoomLevels;
        var newArguments = new Array();
        newArguments.push(name, url, params, options);
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);
        this.params = (params ? params : {});
        if (arguments.length > 0 && params) {
            OpenLayers.Util.applyDefaults(
                           this.params, 
                           this.DEFAULT_PARAMS
                           );
        }
    },
    addTile:function(bounds,position) {
        if (this.map.getResolution() <= (this.lzd/512)
            && this.getZoom() <= this.zoomLevels) {

            return new OpenLayers.Tile.Image(this, position, bounds, 
                                             url, this.tileSize);
        } else {
            var tile = new Object();
            tile.draw = function() {};
            tile.destroy = function() {};
            tile.bounds = bounds;
            tile.bounds = position;
            return tile;
        }
    },

    getZoom: function () {
        var zoom = this.map.getZoom();
        var extent = this.map.getMaxExtent();
        zoom = zoom - Math.log(this.maxResolution / (this.lzd/512))/Math.log(2);
        return zoom;
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
        var zoom = this.getZoom();
        var extent = this.map.getMaxExtent();
        var deg = this.lzd/Math.pow(2,this.getZoom());
        var x = Math.floor((bounds.left - extent.left)/deg);
        var y = Math.floor((bounds.bottom - extent.bottom)/deg);
        return this.getFullRequestString(
              { L: zoom, 
                X: x,
                Y: y
              });

    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WorldWind"
});
