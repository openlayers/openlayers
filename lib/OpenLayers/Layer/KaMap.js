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
    
    units: 'degrees',
    scales: {inches: 1, feet: 12, miles: 63360.0, meters: 39.3701, kilometers: 39370.1, degrees: 4374754},


    resolution: 72,
    
    DEFAULT_PARAMS: {
        i: 'jpeg',
        map: ''
    },
        
    // this.cellSize = newScale/(oMap.resolution * inchesPerUnit[oMap.units]);
    // kaMap.prototype.geoToPix = function( gX, gY ) { var pX = gX / this.cellSize; var pY = -1 * gY / this.cellSize; }
    initialize: function(name, url, params, units, resolution) {
        var newArguments = new Array();
        if (units) this.units = units;
        if (resolution) this.resolution = resolution;
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
        var maxRes = this.map.maxResolution;
        var mapRes = this.map.getResolution();
        var scale = (((this.tileSize.w * this.map.maxResolution * this.resolution) * (this.scales[this.units])) / this.tileSize.w) / Math.pow(2, zoom);
        
        var cellSize = new OpenLayers.Size(mapRes*this.tileSize.w, mapRes*this.tileSize.h);
        var pX = Math.floor(((bounds.left) / cellSize.w) * this.tileSize.w);
        var pY = -Math.floor(((bounds.top) / cellSize.h) * this.tileSize.h);
        var url = this.getFullRequestString(
                      { t: pY, 
                        l: pX,
                        s: scale
                      });
        return new OpenLayers.Tile.Image(this, position, bounds, 
                                             url, this.tileSize);
    },
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.KaMap"
});
