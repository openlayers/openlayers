/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Layer.js
// @require: OpenLayers/Util.js
OpenLayers.Layer.Grid = Class.create();
OpenLayers.Layer.Grid.prototype = Object.extend( new OpenLayers.Layer(), {
    
    // str: url
    url: null,

    // hash: params
    params: null,

    // tileSize: OpenLayers.Size
    tileSize: null,
    
    // grid: Array(Array())
    // this is an array of rows, each row is an array of tiles
    grid: null,

    /**
    * @param {str} name
    * @param {str} url
    * @param {hash} params
    * @param {Object} options Hash of extra options to tag onto the layer
    */
    initialize: function(name, url, params, options) {
        var newArguments = arguments;
        if (arguments.length > 0) {
            newArguments = [name, options];
        }          
        OpenLayers.Layer.prototype.initialize.apply(this, newArguments);
        this.url = url;
        this.params = params;
    },

    /**
     * 
     */
    destroy: function() {
        this.params = null;
        this.clearGrid();
        this.grid = null;
        OpenLayers.Layer.prototype.destroy.apply(this, arguments); 
    },

    /** When the layer is added to a map, then we can ask the map for
     *   its default tile size
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);
        if (this.tileSize == null) {
            this.tileSize = this.map.getTileSize();
        }
    },

    /**
     * @deprecated User should just set the 'tileSize' via options
     */
    setTileSize: function (size) {
        this.tileSize = size.copyOf();
    },

    /** This function is called whenever the map is moved. All the moving
     * of actual 'tiles' is done by the map, but moveTo's role is to accept
     * a bounds and make sure the data that that bounds requires is pre-loaded.
     * 
     * @param {OpenLayers.Bounds}
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
    
    
    getGridBounds:function() {
        var topLeftTile = this.grid[0][0];
        var bottomRightTile = this.grid[this.grid.length-1][this.grid[0].length-1];
        return new OpenLayers.Bounds(topLeftTile.bounds.left, 
                                     bottomRightTile.bounds.bottom,
                                     bottomRightTile.bounds.right, 
                                     topLeftTile.bounds.top);
    },
    
    /**
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
        var tilelon = resolution*this.tileSize.w;
        var tilelat = resolution*this.tileSize.h;
        
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
                tile.draw((this.params.TRANSPARENT == 'true'));
                row.append(tile);
     
                tileoffsetlon += tilelon;       
                tileoffsetx += this.tileSize.w;
            } while (tileoffsetlon < bounds.right)  
            
            tileoffsetlat -= tilelat;
            tileoffsety += this.tileSize.h;
        } while(tileoffsetlat > bounds.bottom - tilelat)

    },
    
    /**
    * @param {bool} prepend - if true, prepend to beginning.
    *                         if false, then append to end
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
            newTile.draw((this.params.TRANSPARENT == 'true'));
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
    * @param {bool} prepend - if true, prepend to beginning.
    *                         if false, then append to end
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
            newTile.draw((this.params.TRANSPARENT == 'true'));
            
            if (prepend) {
                row = row.prepend(newTile);
            } else {
                row = row.append(newTile);
            }
        }
    },
    /** combine the ds's serverPath with its params and the tile's params. 
    *   
    *    does checking on the serverPath variable, allowing for cases when it 
    *     is supplied with trailing ? or &, as well as cases where not. 
    *
    *    return in formatted string like this:
    *        "server?key1=value1&key2=value2&key3=value3"
    *
    * @return {str}
    */
    getFullRequestString:function(params) {
        var requestString = "";        
        this.params.SRS = this.map.getProjection();
        // concat tile params with layer params and convert to string
        var allParams = Object.extend(this.params, params);
        var paramsString = OpenLayers.Util.getParameterString(allParams);

        var server = this.url;
        var lastServerChar = server.charAt(server.length - 1);

        if ((lastServerChar == "&") || (lastServerChar == "?")) {
            requestString = server + paramsString;
        } else {
            if (server.indexOf('?') == -1) {
                //serverPath has no ? -- add one
                requestString = server + '?' + paramsString;
            } else {
                //serverPath contains ?, so must already have paramsString at the end
                requestString = server + '&' + paramsString;
            }
        }
        return requestString;
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
    addTile:function(bounds,position) {
        // Should be implemented by subclasses
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Grid"
});
