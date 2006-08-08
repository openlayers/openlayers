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
    scales: {inches: 1, feet: 12, miles: 63360.0, meters: 39.3701, kilometers: 39370.1, degrees: 4374754},


    resolution: 72,
    
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
    addTile:function(bounds,position) {
        var zoom = this.map.getZoom();
        var maxRes = this.map.maxResolution;
        var mapRes = this.map.getResolution();
        var scale = Math.round( (((this.tileSize.w * this.map.maxResolution * this.resolution) * (this.scales[this.units])) / this.tileSize.w) / Math.pow(2, zoom) * 10000 ) / 10000;
        
        var cellSize = new OpenLayers.Size(mapRes*this.tileSize.w, mapRes*this.tileSize.h);
        var pX = Math.round(((bounds.left) / cellSize.w) * this.tileSize.w);
        var pY = -Math.round(((bounds.top) / cellSize.h) * this.tileSize.h);
        var url = this.getFullRequestString(
                      { t: pY, 
                        l: pX,
                        s: scale
                      });
        return new OpenLayers.Tile.Image(this, position, bounds, 
                                             url, this.tileSize);
    },
    _initTiles:function() {

        //first of all, clear out the main div
        this.div.innerHTML = "";

        //now clear out the old grid and start a new one
        this.clearGrid();
        this.grid = new Array();

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
        
        do {
            var row = new Array();
            this.grid.append(row);
            tileoffsetlon = startLon;
            tileoffsetx = startX;
            do {
                var tileBounds = new OpenLayers.Bounds(tileoffsetlon, 
                                                       tileoffsetlat, 
                                                       tileoffsetlon+tilelon,
                                                       tileoffsetlat+tilelat);

                var tile = this.addTile(tileBounds, 
                                        new OpenLayers.Pixel(tileoffsetx - parseInt(this.map.layerContainerDiv.style.left),
                                                             tileoffsety - parseInt(this.map.layerContainerDiv.style.top))
                                                            );
                tile.draw((this.alpha));
                row.append(tile);
     
                tileoffsetlon += tilelon;       
                tileoffsetx += this.tileSize.w;
            } while (tileoffsetlon < bounds.right)  
            
            tileoffsetlat -= tilelat;
            tileoffsety += this.tileSize.h;
        } while(tileoffsetlat > bounds.bottom - tilelat)

    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.KaMap"
});
