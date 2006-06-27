/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Layer/Grid.js
/**
* @class
*/
OpenLayers.Layer.WorldWind = Class.create();
OpenLayers.Layer.WorldWind.prototype = 
  Object.extend( new OpenLayers.Layer.Grid(), {
    
    DEFAULT_PARAMS: {
    },

    // LevelZeroTileSizeDegrees
    lzd: null,

    zoomLevels: null,
        
    initialize: function(name, url, lzd, zoomLevels, params) {
        this.lzd = lzd;
        this.zoomLevels = zoomLevels;
        var newArguments = new Array();
        newArguments.push(name, url, params);
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
        var zoom = this.map.getZoom();
        var extent = this.map.getMaxExtent();
        zoom = zoom - Math.log(this.map.maxResolution / (this.lzd/512))/Math.log(2);
        if (this.map.getResolution() <= (this.lzd/512) && zoom <= this.zoomLevels) {
            var deg = this.lzd/Math.pow(2,zoom);
            var x = Math.floor((bounds.left - extent.left)/deg);
            var y = Math.floor((bounds.bottom - extent.bottom)/deg);
            var url = this.getFullRequestString(
                          { L: zoom, 
                            X: x,
                            Y: y
                          });
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
    isBaseLayer: function() {
        return true;
    },    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WorldWind"
});
