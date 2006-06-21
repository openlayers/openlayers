/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Layer/Grid.js
/**
* @class
*/
OpenLayers.Layer.KaMap = Class.create();
OpenLayers.Layer.KaMap.prototype = 
  Object.extend( new OpenLayers.Layer.Grid(), {
    metaTileHeight: 6,
    metaTileWidth: 6,
    
    DEFAULT_PARAMS: {
        i: 'jpeg',
        map: '',
    },
        
    // this.cellSize = newScale/(oMap.resolution * inchesPerUnit[oMap.units]);
    // kaMap.prototype.geoToPix = function( gX, gY ) { var pX = gX / this.cellSize; var pY = -1 * gY / this.cellSize; }
    initialize: function(name, url, params) {
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
        var resolution = this.map.getResolution();
        var scale = 128000000 / Math.pow(2, zoom);
        // 1280000 is an empirical value for a specific tile server, not yet figured out the right way to do this in general.
        // This will probably be based on map.maxResolution.
        var cellSize = new OpenLayers.Size(resolution*this.tileSize.w, resolution*this.tileSize.h);
        var pX = Math.floor(bounds.left / cellSize.w) * this.tileSize.w;
        var pY = -Math.floor(bounds.top / cellSize.h) * this.tileSize.h;
        var url = this.getFullRequestString(
                      { t: pY, 
                        l: pX,
                        s: scale,
                      });
        return new OpenLayers.Tile.Image(this, position, bounds, 
                                             url, this.tileSize);
    },
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.KaMap"
});
