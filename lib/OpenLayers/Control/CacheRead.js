/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.CacheRead
 * A control for using image tiles cached with <OpenLayers.Control.CacheWrite>
 * from the browser's local storage.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.CacheRead = OpenLayers.Class(OpenLayers.Control, {
    
    /**
     * APIProperty: fetchEvent
     * {String} The layer event to listen to for replacing remote resource tile
     *     URLs with cached data URIs. Supported values are "tileerror" (try
     *     remote first, fall back to cached) and "tileloadstart" (try cache
     *     first, fall back to remote). Default is "tileloadstart".
     *
     *     Note that "tileerror" will not work for CORS enabled images (see
     *     https://developer.mozilla.org/en/CORS_Enabled_Image), i.e. layers
     *     configured with a <OpenLayers.Tile.Image.crossOriginKeyword> in
     *     <OpenLayers.Layer.Grid.tileOptions>.
     */
    fetchEvent: "tileloadstart",
    
    /**
     * APIProperty: layers
     * {Array(<OpenLayers.Layer.Grid>)}. Optional. If provided, only these
     *     layers will receive tiles from the cache.
     */
    layers: null,
    
    /**
     * APIProperty: autoActivate
     * {Boolean} Activate the control when it is added to a map.  Default is
     *     true.
     */
    autoActivate: true,

    /**
     * Constructor: OpenLayers.Control.CacheRead
     *
     * Parameters:
     * options - {Object} Object with API properties for this control
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
        evt.layer.events.register(this.fetchEvent, this, this.fetch);        
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
        evt.layer.events.unregister(this.fetchEvent, this, this.fetch);
    },
    
    /**
     * Method: fetch
     * Listener to the <fetchEvent> event. Replaces a tile's url with a data
     * URI from the cache.
     *
     * Parameters:
     * evt - {Object} Event object with a tile property.
     */
    fetch: function(evt) {
        if (this.active && window.localStorage &&
                evt.tile instanceof OpenLayers.Tile.Image) {
            var tile = evt.tile,
                url = tile.url;
            // deal with modified tile urls when both CacheWrite and CacheRead
            // are active
            if (!tile.layer.crossOriginKeyword && OpenLayers.ProxyHost &&
                    url.indexOf(OpenLayers.ProxyHost) === 0) {
                url = OpenLayers.Control.CacheWrite.urlMap[url];        
            }
            var dataURI = window.localStorage.getItem("olCache_" + url);
            if (dataURI) {
                tile.url = dataURI;
                if (evt.type === "tileerror") {
                    tile.setImgSrc(dataURI);
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
    
    CLASS_NAME: "OpenLayers.Control.CacheRead"
});
