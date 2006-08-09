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

    /** KaMap Layer is always a base layer 
     * 
     * @type Boolean
     */    
    isBaseLayer: true,
    
    units: 'degrees',

    resolution: OpenLayers.DOTS_PER_INCH,
    
    DEFAULT_PARAMS: {
        i: 'jpeg',
        map: ''
    },
        
    // this.cellSize = newScale/(oMap.resolution * inchesPerUnit[oMap.units]);
    // kaMap.prototype.geoToPix = function( gX, gY ) { var pX = gX / this.cellSize; var pY = -1 * gY / this.cellSize; }
    initialize: function(name, url, params, units, resolution, options) {
        var newArguments = new Array();
        if (units) this.units = units;
        if (resolution) this.resolution = resolution;
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

    /**
     * @param {OpenLayers.Bounds} bounds
     * 
     * @returns A string with the layer's url and parameters and also the 
     *           passed-in bounds and appropriate tile size specified as 
     *           parameters
     * @type String
     */
    getURL: function (bounds) {
        var zoom = this.map.getZoom();
        var maxRes = this.map.maxResolution;
        var mapRes = this.map.getResolution();
        var scale = Math.round( (((this.tileSize.w * this.map.maxResolution * this.resolution) * 
                                 (OpenLayers.INCHES_PER_UNIT[this.units])) / 
                                 this.tileSize.w) 
                                 / Math.pow(2, zoom) * 10000 ) / 10000;
        
        var cellSize = new OpenLayers.Size(mapRes*this.tileSize.w, mapRes*this.tileSize.h);
        var pX = Math.round(((bounds.left) / cellSize.w) * this.tileSize.w);
        var pY = -Math.round(((bounds.top) / cellSize.h) * this.tileSize.h);
        return this.getFullRequestString(
                      { t: pY, 
                        l: pX,
                        s: scale
                      });
    },
    
    addTile:function(bounds,position) {
        var url = this.getURL(bounds);
        return new OpenLayers.Tile.Image(this, position, bounds, 
                                             url, this.tileSize);
    },
    
    _initTiles:function() {

        var viewSize = this.map.getSize();
        var bounds = this.map.getExtent();
        var extent = this.map.getMaxExtent();
        var resolution = this.map.getResolution();
        var tilelon = resolution*this.tileSize.w;
        var tilelat = resolution*this.tileSize.h;
        
        var offsetlon = bounds.left;
        var tilecol = Math.floor(offsetlon/tilelon);
        var tilecolremain = offsetlon/tilelon - tilecol;
        var tileoffsetx = -tilecolremain * this.tileSize.w;
        var tileoffsetlon = tilecol * tilelon;
        
        var offsetlat = bounds.top;  
        var tilerow = Math.ceil(offsetlat/tilelat);
        var tilerowremain = tilerow - offsetlat/tilelat;
        var tileoffsety = -(tilerowremain+1) * this.tileSize.h;
        var tileoffsetlat = tilerow * tilelat;
        
        tileoffsetx = Math.round(tileoffsetx); // heaven help us
        tileoffsety = Math.round(tileoffsety);

        this.origin = new OpenLayers.Pixel(tileoffsetx,tileoffsety);

        var startX = tileoffsetx; 
        var startLon = tileoffsetlon;
        
        var rowidx = 0;
        
        do {
            var row;
            
            row = this.grid[rowidx++];
            if (!row) {
                row = new Array();
                this.grid.push(row);
            }

            tileoffsetlon = startLon;
            tileoffsetx = startX;

            var colidx = 0;
 
            do {
                var tileBounds = new OpenLayers.Bounds(tileoffsetlon, 
                                                      tileoffsetlat, 
                                                      tileoffsetlon + tilelon,
                                                      tileoffsetlat + tilelat);

                var x = tileoffsetx;
                x -= parseInt(this.map.layerContainerDiv.style.left);

                var y = tileoffsety;
                y -= parseInt(this.map.layerContainerDiv.style.top);

                var px = new OpenLayers.Pixel(x, y);
                var tile;
                
                tile = row[colidx++];
                if (!tile) {
                    tile = this.addTile(tileBounds, px);
                    tile.draw();
                    row.push(tile);
                } else {
                    tile.moveTo(tileBounds, px);
                }
     
                tileoffsetlon += tilelon;       
                tileoffsetx += this.tileSize.w;
            } while (tileoffsetlon <= bounds.right + tilelon * this.buffer)  
            
            tileoffsetlat -= tilelat;
            tileoffsety += this.tileSize.h;
        } while(tileoffsetlat >= bounds.bottom - tilelat * this.buffer)

    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.KaMap"
});
