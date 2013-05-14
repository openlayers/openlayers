/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/HTTPRequest.js
 * @requires OpenLayers/Tile/Image.js
 */

/**
 * Class: OpenLayers.Layer.Grid
 * Base class for layers that use a lattice of tiles.  Create a new grid
 * layer with the <OpenLayers.Layer.Grid> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Layer.HTTPRequest>
 */
OpenLayers.Layer.Grid = OpenLayers.Class(OpenLayers.Layer.HTTPRequest, {
    
    /**
     * APIProperty: tileSize
     * {<OpenLayers.Size>}
     */
    tileSize: null,

    /**
     * Property: tileOriginCorner
     * {String} If the <tileOrigin> property is not provided, the tile origin 
     *     will be derived from the layer's <maxExtent>.  The corner of the 
     *     <maxExtent> used is determined by this property.  Acceptable values
     *     are "tl" (top left), "tr" (top right), "bl" (bottom left), and "br"
     *     (bottom right).  Default is "bl".
     */
    tileOriginCorner: "bl",
    
    /**
     * APIProperty: tileOrigin
     * {<OpenLayers.LonLat>} Optional origin for aligning the grid of tiles.
     *     If provided, requests for tiles at all resolutions will be aligned
     *     with this location (no tiles shall overlap this location).  If
     *     not provided, the grid of tiles will be aligned with the layer's
     *     <maxExtent>.  Default is ``null``.
     */
    tileOrigin: null,
    
    /** APIProperty: tileOptions
     *  {Object} optional configuration options for <OpenLayers.Tile> instances
     *  created by this Layer, if supported by the tile class.
     */
    tileOptions: null,

    /**
     * APIProperty: tileClass
     * {<OpenLayers.Tile>} The tile class to use for this layer.
     *     Defaults is OpenLayers.Tile.Image.
     */
    tileClass: OpenLayers.Tile.Image,
    
    /**
     * Property: grid
     * {Array(Array(<OpenLayers.Tile>))} This is an array of rows, each row is 
     *     an array of tiles.
     */
    grid: null,

    /**
     * APIProperty: singleTile
     * {Boolean} Moves the layer into single-tile mode, meaning that one tile 
     *     will be loaded. The tile's size will be determined by the 'ratio'
     *     property. When the tile is dragged such that it does not cover the 
     *     entire viewport, it is reloaded.
     */
    singleTile: false,

    /** APIProperty: ratio
     *  {Float} Used only when in single-tile mode, this specifies the 
     *          ratio of the size of the single tile to the size of the map.
     *          Default value is 1.5.
     */
    ratio: 1.5,

    /**
     * APIProperty: buffer
     * {Integer} Used only when in gridded mode, this specifies the number of 
     *           extra rows and colums of tiles on each side which will
     *           surround the minimum grid tiles to cover the map.
     *           For very slow loading layers, a larger value may increase
     *           performance somewhat when dragging, but will increase bandwidth
     *           use significantly. 
     */
    buffer: 0,

    /**
     * APIProperty: transitionEffect
     * {String} The transition effect to use when the map is zoomed.
     * Two posible values:
     *
     * "resize" - Existing tiles are resized on zoom to provide a visual
     *     effect of the zoom having taken place immediately.  As the
     *     new tiles become available, they are drawn on top of the
     *     resized tiles (this is the default setting).
     * "map-resize" - Existing tiles are resized on zoom and placed below the
     *     base layer.  New tiles for the base layer will cover existing tiles.
     *     This setting is recommended when having an overlay duplicated during
     *     the transition is undesirable (e.g. street labels or big transparent
     *     fills). 
     * null - No transition effect.
     *
     * Using "resize" on non-opaque layers can cause undesired visual
     * effects.  Set transitionEffect to null in this case.
     */
    transitionEffect: "resize",

    /**
     * APIProperty: numLoadingTiles
     * {Integer} How many tiles are still loading?
     */
    numLoadingTiles: 0,

    /**
     * Property: serverResolutions
     * {Array(Number}} This property is documented in subclasses as
     *     an API property.
     */
    serverResolutions: null,

    /**
     * Property: loading
     * {Boolean} Indicates if tiles are being loaded.
     */
    loading: false,
    
    /**
     * Property: backBuffer
     * {DOMElement} The back buffer.
     */
    backBuffer: null,

    /**
     * Property: gridResolution
     * {Number} The resolution of the current grid. Used for backbuffer and
     *     client zoom. This property is updated every time the grid is
     *     initialized.
     */
    gridResolution: null,

    /**
     * Property: backBufferResolution
     * {Number} The resolution of the current back buffer. This property is
     *     updated each time a back buffer is created.
     */
    backBufferResolution: null,

    /**
     * Property: backBufferLonLat
     * {Object} The top-left corner of the current back buffer. Includes lon
     *     and lat properties. This object is updated each time a back buffer
     *     is created.
     */
    backBufferLonLat: null,

    /**
     * Property: backBufferTimerId
     * {Number} The id of the back buffer timer. This timer is used to
     *     delay the removal of the back buffer, thereby preventing
     *     flash effects caused by tile animation.
     */
    backBufferTimerId: null,

    /**
     * APIProperty: removeBackBufferDelay
     * {Number} Delay for removing the backbuffer when all tiles have finished
     *     loading. Can be set to 0 when no css opacity transitions for the
     *     olTileImage class are used. Default is 0 for <singleTile> layers,
     *     2500 for tiled layers. See <className> for more information on
     *     tile animation.
     */
    removeBackBufferDelay: null,

    /**
     * APIProperty: className
     * {String} Name of the class added to the layer div. If not set in the
     *     options passed to the constructor then className defaults to
     *     "olLayerGridSingleTile" for single tile layers (see <singleTile>),
     *     and "olLayerGrid" for non single tile layers.
     *
     * Note:
     *
     * The displaying of tiles is not animated by default for single tile
     *     layers - OpenLayers' default theme (style.css) includes this:
     * (code)
     * .olLayerGrid .olTileImage {
     *     -webkit-transition: opacity 0.2s linear;
     *     -moz-transition: opacity 0.2s linear;
     *     -o-transition: opacity 0.2s linear;
     *     transition: opacity 0.2s linear;
     *  }
     * (end)
     * To animate tile displaying for any grid layer the following
     *     CSS rule can be used:
     * (code)
     * .olTileImage {
     *     -webkit-transition: opacity 0.2s linear;
     *     -moz-transition: opacity 0.2s linear;
     *     -o-transition: opacity 0.2s linear;
     *     transition: opacity 0.2s linear;
     * }
     * (end)
     * In that case, to avoid flash effects, <removeBackBufferDelay>
     *     should not be zero.
     */
    className: null,
    
    /**
     * Register a listener for a particular event with the following syntax:
     * (code)
     * layer.events.register(type, obj, listener);
     * (end)
     *
     * Listeners will be called with a reference to an event object.  The
     *     properties of this event depends on exactly what happened.
     *
     * All event objects have at least the following properties:
     * object - {Object} A reference to layer.events.object.
     * element - {DOMElement} A reference to layer.events.element.
     *
     * Supported event types:
     * addtile - Triggered when a tile is added to this layer. Listeners receive
     *     an object as first argument, which has a tile property that
     *     references the tile that has been added.
     * tileloadstart - Triggered when a tile starts loading. Listeners receive
     *     an object as first argument, which has a tile property that
     *     references the tile that starts loading.
     * tileloaded - Triggered when each new tile is
     *     loaded, as a means of progress update to listeners.
     *     listeners can access 'numLoadingTiles' if they wish to keep
     *     track of the loading progress. Listeners are called with an object
     *     with a 'tile' property as first argument, making the loaded tile
     *     available to the listener, and an 'aborted' property, which will be
     *     true when loading was aborted and no tile data is available.
     * tileerror - Triggered before the tileloaded event (i.e. when the tile is
     *     still hidden) if a tile failed to load. Listeners receive an object
     *     as first argument, which has a tile property that references the
     *     tile that could not be loaded.
     * retile - Triggered when the layer recreates its tile grid.
     */

    /**
     * Property: gridLayout
     * {Object} Object containing properties tilelon, tilelat, startcol,
     * startrow
     */
    gridLayout: null,
    
    /**
     * Property: rowSign
     * {Number} 1 for grids starting at the top, -1 for grids starting at the
     * bottom. This is used for several grid index and offset calculations.
     */
    rowSign: null,

    /**
     * Property: transitionendEvents
     * {Array} Event names for transitionend
     */
    transitionendEvents: [
        'transitionend', 'webkitTransitionEnd', 'otransitionend',
        'oTransitionEnd'
    ],

    /**
     * Constructor: OpenLayers.Layer.Grid
     * Create a new grid layer
     *
     * Parameters:
     * name - {String}
     * url - {String}
     * params - {Object}
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, url, params, options) {
        OpenLayers.Layer.HTTPRequest.prototype.initialize.apply(this, 
                                                                arguments);
        this.grid = [];
        this._removeBackBuffer = OpenLayers.Function.bind(this.removeBackBuffer, this);

        this.initProperties();

        this.rowSign = this.tileOriginCorner.substr(0, 1) === "t" ? 1 : -1;
    },

    /**
     * Method: initProperties
     * Set any properties that depend on the value of singleTile.
     * Currently sets removeBackBufferDelay and className
     */
    initProperties: function() {
        if (this.options.removeBackBufferDelay === undefined) {
            this.removeBackBufferDelay = this.singleTile ? 0 : 2500;
        }

        if (this.options.className === undefined) {
            this.className = this.singleTile ? 'olLayerGridSingleTile' :
                                               'olLayerGrid';
        }
    },

    /**
     * Method: setMap
     *
     * Parameters:
     * map - {<OpenLayers.Map>} The map.
     */
    setMap: function(map) {
        OpenLayers.Layer.HTTPRequest.prototype.setMap.call(this, map);
        OpenLayers.Element.addClass(this.div, this.className);
    },

    /**
     * Method: removeMap
     * Called when the layer is removed from the map.
     *
     * Parameters:
     * map - {<OpenLayers.Map>} The map.
     */
    removeMap: function(map) {
        this.removeBackBuffer();
    },

    /**
     * APIMethod: destroy
     * Deconstruct the layer and clear the grid.
     */
    destroy: function() {
        this.removeBackBuffer();
        this.clearGrid();

        this.grid = null;
        this.tileSize = null;
        OpenLayers.Layer.HTTPRequest.prototype.destroy.apply(this, arguments); 
    },

    /**
     * APIMethod: mergeNewParams
     * Refetches tiles with new params merged, keeping a backbuffer. Each
     * loading new tile will have a css class of '.olTileReplacing'. If a
     * stylesheet applies a 'display: none' style to that class, any fade-in
     * transition will not apply, and backbuffers for each tile will be removed
     * as soon as the tile is loaded.
     * 
     * Parameters:
     * newParams - {Object}
     *
     * Returns:
     * redrawn: {Boolean} whether the layer was actually redrawn.
     */

    /**
     * Method: clearGrid
     * Go through and remove all tiles from the grid, calling
     *    destroy() on each of them to kill circular references
     */
    clearGrid:function() {
        if (this.grid) {
            for(var iRow=0, len=this.grid.length; iRow<len; iRow++) {
                var row = this.grid[iRow];
                for(var iCol=0, clen=row.length; iCol<clen; iCol++) {
                    var tile = row[iCol];
                    this.destroyTile(tile);
                }
            }
            this.grid = [];
            this.gridResolution = null;
            this.gridLayout = null;
        }
    },

   /**
    * APIMethod: addOptions
    * 
    * Parameters:
    * newOptions - {Object}
    * reinitialize - {Boolean} If set to true, and if resolution options of the
    *     current baseLayer were changed, the map will be recentered to make
    *     sure that it is displayed with a valid resolution, and a
    *     changebaselayer event will be triggered.
    */
    addOptions: function (newOptions, reinitialize) {
        var singleTileChanged = newOptions.singleTile !== undefined && 
            newOptions.singleTile !== this.singleTile;
        OpenLayers.Layer.HTTPRequest.prototype.addOptions.apply(this, arguments);
        if (this.map && singleTileChanged) {
            this.initProperties();
            this.clearGrid();
            this.tileSize = this.options.tileSize;
            this.setTileSize();
            this.moveTo(null, true);
        }
    },
    
    /**
     * APIMethod: clone
     * Create a clone of this layer
     *
     * Parameters:
     * obj - {Object} Is this ever used?
     * 
     * Returns:
     * {<OpenLayers.Layer.Grid>} An exact clone of this OpenLayers.Layer.Grid
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.Grid(this.name,
                                            this.url,
                                            this.params,
                                            this.getOptions());
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.HTTPRequest.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here
        if (this.tileSize != null) {
            obj.tileSize = this.tileSize.clone();
        }
        
        // we do not want to copy reference to grid, so we make a new array
        obj.grid = [];
        obj.gridResolution = null;
        // same for backbuffer
        obj.backBuffer = null;
        obj.backBufferTimerId = null;
        obj.loading = false;
        obj.numLoadingTiles = 0;

        return obj;
    },    

    /**
     * Method: moveTo
     * This function is called whenever the map is moved. All the moving
     * of actual 'tiles' is done by the map, but moveTo's role is to accept
     * a bounds and make sure the data that that bounds requires is pre-loaded.
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * zoomChanged - {Boolean}
     * dragging - {Boolean}
     */
    moveTo:function(bounds, zoomChanged, dragging) {

        OpenLayers.Layer.HTTPRequest.prototype.moveTo.apply(this, arguments);

        bounds = bounds || this.map.getExtent();

        if (bounds != null) {
             
            // if grid is empty or zoom has changed, we *must* re-tile
            var forceReTile = !this.grid.length || zoomChanged;
            
            // total bounds of the tiles
            var tilesBounds = this.getTilesBounds();            

            // the new map resolution
            var resolution = this.map.getResolution();

            // the server-supported resolution for the new map resolution
            var serverResolution = this.getServerResolution(resolution);

            if (this.singleTile) {
                
                // We want to redraw whenever even the slightest part of the 
                //  current bounds is not contained by our tile.
                //  (thus, we do not specify partial -- its default is false)

                if ( forceReTile ||
                     (!dragging && !tilesBounds.containsBounds(bounds))) {

                    // In single tile mode with no transition effect, we insert
                    // a non-scaled backbuffer when the layer is moved. But if
                    // a zoom occurs right after a move, i.e. before the new
                    // image is received, we need to remove the backbuffer, or
                    // an ill-positioned image will be visible during the zoom
                    // transition.

                    if(zoomChanged && this.transitionEffect !== 'resize') {
                        this.removeBackBuffer();
                    }

                    if(!zoomChanged || this.transitionEffect === 'resize') {
                        this.applyBackBuffer(resolution);
                    }

                    this.initSingleTile(bounds);
                }
            } else {

                // if the bounds have changed such that they are not even 
                // *partially* contained by our tiles (e.g. when user has 
                // programmatically panned to the other side of the earth on
                // zoom level 18), then moveGriddedTiles could potentially have
                // to run through thousands of cycles, so we want to reTile
                // instead (thus, partial true).  
                forceReTile = forceReTile ||
                    !tilesBounds.intersectsBounds(bounds, {
                        worldBounds: this.map.baseLayer.wrapDateLine &&
                            this.map.getMaxExtent()
                    });

                if(forceReTile) {
                    if(zoomChanged && (this.transitionEffect === 'resize' ||
                                          this.gridResolution === resolution)) {
                        this.applyBackBuffer(resolution);
                    }
                    this.initGriddedTiles(bounds);
                } else {
                    this.moveGriddedTiles();
                }
            }
        }
    },

    /**
     * Method: getTileData
     * Given a map location, retrieve a tile and the pixel offset within that
     *     tile corresponding to the location.  If there is not an existing 
     *     tile in the grid that covers the given location, null will be 
     *     returned.
     *
     * Parameters:
     * loc - {<OpenLayers.LonLat>} map location
     *
     * Returns:
     * {Object} Object with the following properties: tile ({<OpenLayers.Tile>}),
     *     i ({Number} x-pixel offset from top left), and j ({Integer} y-pixel
     *     offset from top left).
     */
    getTileData: function(loc) {
        var data = null,
            x = loc.lon,
            y = loc.lat,
            numRows = this.grid.length;

        if (this.map && numRows) {
            var res = this.map.getResolution(),
                tileWidth = this.tileSize.w,
                tileHeight = this.tileSize.h,
                bounds = this.grid[0][0].bounds,
                left = bounds.left,
                top = bounds.top;

            if (x < left) {
                // deal with multiple worlds
                if (this.map.baseLayer.wrapDateLine) {
                    var worldWidth = this.map.getMaxExtent().getWidth();
                    var worldsAway = Math.ceil((left - x) / worldWidth);
                    x += worldWidth * worldsAway;
                }
            }
            // tile distance to location (fractional number of tiles);
            var dtx = (x - left) / (res * tileWidth);
            var dty = (top - y) / (res * tileHeight);
            // index of tile in grid
            var col = Math.floor(dtx);
            var row = Math.floor(dty);
            if (row >= 0 && row < numRows) {
                var tile = this.grid[row][col];
                if (tile) {
                    data = {
                        tile: tile,
                        // pixel index within tile
                        i: Math.floor((dtx - col) * tileWidth),
                        j: Math.floor((dty - row) * tileHeight)
                    };                    
                }
            }
        }
        return data;
    },
    
    /**
     * Method: destroyTile
     *
     * Parameters:
     * tile - {<OpenLayers.Tile>}
     */
    destroyTile: function(tile) {
        this.removeTileMonitoringHooks(tile);
        tile.destroy();
    },

    /**
     * Method: getServerResolution
     * Return the closest server-supported resolution.
     *
     * Parameters:
     * resolution - {Number} The base resolution. If undefined the
     *     map resolution is used.
     *
     * Returns:
     * {Number} The closest server resolution value.
     */
    getServerResolution: function(resolution) {
        var distance = Number.POSITIVE_INFINITY;
        resolution = resolution || this.map.getResolution();
        if(this.serverResolutions &&
           OpenLayers.Util.indexOf(this.serverResolutions, resolution) === -1) {
            var i, newDistance, newResolution, serverResolution;
            for(i=this.serverResolutions.length-1; i>= 0; i--) {
                newResolution = this.serverResolutions[i];
                newDistance = Math.abs(newResolution - resolution);
                if (newDistance > distance) {
                    break;
                }
                distance = newDistance;
                serverResolution = newResolution;
            }
            resolution = serverResolution;
        }
        return resolution;
    },

    /**
     * Method: getServerZoom
     * Return the zoom value corresponding to the best matching server
     * resolution, taking into account <serverResolutions> and <zoomOffset>.
     *
     * Returns:
     * {Number} The closest server supported zoom. This is not the map zoom
     *     level, but an index of the server's resolutions array.
     */
    getServerZoom: function() {
        var resolution = this.getServerResolution();
        return this.serverResolutions ?
            OpenLayers.Util.indexOf(this.serverResolutions, resolution) :
            this.map.getZoomForResolution(resolution) + (this.zoomOffset || 0);
    },

    /**
     * Method: applyBackBuffer
     * Create, insert, scale and position a back buffer for the layer.
     *
     * Parameters:
     * resolution - {Number} The resolution to transition to.
     */
    applyBackBuffer: function(resolution) {
        if(this.backBufferTimerId !== null) {
            this.removeBackBuffer();
        }
        var backBuffer = this.backBuffer;
        if(!backBuffer) {
            backBuffer = this.createBackBuffer();
            if(!backBuffer) {
                return;
            }
            if (resolution === this.gridResolution) {
                this.div.insertBefore(backBuffer, this.div.firstChild);
            } else {
                this.map.baseLayer.div.parentNode.insertBefore(backBuffer, this.map.baseLayer.div);
            }
            this.backBuffer = backBuffer;

            // set some information in the instance for subsequent
            // calls to applyBackBuffer where the same back buffer
            // is reused
            var topLeftTileBounds = this.grid[0][0].bounds;
            this.backBufferLonLat = {
                lon: topLeftTileBounds.left,
                lat: topLeftTileBounds.top
            };
            this.backBufferResolution = this.gridResolution;
        }
        
        var ratio = this.backBufferResolution / resolution;

        // scale the tiles inside the back buffer
        var tiles = backBuffer.childNodes, tile;
        for (var i=tiles.length-1; i>=0; --i) {
            tile = tiles[i];
            tile.style.top = ((ratio * tile._i * tile._h) | 0) + 'px';
            tile.style.left = ((ratio * tile._j * tile._w) | 0) + 'px';
            tile.style.width = Math.round(ratio * tile._w) + 'px';
            tile.style.height = Math.round(ratio * tile._h) + 'px';
        }

        // and position it (based on the grid's top-left corner)
        var position = this.getViewPortPxFromLonLat(
                this.backBufferLonLat, resolution);
        var leftOffset = this.map.layerContainerOriginPx.x;
        var topOffset = this.map.layerContainerOriginPx.y;
        backBuffer.style.left = Math.round(position.x - leftOffset) + 'px';
        backBuffer.style.top = Math.round(position.y - topOffset) + 'px';
    },

    /**
     * Method: createBackBuffer
     * Create a back buffer.
     *
     * Returns:
     * {DOMElement} The DOM element for the back buffer, undefined if the
     * grid isn't initialized yet.
     */
    createBackBuffer: function() {
        var backBuffer;
        if(this.grid.length > 0) {
            backBuffer = document.createElement('div');
            backBuffer.id = this.div.id + '_bb';
            backBuffer.className = 'olBackBuffer';
            backBuffer.style.position = 'absolute';
            var map = this.map;
            backBuffer.style.zIndex = this.transitionEffect === 'resize' ?
                    this.getZIndex() - 1 :
                    // 'map-resize':
                    map.Z_INDEX_BASE.BaseLayer -
                            (map.getNumLayers() - map.getLayerIndex(this));
            for(var i=0, lenI=this.grid.length; i<lenI; i++) {
                for(var j=0, lenJ=this.grid[i].length; j<lenJ; j++) {
                    var tile = this.grid[i][j],
                        markup = this.grid[i][j].createBackBuffer();
                    if (markup) {
                        markup._i = i;
                        markup._j = j;
                        markup._w = tile.size.w;
                        markup._h = tile.size.h;
                        markup.id = tile.id + '_bb';
                        backBuffer.appendChild(markup);
                    }
                }
            }
        }
        return backBuffer;
    },

    /**
     * Method: removeBackBuffer
     * Remove back buffer from DOM.
     */
    removeBackBuffer: function() {
        if (this._transitionElement) {
            for (var i=this.transitionendEvents.length-1; i>=0; --i) {
                OpenLayers.Event.stopObserving(this._transitionElement,
                    this.transitionendEvents[i], this._removeBackBuffer);
            }
            delete this._transitionElement;
        }
        if(this.backBuffer) {
            if (this.backBuffer.parentNode) {
                this.backBuffer.parentNode.removeChild(this.backBuffer);
            }
            this.backBuffer = null;
            this.backBufferResolution = null;
            if(this.backBufferTimerId !== null) {
                window.clearTimeout(this.backBufferTimerId);
                this.backBufferTimerId = null;
            }
        }
    },

    /**
     * Method: moveByPx
     * Move the layer based on pixel vector.
     *
     * Parameters:
     * dx - {Number}
     * dy - {Number}
     */
    moveByPx: function(dx, dy) {
        if (!this.singleTile) {
            this.moveGriddedTiles();
        }
    },

    /**
     * APIMethod: setTileSize
     * Check if we are in singleTile mode and if so, set the size as a ratio
     *     of the map size (as specified by the layer's 'ratio' property).
     * 
     * Parameters:
     * size - {<OpenLayers.Size>}
     */
    setTileSize: function(size) { 
        if (this.singleTile) {
            size = this.map.getSize();
            size.h = parseInt(size.h * this.ratio, 10);
            size.w = parseInt(size.w * this.ratio, 10);
        } 
        OpenLayers.Layer.HTTPRequest.prototype.setTileSize.apply(this, [size]);
    },

    /**
     * APIMethod: getTilesBounds
     * Return the bounds of the tile grid.
     *
     * Returns:
     * {<OpenLayers.Bounds>} A Bounds object representing the bounds of all the
     *     currently loaded tiles (including those partially or not at all seen 
     *     onscreen).
     */
    getTilesBounds: function() {    
        var bounds = null; 
        
        var length = this.grid.length;
        if (length) {
            var bottomLeftTileBounds = this.grid[length - 1][0].bounds,
                width = this.grid[0].length * bottomLeftTileBounds.getWidth(),
                height = this.grid.length * bottomLeftTileBounds.getHeight();
            
            bounds = new OpenLayers.Bounds(bottomLeftTileBounds.left, 
                                           bottomLeftTileBounds.bottom,
                                           bottomLeftTileBounds.left + width, 
                                           bottomLeftTileBounds.bottom + height);
        }   
        return bounds;
    },

    /**
     * Method: initSingleTile
     * 
     * Parameters: 
     * bounds - {<OpenLayers.Bounds>}
     */
    initSingleTile: function(bounds) {
        this.events.triggerEvent("retile");

        //determine new tile bounds
        var center = bounds.getCenterLonLat();
        var tileWidth = bounds.getWidth() * this.ratio;
        var tileHeight = bounds.getHeight() * this.ratio;
                                       
        var tileBounds = 
            new OpenLayers.Bounds(center.lon - (tileWidth/2),
                                  center.lat - (tileHeight/2),
                                  center.lon + (tileWidth/2),
                                  center.lat + (tileHeight/2));
  
        var px = this.map.getLayerPxFromLonLat({
            lon: tileBounds.left,
            lat: tileBounds.top
        });

        if (!this.grid.length) {
            this.grid[0] = [];
        }

        var tile = this.grid[0][0];
        if (!tile) {
            tile = this.addTile(tileBounds, px);
            
            this.addTileMonitoringHooks(tile);
            tile.draw();
            this.grid[0][0] = tile;
        } else {
            tile.moveTo(tileBounds, px);
        }           
        
        //remove all but our single tile
        this.removeExcessTiles(1,1);

        // store the resolution of the grid
        this.gridResolution = this.getServerResolution();
    },

    /** 
     * Method: calculateGridLayout
     * Generate parameters for the grid layout.
     *
     * Parameters:
     * bounds - {<OpenLayers.Bound>|Object} OpenLayers.Bounds or an
     *     object with a 'left' and 'top' properties.
     * origin - {<OpenLayers.LonLat>|Object} OpenLayers.LonLat or an
     *     object with a 'lon' and 'lat' properties.
     * resolution - {Number}
     *
     * Returns:
     * {Object} Object containing properties tilelon, tilelat, startcol,
     * startrow
     */
    calculateGridLayout: function(bounds, origin, resolution) {
        var tilelon = resolution * this.tileSize.w;
        var tilelat = resolution * this.tileSize.h;
        
        var offsetlon = bounds.left - origin.lon;
        var tilecol = Math.floor(offsetlon/tilelon) - this.buffer;
        
        var rowSign = this.rowSign;

        var offsetlat = rowSign * (origin.lat - bounds.top + tilelat);  
        var tilerow = Math[~rowSign ? 'floor' : 'ceil'](offsetlat/tilelat) - this.buffer * rowSign;
        
        return { 
          tilelon: tilelon, tilelat: tilelat,
          startcol: tilecol, startrow: tilerow
        };

    },
    
    /**
     * Method: getTileOrigin
     * Determine the origin for aligning the grid of tiles.  If a <tileOrigin>
     *     property is supplied, that will be returned.  Otherwise, the origin
     *     will be derived from the layer's <maxExtent> property.  In this case,
     *     the tile origin will be the corner of the <maxExtent> given by the 
     *     <tileOriginCorner> property.
     *
     * Returns:
     * {<OpenLayers.LonLat>} The tile origin.
     */
    getTileOrigin: function() {
        var origin = this.tileOrigin;
        if (!origin) {
            var extent = this.getMaxExtent();
            var edges = ({
                "tl": ["left", "top"],
                "tr": ["right", "top"],
                "bl": ["left", "bottom"],
                "br": ["right", "bottom"]
            })[this.tileOriginCorner];
            origin = new OpenLayers.LonLat(extent[edges[0]], extent[edges[1]]);
        }
        return origin;
    },

    /**
     * Method: getTileBoundsForGridIndex
     *
     * Parameters:
     * row - {Number} The row of the grid
     * col - {Number} The column of the grid
     *
     * Returns:
     * {<OpenLayers.Bounds>} The bounds for the tile at (row, col)
     */
    getTileBoundsForGridIndex: function(row, col) {
        var origin = this.getTileOrigin();
        var tileLayout = this.gridLayout;
        var tilelon = tileLayout.tilelon;
        var tilelat = tileLayout.tilelat;
        var startcol = tileLayout.startcol;
        var startrow = tileLayout.startrow;
        var rowSign = this.rowSign;
        return new OpenLayers.Bounds(
            origin.lon + (startcol + col) * tilelon,
            origin.lat - (startrow + row * rowSign) * tilelat * rowSign,
            origin.lon + (startcol + col + 1) * tilelon,
            origin.lat - (startrow + (row - 1) * rowSign) * tilelat * rowSign
        );
    },

    /**
     * Method: initGriddedTiles
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     */
    initGriddedTiles:function(bounds) {
        this.events.triggerEvent("retile");

        // work out mininum number of rows and columns; this is the number of
        // tiles required to cover the viewport plus at least one for panning

        var viewSize = this.map.getSize();
        
        var origin = this.getTileOrigin();
        var resolution = this.map.getResolution(),
            serverResolution = this.getServerResolution(),
            ratio = resolution / serverResolution,
            tileSize = {
                w: this.tileSize.w / ratio,
                h: this.tileSize.h / ratio
            };

        var minRows = Math.ceil(viewSize.h/tileSize.h) + 
                      2 * this.buffer + 1;
        var minCols = Math.ceil(viewSize.w/tileSize.w) +
                      2 * this.buffer + 1;

        var tileLayout = this.calculateGridLayout(bounds, origin, serverResolution);
        this.gridLayout = tileLayout;
        
        var tilelon = tileLayout.tilelon;
        var tilelat = tileLayout.tilelat;
        
        var layerContainerDivLeft = this.map.layerContainerOriginPx.x;
        var layerContainerDivTop = this.map.layerContainerOriginPx.y;

        var tileBounds = this.getTileBoundsForGridIndex(0, 0);
        var startPx = this.map.getViewPortPxFromLonLat(
            new OpenLayers.LonLat(tileBounds.left, tileBounds.top)
        );
        startPx.x = Math.round(startPx.x) - layerContainerDivLeft;
        startPx.y = Math.round(startPx.y) - layerContainerDivTop;

        var tileData = [], center = this.map.getCenter();

        var rowidx = 0;
        do {
            var row = this.grid[rowidx];
            if (!row) {
                row = [];
                this.grid.push(row);
            }
            
            var colidx = 0;
            do {
                tileBounds = this.getTileBoundsForGridIndex(rowidx, colidx);
                var px = startPx.clone();
                px.x = px.x + colidx * Math.round(tileSize.w);
                px.y = px.y + rowidx * Math.round(tileSize.h);
                var tile = row[colidx];
                if (!tile) {
                    tile = this.addTile(tileBounds, px);
                    this.addTileMonitoringHooks(tile);
                    row.push(tile);
                } else {
                    tile.moveTo(tileBounds, px, false);
                }
                var tileCenter = tileBounds.getCenterLonLat();
                tileData.push({
                    tile: tile,
                    distance: Math.pow(tileCenter.lon - center.lon, 2) +
                        Math.pow(tileCenter.lat - center.lat, 2)
                });
     
                colidx += 1;
            } while ((tileBounds.right <= bounds.right + tilelon * this.buffer)
                     || colidx < minCols);
             
            rowidx += 1;
        } while((tileBounds.bottom >= bounds.bottom - tilelat * this.buffer)
                || rowidx < minRows);
        
        //shave off exceess rows and colums
        this.removeExcessTiles(rowidx, colidx);

        var resolution = this.getServerResolution();
        // store the resolution of the grid
        this.gridResolution = resolution;

        //now actually draw the tiles
        tileData.sort(function(a, b) {
            return a.distance - b.distance; 
        });
        for (var i=0, ii=tileData.length; i<ii; ++i) {
            tileData[i].tile.draw();
        }
    },

    /**
     * Method: getMaxExtent
     * Get this layer's maximum extent. (Implemented as a getter for
     *     potential specific implementations in sub-classes.)
     *
     * Returns:
     * {<OpenLayers.Bounds>}
     */
    getMaxExtent: function() {
        return this.maxExtent;
    },
    
    /**
     * APIMethod: addTile
     * Create a tile, initialize it, and add it to the layer div. 
     *
     * Parameters
     * bounds - {<OpenLayers.Bounds>}
     * position - {<OpenLayers.Pixel>}
     *
     * Returns:
     * {<OpenLayers.Tile>} The added OpenLayers.Tile
     */
    addTile: function(bounds, position) {
        var tile = new this.tileClass(
            this, position, bounds, null, this.tileSize, this.tileOptions
        );
        this.events.triggerEvent("addtile", {tile: tile});
        return tile;
    },
    
    /** 
     * Method: addTileMonitoringHooks
     * This function takes a tile as input and adds the appropriate hooks to 
     *     the tile so that the layer can keep track of the loading tiles.
     * 
     * Parameters: 
     * tile - {<OpenLayers.Tile>}
     */
    addTileMonitoringHooks: function(tile) {
        
        var replacingCls = 'olTileReplacing';

        tile.onLoadStart = function() {
            //if that was first tile then trigger a 'loadstart' on the layer
            if (this.loading === false) {
                this.loading = true;
                this.events.triggerEvent("loadstart");
            }
            this.events.triggerEvent("tileloadstart", {tile: tile});
            this.numLoadingTiles++;
            if (!this.singleTile && this.backBuffer && this.gridResolution === this.backBufferResolution) {
                OpenLayers.Element.addClass(tile.getTile(), replacingCls);
            }
        };
      
        tile.onLoadEnd = function(evt) {
            this.numLoadingTiles--;
            var aborted = evt.type === 'unload';
            this.events.triggerEvent("tileloaded", {
                tile: tile,
                aborted: aborted
            });
            if (!this.singleTile && !aborted && this.backBuffer && this.gridResolution === this.backBufferResolution) {
                var tileDiv = tile.getTile();
                if (OpenLayers.Element.getStyle(tileDiv, 'display') === 'none') {
                    var bufferTile = document.getElementById(tile.id + '_bb');
                    if (bufferTile) {
                        bufferTile.parentNode.removeChild(bufferTile);
                    }
                }
                OpenLayers.Element.removeClass(tileDiv, replacingCls);
            }
            //if that was the last tile, then trigger a 'loadend' on the layer
            if (this.numLoadingTiles === 0) {
                if (this.backBuffer) {
                    if (this.backBuffer.childNodes.length === 0) {
                        // no tiles transitioning, remove immediately
                        this.removeBackBuffer();
                    } else {
                        // wait until transition has ended or delay has passed
                        this._transitionElement = aborted ?
                            this.div.lastChild : tile.imgDiv;
                        var transitionendEvents = this.transitionendEvents;
                        for (var i=transitionendEvents.length-1; i>=0; --i) {
                            OpenLayers.Event.observe(this._transitionElement,
                                transitionendEvents[i],
                                this._removeBackBuffer);
                        }
                        // the removal of the back buffer is delayed to prevent
                        // flash effects due to the animation of tile displaying
                        this.backBufferTimerId = window.setTimeout(
                            this._removeBackBuffer, this.removeBackBufferDelay
                        );
                    }
                }
                this.loading = false;
                this.events.triggerEvent("loadend");
            }
        };
        
        tile.onLoadError = function() {
            this.events.triggerEvent("tileerror", {tile: tile});
        };
        
        tile.events.on({
            "loadstart": tile.onLoadStart,
            "loadend": tile.onLoadEnd,
            "unload": tile.onLoadEnd,
            "loaderror": tile.onLoadError,
            scope: this
        });
    },

    /** 
     * Method: removeTileMonitoringHooks
     * This function takes a tile as input and removes the tile hooks 
     *     that were added in addTileMonitoringHooks()
     * 
     * Parameters: 
     * tile - {<OpenLayers.Tile>}
     */
    removeTileMonitoringHooks: function(tile) {
        tile.unload();
        tile.events.un({
            "loadstart": tile.onLoadStart,
            "loadend": tile.onLoadEnd,
            "unload": tile.onLoadEnd,
            "loaderror": tile.onLoadError,
            scope: this
        });
    },
    
    /**
     * Method: moveGriddedTiles
     */
    moveGriddedTiles: function() {
        var buffer = this.buffer + 1;
        while(true) {
            var tlTile = this.grid[0][0];
            var tlViewPort = {
                x: tlTile.position.x +
                    this.map.layerContainerOriginPx.x,
                y: tlTile.position.y +
                    this.map.layerContainerOriginPx.y
            };
            var ratio = this.getServerResolution() / this.map.getResolution();
            var tileSize = {
                w: Math.round(this.tileSize.w * ratio),
                h: Math.round(this.tileSize.h * ratio)
            };
            if (tlViewPort.x > -tileSize.w * (buffer - 1)) {
                this.shiftColumn(true, tileSize);
            } else if (tlViewPort.x < -tileSize.w * buffer) {
                this.shiftColumn(false, tileSize);
            } else if (tlViewPort.y > -tileSize.h * (buffer - 1)) {
                this.shiftRow(true, tileSize);
            } else if (tlViewPort.y < -tileSize.h * buffer) {
                this.shiftRow(false, tileSize);
            } else {
                break;
            }
        }
    },

    /**
     * Method: shiftRow
     * Shifty grid work
     *
     * Parameters:
     * prepend - {Boolean} if true, prepend to beginning.
     *                          if false, then append to end
     * tileSize - {Object} rendered tile size; object with w and h properties
     */
    shiftRow: function(prepend, tileSize) {
        var grid = this.grid;
        var rowIndex = prepend ? 0 : (grid.length - 1);
        var sign = prepend ? -1 : 1;
        var rowSign = this.rowSign;
        var tileLayout = this.gridLayout;
        tileLayout.startrow += sign * rowSign;

        var modelRow = grid[rowIndex];
        var row = grid[prepend ? 'pop' : 'shift']();
        for (var i=0, len=row.length; i<len; i++) {
            var tile = row[i];
            var position = modelRow[i].position.clone();
            position.y += tileSize.h * sign;
            tile.moveTo(this.getTileBoundsForGridIndex(rowIndex, i), position);
        }
        grid[prepend ? 'unshift' : 'push'](row);
    },

    /**
     * Method: shiftColumn
     * Shift grid work in the other dimension
     *
     * Parameters:
     * prepend - {Boolean} if true, prepend to beginning.
     *                          if false, then append to end
     * tileSize - {Object} rendered tile size; object with w and h properties
     */
    shiftColumn: function(prepend, tileSize) {
        var grid = this.grid;
        var colIndex = prepend ? 0 : (grid[0].length - 1);
        var sign = prepend ? -1 : 1;
        var tileLayout = this.gridLayout;
        tileLayout.startcol += sign;

        for (var i=0, len=grid.length; i<len; i++) {
            var row = grid[i];
            var position = row[colIndex].position.clone();
            var tile = row[prepend ? 'pop' : 'shift']();            
            position.x += tileSize.w * sign;
            tile.moveTo(this.getTileBoundsForGridIndex(i, colIndex), position);
            row[prepend ? 'unshift' : 'push'](tile);
        }
    },

    /**
     * Method: removeExcessTiles
     * When the size of the map or the buffer changes, we may need to
     *     remove some excess rows and columns.
     * 
     * Parameters:
     * rows - {Integer} Maximum number of rows we want our grid to have.
     * columns - {Integer} Maximum number of columns we want our grid to have.
     */
    removeExcessTiles: function(rows, columns) {
        var i, l;
        
        // remove extra rows
        while (this.grid.length > rows) {
            var row = this.grid.pop();
            for (i=0, l=row.length; i<l; i++) {
                var tile = row[i];
                this.destroyTile(tile);
            }
        }
        
        // remove extra columns
        for (i=0, l=this.grid.length; i<l; i++) {
            while (this.grid[i].length > columns) {
                var row = this.grid[i];
                var tile = row.pop();
                this.destroyTile(tile);
            }
        }
    },

    /**
     * Method: onMapResize
     * For singleTile layers, this will set a new tile size according to the
     * dimensions of the map pane.
     */
    onMapResize: function() {
        if (this.singleTile) {
            this.clearGrid();
            this.setTileSize();
        }
    },
    
    /**
     * APIMethod: getTileBounds
     * Returns The tile bounds for a layer given a pixel location.
     *
     * Parameters:
     * viewPortPx - {<OpenLayers.Pixel>} The location in the viewport.
     *
     * Returns:
     * {<OpenLayers.Bounds>} Bounds of the tile at the given pixel location.
     */
    getTileBounds: function(viewPortPx) {
        var maxExtent = this.maxExtent;
        var resolution = this.getResolution();
        var tileMapWidth = resolution * this.tileSize.w;
        var tileMapHeight = resolution * this.tileSize.h;
        var mapPoint = this.getLonLatFromViewPortPx(viewPortPx);
        var tileLeft = maxExtent.left + (tileMapWidth *
                                         Math.floor((mapPoint.lon -
                                                     maxExtent.left) /
                                                    tileMapWidth));
        var tileBottom = maxExtent.bottom + (tileMapHeight *
                                             Math.floor((mapPoint.lat -
                                                         maxExtent.bottom) /
                                                        tileMapHeight));
        return new OpenLayers.Bounds(tileLeft, tileBottom,
                                     tileLeft + tileMapWidth,
                                     tileBottom + tileMapHeight);
    },

    CLASS_NAME: "OpenLayers.Layer.Grid"
});
