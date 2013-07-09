/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/BaseTypes.js
 * @requires OpenLayers/BaseTypes/Element.js
 * @requires OpenLayers/Layer/Grid.js
 * @requires OpenLayers/Tile/Image.js
 */

/**
 * Class: OpenLayers.TileManager
 * Provides queueing of image requests and caching of image elements.
 *
 * Queueing avoids unnecessary image requests while changing zoom levels
 * quickly, and helps improve dragging performance on mobile devices that show
 * a lag in dragging when loading of new images starts. <zoomDelay> and
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
     * APIProperty: tilesPerFrame
     * {Number} Number of queued tiles to load per frame (see <frameDelay>).
     *     Default is 2.
     */
    tilesPerFrame: 2,

    /**
     * APIProperty: frameDelay
     * {Number} Delay between tile loading frames (see <tilesPerFrame>) in
     *     milliseconds. Default is 16.
     */
    frameDelay: 16,

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
     * {Array(String)} URLs of cached tiles. First entry is the least recently
     *    used.
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
        if (this._destroyed || !OpenLayers.Layer.Grid) {
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
            changelayer: this.changeLayer,
            addlayer: this.addLayer,
            preremovelayer: this.removeLayer,
            scope: this
        });
    },
    
    /**
     * Method: removeMap
     * Unbinds this instance from a map
     *
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    removeMap: function(map) {
        if (this._destroyed || !OpenLayers.Layer.Grid) {
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
                changelayer: this.changeLayer,
                addlayer: this.addLayer,
                preremovelayer: this.removeLayer,
                scope: this
            });
        }
        delete this.tileQueue[map.id];
        delete this.tileQueueId[map.id];
        OpenLayers.Util.removeItem(this.maps, map);
    },
    
    /**
     * Method: move
     * Handles the map's move event
     *
     * Parameters:
     * evt - {Object} Listener argument
     */
    move: function(evt) {
        this.updateTimeout(evt.object, this.moveDelay, true);
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
     * Method: changeLayer
     * Handles the map's changeLayer event
     *
     * Parameters:
     * evt - {Object} Listener argument
     */
    changeLayer: function(evt) {
        if (evt.property === 'visibility' || evt.property === 'params') {
            this.updateTimeout(evt.object, 0);
        }
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
                    if (tile.url && !tile.imgDiv) {
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
                    }
                }
            }
        }
    },
    
    /**
     * Method: updateTimeout
     * Applies the <moveDelay> or <zoomDelay> to the <drawTilesFromQueue> loop,
     * and schedules more queue processing after <frameDelay> if there are still
     * tiles in the queue.
     *
     * Parameters:
     * map - {<OpenLayers.Map>} The map to update the timeout for
     * delay - {Number} The delay to apply
     * nice - {Boolean} If true, the timeout function will only be created if
     *     the tilequeue is not empty. This is used by the move handler to
     *     avoid impacts on dragging performance. For other events, the tile
     *     queue may not be populated yet, so we need to set the timer
     *     regardless of the queue size.
     */
    updateTimeout: function(map, delay, nice) {
        window.clearTimeout(this.tileQueueId[map.id]);
        var tileQueue = this.tileQueue[map.id];
        if (!nice || tileQueue.length) {
            this.tileQueueId[map.id] = window.setTimeout(
                OpenLayers.Function.bind(function() {
                    this.drawTilesFromQueue(map);
                    if (tileQueue.length) {
                        this.updateTimeout(map, this.frameDelay);
                    }
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
        if (evt.tile instanceof OpenLayers.Tile.Image) {
            evt.tile.events.on({
                beforedraw: this.queueTileDraw,
                beforeload: this.manageTileCache,
                loadend: this.addToCache,
                unload: this.unloadTile,
                scope: this
            });        
        } else {
            // Layer has the wrong tile type, so don't handle it any longer
            this.removeLayer({layer: evt.tile.layer});
        }
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
        var url = layer.getURL(tile.bounds);
        var img = this.tileCache[url];
        if (img && img.className !== 'olTileImage') {
            // cached image no longer valid, e.g. because we're olTileReplacing
            delete this.tileCache[url];
            OpenLayers.Util.removeItem(this.tileCacheIndex, url);
            img = null;
        }
        // queue only if image with same url not cached already
        if (layer.url && (layer.async || !img)) {
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
        var limit = this.tilesPerFrame;
        var animating = map.zoomTween && map.zoomTween.playing;
        while (!animating && tileQueue.length && limit) {
            tileQueue.shift().draw(true);
            --limit;
        }
    },
    
    /**
     * Method: manageTileCache
     * Adds, updates, removes and fetches cache entries.
     *
     * Parameters:
     * evt - {Object} Listener argument of the tile's beforeload event
     */
    manageTileCache: function(evt) {
        var tile = evt.object;
        var img = this.tileCache[tile.url];
        if (img) {
          // if image is on its layer's backbuffer, remove it from backbuffer
          if (img.parentNode &&
                  OpenLayers.Element.hasClass(img.parentNode, 'olBackBuffer')) {
              img.parentNode.removeChild(img);
              img.id = null;
          }
          // only use image from cache if it is not on a layer already
          if (!img.parentNode) {
              img.style.visibility = 'hidden';
              img.style.opacity = 0;
              tile.setImage(img);
              // LRU - move tile to the end of the array to mark it as the most
              // recently used
              OpenLayers.Util.removeItem(this.tileCacheIndex, tile.url);
              this.tileCacheIndex.push(tile.url);
          }
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
            if (tileQueue[i].layer === layer) {
                tileQueue.splice(i, 1);
            }
        }
    },
    
    /**
     * Method: destroy
     */
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
