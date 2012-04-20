/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Request.js
 * @requires OpenLayers/Console.js
 */

/**
 * Class: OpenLayers.Control.CacheWrite
 * A control for caching image tiles in the browser's local storage. The
 * <OpenLayers.Control.CacheRead> control is used to fetch and use the cached
 * tile images.
 *
 * Note: Before using this control on any layer that is not your own, make sure
 * that the terms of service of the tile provider allow local storage of tiles.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.CacheWrite = OpenLayers.Class(OpenLayers.Control, {
    
    /** 
     * APIProperty: events
     * {<OpenLayers.Events>} Events instance for listeners and triggering
     *     control specific events.
     *
     * To register events in the constructor, configure <eventListeners>.
     *
     * Register a listener for a particular event with the following syntax:
     * (code)
     * control.events.register(type, obj, listener);
     * (end)
     *
     * Supported event types (in addition to those from <OpenLayers.Control.events>):
     * cachefull - Triggered when the cache is full. Listeners receive an
     *     object with a tile property as first argument. The tile references
     *     the tile that couldn't be cached.
     */
    
    /**
     * APIProperty: eventListeners
     * {Object} Object with event listeners, keyed by event name. An optional
     *     scope property defines the scope that listeners will be executed in.
     */

    /**
     * APIProperty: layers
     * {Array(<OpenLayers.Layer.Grid>)}. Optional. If provided, caching
     *     will be enabled for these layers only, otherwise for all cacheable
     *     layers.
     */
    layers: null,
    
    /**
     * APIProperty: imageFormat
     * {String} The image format used for caching. The default is "image/png".
     *     Supported formats depend on the user agent. If an unsupported
     *     <imageFormat> is provided, "image/png" will be used. For aerial
     *     imagery, "image/jpeg" is recommended.
     */
    imageFormat: "image/png",
    
    /**
     * Property: quotaRegEx
     * {RegExp}
     */
    quotaRegEx: (/quota/i),
    
    /**
     * Constructor: OpenLayers.Control.CacheWrite
     *
     * Parameters:
     * options - {Object} Object with API properties for this control.
     */

    /** 
     * Method: setMap
     * Set the map property for the control. 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
        var i, layers = this.layers || map.layers;
        for (i=layers.length-1; i>=0; --i) {
            this.addLayer({layer: layers[i]});
        }
        if (!this.layers) {
            map.events.on({
                addlayer: this.addLayer,
                removeLayer: this.removeLayer,
                scope: this
            });
        }
    },
    
    /**
     * Method: addLayer
     * Adds a layer to the control. Once added, tiles requested for this layer
     *     will be cached.
     *
     * Parameters:
     * evt - {Object} Object with a layer property referencing an
     *     <OpenLayers.Layer> instance
     */
    addLayer: function(evt) {
        evt.layer.events.on({
            tileloadstart: this.makeSameOrigin,
            tileloaded: this.cache,
            scope: this
        });        
    },
    
    /**
     * Method: removeLayer
     * Removes a layer from the control. Once removed, tiles requested for this
     *     layer will no longer be cached.
     *
     * Parameters:
     * evt - {Object} Object with a layer property referencing an
     *     <OpenLayers.Layer> instance
     */
    removeLayer: function(evt) {
        evt.layer.events.un({
            tileloadstart: this.makeSameOrigin,
            tileloaded: this.cache,
            scope: this
        });
    },

    /**
     * Method: makeSameOrigin
     * If the tile does not have CORS image loading enabled and is from a
     * different origin, use OpenLayers.ProxyHost to make it a same origin url.
     *
     * Parameters:
     * evt - {<OpenLayers.Event>}
     */
    makeSameOrigin: function(evt) {
        if (this.active) {
            var tile = evt.tile;
            if (tile instanceof OpenLayers.Tile.Image &&
                    !tile.crossOriginKeyword &&
                    tile.url.substr(0, 5) !== "data:") {
                var sameOriginUrl = OpenLayers.Request.makeSameOrigin(
                    tile.url, OpenLayers.ProxyHost
                );
                OpenLayers.Control.CacheWrite.urlMap[sameOriginUrl] = tile.url;
                tile.url = sameOriginUrl;
            }
        }
    },
    
    /**
     * Method: cache
     * Adds a tile to the cache. When the cache is full, the "cachefull" event
     * is triggered.
     *
     * Parameters:
     * obj - {Object} Object with a tile property, tile being the
     *     <OpenLayers.Tile.Image> with the data to add to the cache
     */
    cache: function(obj) {
        if (this.active && window.localStorage) {
            var tile = obj.tile;
            if (tile instanceof OpenLayers.Tile.Image &&
                    tile.url.substr(0, 5) !== 'data:') {
                try {
                    var canvasContext = tile.getCanvasContext();
                    if (canvasContext) {
                        var urlMap = OpenLayers.Control.CacheWrite.urlMap;
                        var url = urlMap[tile.url] || tile.url;
                        window.localStorage.setItem(
                            "olCache_" + url,
                            canvasContext.canvas.toDataURL(this.imageFormat)
                        );
                        delete urlMap[tile.url];
                    }
                } catch(e) {
                    // local storage full or CORS violation
                    var reason = e.name || e.message;
                    if (reason && this.quotaRegEx.test(reason)) {
                        this.events.triggerEvent("cachefull", {tile: tile});
                    } else {
                        OpenLayers.Console.error(e.toString());
                    }
                }
            }
        }
    },
    
    /**
     * Method: destroy
     * The destroy method is used to perform any clean up before the control
     * is dereferenced.  Typically this is where event listeners are removed
     * to prevent memory leaks.
     */
    destroy: function() {
        if (this.layers || this.map) {
            var i, layers = this.layers || this.map.layers;
            for (i=layers.length-1; i>=0; --i) {
                this.removeLayer({layer: layers[i]});
            }
        }
        if (this.map) {
            this.map.events.un({
                addlayer: this.addLayer,
                removeLayer: this.removeLayer,
                scope: this
            });
        }
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },
    
    CLASS_NAME: "OpenLayers.Control.CacheWrite"
});

/**
 * APIFunction: OpenLayers.Control.CacheWrite.clearCache
 * Clears all tiles cached with <OpenLayers.Control.CacheWrite> from the cache.
 */
OpenLayers.Control.CacheWrite.clearCache = function() {
    if (!window.localStorage) { return; }
    var i, key;
    for (i=window.localStorage.length-1; i>=0; --i) {
        key = window.localStorage.key(i);
        if (key.substr(0, 8) === "olCache_") {
            window.localStorage.removeItem(key);
        }
    }
};

/**
 * Property: OpenLayers.Control.CacheWrite.urlMap
 * {Object} Mapping of same origin urls to cache url keys. Entries will be
 *     deleted as soon as a tile was cached.
 */
OpenLayers.Control.CacheWrite.urlMap = {};


