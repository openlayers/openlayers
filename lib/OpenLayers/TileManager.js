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
 * been used. Several maps can share a TileManager instance, in which case each
 * map gets its own tile queue, but all maps share the same tile cache.
 */
OpenLayers.TileManager = OpenLayers.Class({
    
    /**
     * APIProperty: cacheSize
     * {Number} Number of image elements to keep referenced in this instance's
     * cache for fast reuse. Default is 256.
     */
    cacheSize: 256,

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
     * Property: maps
     * {Array(<OpenLayers.Map>)} The maps to manage tiles on.
     */
    maps: null,
    
    /**
     * Property: tileQueueId
     * {Object} The ids of the <drawTilesFromQueue> loop, keyed by map id.
     */
    tileQueueId: null,

    /**
     * Property: tileQueue
     * {Object(Array(<OpenLayers.Tile>))} Tiles queued for drawing, keyed by
     * map id.
     */
    tileQueue: null,
    
    /**
     * Property: tileCache
     * {Object} Cached image elements, keyed by URL.
     */
    tileCache: null,
    
    /**
     * Property: tileCacheIndex
     * {Array<String>} URLs of cached tiles. First entry in each array is the
     * least recently used.
     */
    tileCacheIndex: null,    
    
    /** 
     * Constructor: OpenLayers.TileManager
     * Constructor for a new <OpenLayers.TileManager> instance.
     * 
     * Parameters:
     * options - {Object} Configuration for this instance.
     */   
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
        this.maps = [];
        this.tileQueueId = {};
        this.tileQueue = {};
        this.tileCache = {};
        this.tileCacheIndex = [];
    },
    
    /**
     * Method: addMap
     * Binds this instance to a map
     *
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    addMap: function(map) {
        if (this._destroyed) {
            return;
        }
        this.maps.push(map);
        this.tileQueue[map.id] = [];
        for (var i=0, ii=map.layers.length; i<ii; ++i) {
            this.addLayer({layer: map.layers[i]});
        }
        map.events.on({
            move: this.move,
            zoomend: this.zoomEnd,
            addlayer: this.addLayer,
            preremovelayer: this.removeLayer,
            scope: this
        });
    },
    
    removeMap: function(map) {
        if (this._destroyed) {
            return;
        }
        window.clearTimeout(this.tileQueueId[map.id]);
        if (map.layers) {
            for (var i=0, ii=map.layers.length; i<ii; ++i) {
                this.removeLayer({layer: map.layers[i]});
            }
        }
        if (map.events) {
            map.events.un({
                move: this.move,
                zoomend: this.zoomEnd,
                addlayer: this.addLayer,
                preremovelayer: this.removeLayer,
                scope: this
            });
        }
        delete this.tileQueue[map.id];
        delete this.tileQueueId[map.id];
    },
    
    /**
     * Method: move
     * Handles the map's move event
     *
     * Parameters:
     * evt - {Object} Listener argument
     */
    move: function(evt) {
        this.updateTimeout(evt.object, this.moveDelay);
    },
    
    /**
     * Method: zoomEnd
     * Handles the map's zoomEnd event
     *
     * Parameters:
     * evt - {Object} Listener argument
     */
    zoomEnd: function(evt) {
        this.updateTimeout(evt.object, this.zoomDelay);
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
     * Method: removeLayer
     * Handles the map's preremovelayer event
     *
     * Parameters:
     * evt - {Object} The listener argument
     */
    removeLayer: function(evt) {
        var layer = evt.layer;
        if (layer instanceof OpenLayers.Layer.Grid) {
            this.clearTileQueue({object: layer});
            if (layer.events) {
                layer.events.un({
                    addtile: this.addTile,
                    retile: this.clearTileQueue,
                    scope: this
                });
            }
            if (layer.grid) {
                var i, j, tile;
                for (i=layer.grid.length-1; i>=0; --i) {
                    for (j=layer.grid[i].length-1; j>=0; --j) {
                        tile = layer.grid[i][j];
                        this.unloadTile({object: tile});
                        if (tile.url) {
                            this.manageTileCache({object: tile});
                        }
                    }
                }
            }
        }
    },
    
    /**
     * Method: updateTimeout
     * Applies the <moveDelay> or <zoomDelay> to the <drawTilesFromQueue> loop.
     *
     * Parameters:
     * map - {<OpenLayers.Map>} The map to update the timeout for
     * delay - {Number} The delay to apply
     */
    updateTimeout: function(map, delay) {
        window.clearTimeout(this.tileQueueId[map.id]);
        if (this.tileQueue[map.id].length) {
            this.tileQueueId[map.id] = window.setTimeout(
                OpenLayers.Function.bind(function() {
                    this.drawTilesFromQueue(map);
                }, this), delay
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
            beforeload: this.manageTileCache,
            loadend: this.addToCache,
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
        var tile = evt.object;
        tile.events.un({
            beforedraw: this.queueTileDraw,
            beforeload: this.manageTileCache,
            loadend: this.addToCache,
            unload: this.unloadTile,
            scope: this
        });
        OpenLayers.Util.removeItem(this.tileQueue[tile.layer.map.id], tile);
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
            var tileQueue = this.tileQueue[layer.map.id];
            if (!~OpenLayers.Util.indexOf(tileQueue, tile)) {
                tileQueue.push(tile);
            }
            queued = true;
        }
        return !queued;
    },
    
    /**
     * Method: drawTilesFromQueue
     * Draws tiles from the tileQueue, and unqueues the tiles
     */
    drawTilesFromQueue: function(map) {
        var tileQueue = this.tileQueue[map.id];
        while (tileQueue.length) {
            tileQueue.shift().draw(true);
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
        // only use image from cache if it is not on a layer already
        if (img && (!img.parentNode ||
                 OpenLayers.Element.hasClass(img.parentNode, 'olBackBuffer'))) {
            if (tile.layer.backBuffer) {
                img.style.opacity = 0;
                img.style.visibility = 'hidden';
            }
            tile.setImage(img);
            OpenLayers.Util.removeItem(this.tileCacheIndex, tile.url);
            this.tileCacheIndex.push(tile.url);
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
        var tileQueue = this.tileQueue[layer.map.id];
        for (var i=tileQueue.length-1; i>=0; --i) {
            if (tileQueue.layer === layer) {
                tileQueue.splice(i, 1);
            }
        }
    },
    
    destroy: function() {
        for (var i=this.maps.length-1; i>=0; --i) {
            this.removeMap(this.maps[i]);
        }
        this.maps = null;
        this.tileQueue = null;
        this.tileQueueId = null;
        this.tileCache = null;
        this.tileCacheIndex = null;
        this._destroyed = true;
    }

});