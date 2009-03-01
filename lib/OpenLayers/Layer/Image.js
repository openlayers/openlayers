/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */
 
/**
 * @requires OpenLayers/Layer.js
 * @requires OpenLayers/Tile/Image.js
 */

/**
 * Class: OpenLayers.Layer.Image
 * Instances of OpenLayers.Layer.Image are used to display data from a web
 * accessible image as a map layer.  Create a new image layer with the
 * <OpenLayers.Layer.Image> constructor.  Inherits from <OpenLayers.Layer>.
 */
OpenLayers.Layer.Image = OpenLayers.Class(OpenLayers.Layer, {

    /**
     * Property: isBaseLayer
     * {Boolean} The layer is a base layer.  Default is true.  Set this property
     * in the layer options
     */
    isBaseLayer: true,
    
    /**
     * Property: url
     * {String} URL of the image to use
     */
    url: null,

    /**
     * Property: extent
     * {<OpenLayers.Bounds>} The image bounds in map units.  This extent will
     *     also be used as the default maxExtent for the layer.  If you wish
     *     to have a maxExtent that is different than the image extent, set the
     *     maxExtent property of the options argument (as with any other layer).
     */
    extent: null,
    
    /**
     * Property: size
     * {<OpenLayers.Size>} The image size in pixels
     */
    size: null,

    /**
     * Property: tile
     * {<OpenLayers.Tile.Image>}
     */
    tile: null,

    /**
     * Property: aspectRatio
     * {Float} The ratio of height/width represented by a single pixel in the
     * graphic
     */
    aspectRatio: null,

    /**
     * Constructor: OpenLayers.Layer.Image
     * Create a new image layer
     *
     * Parameters:
     * name - {String} A name for the layer.
     * url - {String} Relative or absolute path to the image
     * extent - {<OpenLayers.Bounds>} The extent represented by the image
     * size - {<OpenLayers.Size>} The size (in pixels) of the image
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, url, extent, size, options) {
        this.url = url;
        this.extent = extent;
        this.maxExtent = extent;
        this.size = size;
        OpenLayers.Layer.prototype.initialize.apply(this, [name, options]);

        this.aspectRatio = (this.extent.getHeight() / this.size.h) /
                           (this.extent.getWidth() / this.size.w);
    },    

    /**
     * Method: destroy
     * Destroy this layer
     */
    destroy: function() {
        if (this.tile) {
            this.removeTileMonitoringHooks(this.tile);
            this.tile.destroy();
            this.tile = null;
        }
        OpenLayers.Layer.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * Method: clone
     * Create a clone of this layer
     *
     * Paramters:
     * obj - {Object} An optional layer (is this ever used?)
     *
     * Returns:
     * {<OpenLayers.Layer.Image>} An exact copy of this layer
     */
    clone: function(obj) {
        
        if(obj == null) {
            obj = new OpenLayers.Layer.Image(this.name,
                                               this.url,
                                               this.extent,
                                               this.size,
                                               this.options);
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    },    
    
    /**
     * APIMethod: setMap
     * 
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    setMap: function(map) {
        /**
         * If nothing to do with resolutions has been set, assume a single
         * resolution determined by ratio*extent/size - if an image has a
         * pixel aspect ratio different than one (as calculated above), the
         * image will be stretched in one dimension only.
         */
        if( this.options.maxResolution == null ) {
            this.options.maxResolution = this.aspectRatio *
                                         this.extent.getWidth() /
                                         this.size.w;
        }
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);
    },

    /** 
     * Method: moveTo
     * Create the tile for the image or resize it for the new resolution
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * zoomChanged - {Boolean}
     * dragging - {Boolean}
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

        var firstRendering = (this.tile == null);

        if(zoomChanged || firstRendering) {

            //determine new tile size
            this.setTileSize();

            //determine new position (upper left corner of new bounds)
            var ul = new OpenLayers.LonLat(this.extent.left, this.extent.top);
            var ulPx = this.map.getLayerPxFromLonLat(ul);

            if(firstRendering) {
                //create the new tile
                this.tile = new OpenLayers.Tile.Image(this, ulPx, this.extent, 
                                                      null, this.tileSize);
                this.addTileMonitoringHooks(this.tile);
            } else {
                //just resize the tile and set it's new position
                this.tile.size = this.tileSize.clone();
                this.tile.position = ulPx.clone();
            }
            this.tile.draw();
        }
    }, 

    /**
     * Set the tile size based on the map size.
     */
    setTileSize: function() {
        var tileWidth = this.extent.getWidth() / this.map.getResolution();
        var tileHeight = this.extent.getHeight() / this.map.getResolution();
        this.tileSize = new OpenLayers.Size(tileWidth, tileHeight);
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
        tile.onLoadStart = function() {
            this.events.triggerEvent("loadstart");
        };
        tile.events.register("loadstart", this, tile.onLoadStart);
      
        tile.onLoadEnd = function() {
            this.events.triggerEvent("loadend");
        };
        tile.events.register("loadend", this, tile.onLoadEnd);
        tile.events.register("unload", this, tile.onLoadEnd);
    },

    /** 
     * Method: removeTileMonitoringHooks
     * This function takes a tile as input and removes the tile hooks 
     *     that were added in <addTileMonitoringHooks>.
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
            scope: this
        });
    },
    
    /**
     * APIMethod: setUrl
     * 
     * Parameters:
     * newUrl - {String}
     */
    setUrl: function(newUrl) {
        this.url = newUrl;
        this.tile.draw();
    },

    /** 
     * APIMethod: getURL
     * The url we return is always the same (the image itself never changes)
     *     so we can ignore the bounds parameter (it will always be the same, 
     *     anyways) 
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     */
    getURL: function(bounds) {
        return this.url;
    },

    CLASS_NAME: "OpenLayers.Layer.Image"
});
