/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Layer.js
// @require: OpenLayers/Util.js

/**
 * @class
 */
OpenLayers.Layer.Grid = Class.create();
OpenLayers.Layer.Grid.prototype = 
  Object.extend( new OpenLayers.Layer.HTTPRequest(), {
    
    /** @type OpenLayers.Size */
    tileSize: null,
    
    /** this is an array of rows, each row is an array of tiles
     * 
     * @type Array(Array) */
    grid: null,

    /** asserts whether or not the layer's images have an alpha channel 
     * 
     * @type boolean */
    alpha: false,

    /**
     * @constructor
     * 
     * @param {String} name
     * @param {String} url
     * @param {Object} params
     * @param {Object} options Hash of extra options to tag onto the layer
    */
    initialize: function(name, url, params, options) {
        OpenLayers.Layer.HTTPRequest.prototype.initialize.apply(this, 
                                                                arguments);
    },

    /** on destroy, clear the grid.
     * 
     */
    destroy: function() {
        this.clearGrid();
        this.grid = null;
        OpenLayers.Layer.HTTPRequest.prototype.destroy.apply(this, arguments); 
    },

    /** When the layer is added to a map, then we can ask the map for
     *   its default tile size
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Layer.HTTPRequest.prototype.setMap.apply(this, arguments);
        if (this.tileSize == null) {
            this.tileSize = this.map.getTileSize();
        }
    },

    /**
     * @deprecated User should just set the 'tileSize' via options
     * 
     * @param {OpenLayers.Size} size
     */
    setTileSize: function (size) {
        if (size) {
            this.tileSize = size.copyOf();
        }
    },

    /** This function is called whenever the map is moved. All the moving
     * of actual 'tiles' is done by the map, but moveTo's role is to accept
     * a bounds and make sure the data that that bounds requires is pre-loaded.
     * 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     */
    moveTo:function(bounds, zoomChanged) {
        if (!this.getVisibility()) {
            if (zoomChanged) {
                this.grid = null;
            }
            return;
        }
        if (!this.grid || zoomChanged) {
            this._initTiles();
        } else { 
            var i = 0;
            while (this.getGridBounds().bottom > bounds.bottom) {
               this.insertRow(false); 
            }
            while (this.getGridBounds().left > bounds.left) {
               this.insertColumn(true); 
            }
            while (this.getGridBounds().top < bounds.top) {
               this.insertRow(true); 
            }
            while (this.getGridBounds().right < bounds.right) {
               this.insertColumn(false); 
            }
        }
    },
    
    /**
     * @returns A Bounds object representing the bounds of all the currently 
     *           loaded tiles (including those partially or not at all seen 
     *           onscreen)
     * @type OpenLayers.Bounds
     */
    getGridBounds:function() {
        
        var topLeftTile = this.grid[0][0];

        var bottom = this.grid.length - 1;
        var right = this.grid[0].length - 1; 
        var bottomRightTile = this.grid[bottom][right];

        return new OpenLayers.Bounds(topLeftTile.bounds.left, 
                                     bottomRightTile.bounds.bottom,
                                     bottomRightTile.bounds.right, 
                                     topLeftTile.bounds.top);
    },
    
    /**
     * 
     */
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
        var tilelon = resolution * this.tileSize.w;
        var tilelat = resolution * this.tileSize.h;
        
        var offsetlon = bounds.left - extent.left;
        var tilecol = Math.floor(offsetlon/tilelon);
        var tilecolremain = offsetlon/tilelon - tilecol;
        var tileoffsetx = -tilecolremain * this.tileSize.w;
        var tileoffsetlon = extent.left + tilecol * tilelon;
        
        var offsetlat = bounds.top - (extent.bottom + tilelat);  
        var tilerow = Math.ceil(offsetlat/tilelat);
        var tilerowremain = tilerow - offsetlat/tilelat;
        var tileoffsety = -tilerowremain * this.tileSize.h;
        var tileoffsetlat = extent.bottom + tilerow * tilelat;
        
        tileoffsetx = Math.round(tileoffsetx); // heaven help us
        tileoffsety = Math.round(tileoffsety);

        this.origin = new OpenLayers.Pixel(tileoffsetx, tileoffsety);

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
                                                      tileoffsetlon + tilelon,
                                                      tileoffsetlat + tilelat);

                var x = tileoffsetx;
                x -= parseInt(this.map.layerContainerDiv.style.left);

                var y = tileoffsety;
                y -= parseInt(this.map.layerContainerDiv.style.top);

                var px = new OpenLayers.Pixel(x, y);
                
                var tile = this.addTile(tileBounds, px);

                tile.draw(this.alpha);
                row.append(tile);
     
                tileoffsetlon += tilelon;       
                tileoffsetx += this.tileSize.w;
            } while (tileoffsetlon < bounds.right)  
            
            tileoffsetlat -= tilelat;
            tileoffsety += this.tileSize.h;
        } while(tileoffsetlat > bounds.bottom - tilelat)

    },
    
    /**
     * @param {Boolean} prepend if true, prepend to beginning.
     *                          if false, then append to end
     */
    insertRow:function(prepend) {
        var modelRowIndex = (prepend) ? 0 : (this.grid.length - 1);
        var modelRow = this.grid[modelRowIndex];

        var newRow = new Array();

        var resolution = this.map.getResolution();
        var deltaY = (prepend) ? -this.tileSize.h : this.tileSize.h;
        var deltaLat = resolution * -deltaY;

        for (var i=0; i < modelRow.length; i++) {
            var modelTile = modelRow[i];
            var bounds = modelTile.bounds.copyOf();
            var position = modelTile.position.copyOf();
            bounds.bottom = bounds.bottom + deltaLat;
            bounds.top = bounds.top + deltaLat;
            position.y = position.y + deltaY;
            var newTile = this.addTile(bounds, position);
            newTile.draw(this.alpha);
            newRow.append(newTile);
        }
        
        if (newRow.length>0){
            if (prepend) {
                this.grid.prepend(newRow);
            } else {
                this.grid.append(newRow);
            }
        }       
    },

    /**
     * @param {Boolean} prepend if true, prepend to beginning.
     *                          if false, then append to end
     */
    insertColumn:function(prepend) {
        var modelCellIndex;
        var deltaX = (prepend) ? -this.tileSize.w : this.tileSize.w;
        var resolution = this.map.getResolution();
        var deltaLon = resolution * deltaX;

        for (var i=0; i<this.grid.length; i++) {
            var row = this.grid[i];
            modelTileIndex = (prepend) ? 0 : (row.length - 1);
            var modelTile = row[modelTileIndex];
            
            var bounds = modelTile.bounds.copyOf();
            var position = modelTile.position.copyOf();
            bounds.left = bounds.left + deltaLon;
            bounds.right = bounds.right + deltaLon;
            position.x = position.x + deltaX;
            var newTile = this.addTile(bounds, position);
            newTile.draw(this.alpha);
            
            if (prepend) {
                row = row.prepend(newTile);
            } else {
                row = row.append(newTile);
            }
        }
    },

    /** go through and remove all tiles from the grid, calling
     *    destroy() on each of them to kill circular references
     * 
     * @private
     */
    clearGrid:function() {
        if (this.grid) {
            while(this.grid.length > 0) {
                var row = this.grid[0];
                while(row.length > 0) {
                    var tile = row[0];
                    tile.destroy();
                    row.remove(tile);
                }
                this.grid.remove(row);                   
            }
        }
    },

    /**
     * addTile gives subclasses of Grid the opportunity to create an 
     * OpenLayer.Tile of their choosing. The implementer should initialize 
     * the new tile and take whatever steps necessary to display it.
     *
     * @param {OpenLayers.Bounds} bounds
     *
     * @returns The added OpenLayers.Tile
     * @type OpenLayers.Tile
     */
    addTile:function(bounds, position) {
        // Should be implemented by subclasses
    },

    
    /** 
     * @returns Degrees per Pixel
     * @type float
     */
    getResolution: function() {
        var maxRes = this.map.getMaxResolution();
        var zoom = this.map.getZoom();

        return maxRes / Math.pow(2, zoom);
    },
    
    /**
     * @param {OpenLayers.Bounds} bounds
     *
     * @return {int}
     */
    getZoomForExtent: function (bounds) {

        var maxRes = this.map.getMaxResolution();
        var viewSize = this.map.getSize();

        var width = bounds.getWidth();
        var height = bounds.getHeight();

        var degPerPixel = (width > height) ? width / viewSize.w 
                                           : height / viewSize.h;
        
        var zoom = Math.floor( (Math.log(maxRes/degPerPixel)) / Math.log(2) );

        var maxZoomLevel = this.map.getMaxZoomLevel();
        var minZoomLevel = this.map.getMinZoomLevel();
    
        //make sure zoom is within bounds    
        zoom = Math.min( Math.max(zoom, minZoomLevel), 
                         maxZoomLevel );

        return zoom;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Grid"
});
