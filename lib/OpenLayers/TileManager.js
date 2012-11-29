/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/Grid.js
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/BaseTypes.js
 * @requires OpenLayers/BaseTypes/Element.js
 */

/**
 * Class: OpenLayers.TileManager
 * Provides queueing of image requests and caching of image elements.
 *
 * Queueing avoids unnecessary image requests while changing zoom levels
 * quickly, and helps improve dragging performance on mobile devices that show
 * a lag in dragging when loading of new images start. <zoomDelay> and
 * <moveDelay> are the configuration options to control this behavior.
 *
 * Caching avoids setting the src on image elements for images that have already
 * been used. A TileManager instance can have a private cache (when configured
 * with a <cacheSize>), or share a cache with other instances, in which case the
 * cache size can be controlled by adjusting <OpenLayers.TileManager.cacheSize>.
 */
OpenLayers.TileManager = OpenLayers.Class({
    
    /**
     * APIProperty: map
     * {<OpenLayers.Map>} The map to manage tiles on.
     */
    map: null,
    
    /**
     * APIProperty: cacheSize
     * {Number} Number of image elements to keep referenced in this instance's
     * private cache for fast reuse. If not set, this instance will use the
     * shared cache. To configure the shared cache size, set
     * <OpenLayers.TileManager.cacheSize>.
     */
    cacheSize: null,

    /**
     * APIProperty: moveDelay
     * {Number} Delay in milliseconds after a map's move event before loading
     * tiles. Default is 100.
     */
    moveDelay: 100,
    
    /**
     * APIProperty: zoomDelay
     * {Number} Delay in milliseconds after a map's zoomend event before loading
     * tiles. Default is 200.
     */
    zoomDelay: 200,
    
    /**
     * Property: tileQueueId
     * {Number} The id of the <drawTilesFromQueue> animation.
     */
    tileQueueId: null,

    /**
     * Property: tileQueue
     * {Array(<OpenLayers.Tile>)} Tiles queued for drawing.
     */
    tileQueue: null,
    
    /**
     * Property: tileCache
     * {Object} Cached image elements, keyed by URL. This is shared among all
     * TileManager instances, unless <cacheSize> is set on the instance.
     */
    tileCache: {},
    
    /**
     * Property: tileCacheIndex
     * {Array<String>} URLs of cached tiles; first entry is least recently
     * used. This is shared among all TileManager instances, unless
     * <cacheSize> is set on the instance.
     */
    tileCacheIndex: [],    
    
    /** 
     * Constructor: OpenLayers.TileManager
     * Constructor for a new <OpenLayers.TileManager> instance.
     * 
     * Parameters:
     * options - {Object} Configuration for this instance.
     *
     * Required options:
     * map - {<OpenLayers.Map>} The map to manage tiles on.
     */   
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
        this.tileQueue = [];
        if (this.cacheSize == null) {
            this.cacheSize = OpenLayers.TileManager.cacheSize;
        } else {
            this.tileCache = {};
            this.tileCacheIndex = [];
        }
        var map = this.map;
        for (var i=0, ii=map.layers.length; i<ii; ++i) {
            this.addLayer({layer: map.layers[i]});
        }
        this.map.events.on({
            move: this.move,
            zoomend: this.zoomEnd,
            addlayer: this.addLayer,
            removelayer: this.removeLayer,
            scope: this
        });
    },
    
    /**
     * Method: move
     * Handles the map's move event
     */
    move: function() {
        this.updateTimeout(this.moveDelay);
    },
    
    /**
     * Method: zoomEnd
     * Handles the map's zoomEnd event
     */
    zoomEnd: function() {
        this.updateTimeout(this.zoomDelay);
    },
    
    /**
     * Method: addLayer
     * Handles the map's addlayer event
     *
     * Parameters:
     * evt - {Object} The listener argument
     */
    addLayer: function(evt) {
        var layer = evt.layer;
        if (layer instanceof OpenLayers.Layer.Grid) {
            layer.events.on({
                addtile: this.addTile,
                retile: this.clearTileQueue,
                scope: this
            });
            var i, j, tile;
            for (i=layer.grid.length-1; i>=0; --i) {
                for (j=layer.grid[i].length-1; j>=0; --j) {
                    tile = layer.grid[i][j];
                    this.addTile({tile: tile});
                    if (tile.url) {
                        this.manageTileCache({object: tile});
                    }
                }
            }
        }
    },
    
    /**
     * Method: addLayer
     * Handles the map's removelayer event
     *
     * Parameters:
     * evt - {Object} The listener argument
     */
    removeLayer: function(evt) {
        var layer = evt.layer;
        if (layer instanceof OpenLayers.Layer.Grid) {
            this.clearTileQueue({object: layer});
            layer.events.un({
                addtile: this.addTile,
                retile: this.clearTileQueue,
                scope: this
            });
        }
    },
    
    /**
     * Method: updateTimeout
     * Applies the <moveDelay> or <zoomDelay> to the <drawTilesFromQueue> loop.
     *
     * Parameters:
     * delay - {Number} The delay to apply
     */
    updateTimeout: function(delay) {
        window.clearTimeout(this.tileQueueId);
        if (this.tileQueue.length) {
            this.tileQueueId = window.setTimeout(
                OpenLayers.Function.bind(this.drawTilesFromQueue, this),
                delay
            );
        }
    },
    
    /**
     * Method: addTile
     * Listener for the layer's addtile event
     *
     * Parameters:
     * evt - {Object} The listener argument
     */
    addTile: function(evt) {
        evt.tile.events.on({
            beforedraw: this.queueTileDraw,
            loadstart: this.manageTileCache,
            reload: this.manageTileCache,
            unload: this.unloadTile,
            scope: this
        });        
    },
    
    /**
     * Method: unloadTile
     * Listener for the tile's unload event
     *
     * Parameters:
     * evt - {Object} The listener argument
     */
    unloadTile: function(evt) {
        evt.object.events.un({
            beforedraw: this.queueTileDraw,
            loadstart: this.manageTileCache,
            reload: this.manageTileCache,
            loadend: this.addToCache,
            unload: this.unloadTile,
            scope: this
        });
        OpenLayers.Util.removeItem(this.tileQueue, evt.object);
    },
    
    /**
     * Method: queueTileDraw
     * Adds a tile to the queue that will draw it.
     *
     * Parameters:
     * evt - {Object} Listener argument of the tile's beforedraw event
     */
    queueTileDraw: function(evt) {
        var tile = evt.object;
        var queued = false;
        var layer = tile.layer;
        // queue only if image with same url not cached already
        if (layer.url && (layer.async ||
                                  !this.tileCache[layer.getURL(tile.bounds)])) {
            // add to queue only if not in queue already
            if (!~OpenLayers.Util.indexOf(this.tileQueue, tile)) {
                this.tileQueue.push(tile);
            }
            queued = true;
        }
        return !queued;
    },
    
    /**
     * Method: drawTilesFromQueue
     * Draws tiles from the tileQueue, and unqueues the tiles
     */
    drawTilesFromQueue: function() {
        while (this.tileQueue.length) {
            this.tileQueue.shift().draw(true);
        }
    },
    
    /**
     * Method: manageTileCache
     * Adds, updates, removes and fetches cache entries.
     *
     * Parameters:
     * evt - {Object} Listener argument of the tile's loadstart event
     */
    manageTileCache: function(evt) {
        var tile = evt.object;
        var img = this.tileCache[tile.url];
        // only use images from the cache that are not on a layer already
        if (img && (!img.parentNode ||
                 OpenLayers.Element.hasClass(img.parentNode, 'olBackBuffer'))) {
            tile.imgDiv = img;
            OpenLayers.Util.removeItem(this.tileCacheIndex, tile.url);
            this.tileCacheIndex.push(tile.url);
            tile.positionTile();
            tile.layer.div.appendChild(tile.imgDiv);
        } else if (evt.type === 'loadstart') {
            tile.events.register('loadend', this, this.addToCache);
        }
    },
    
    /**
     * Method: addToCache
     *
     * Parameters:
     * evt - {Object} Listener argument for the tile's loadend event
     */
    addToCache: function(evt) {
        var tile = evt.object;
        tile.events.unregister('loadend', this, this.addToCache);
        if (!this.tileCache[tile.url]) {
            if (!OpenLayers.Element.hasClass(tile.imgDiv, 'olImageLoadError')) {
                if (this.tileCacheIndex.length >= this.cacheSize) {
                    delete this.tileCache[this.tileCacheIndex[0]];
                    this.tileCacheIndex.shift();
                }
                this.tileCache[tile.url] = tile.imgDiv;
                this.tileCacheIndex.push(tile.url);
            }
        }
    },

    /**
     * Method: clearTileQueue
     * Clears the tile queue from tiles of a specific layer
     *
     * Parameters:
     * evt - {Object} Listener argument of the layer's retile event
     */
    clearTileQueue: function(evt) {
        var layer = evt.object;
        for (var i=this.tileQueue.length-1; i>=0; --i) {
            if (this.tileQueue[i].layer === layer) {
                this.tileQueue.splice(i, 1);
            }
        }
    }

});

/**
 * APIProperty: OpenLayers.TileManager.cacheSize
 * {Number} Number of image elements to keep referenced in the shared cache
 * for fast reuse. Default is 512.
 */
OpenLayers.TileManager.cacheSize = 512;