/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */
 
/**
 * @fileoverview Image Layer
 * @author Tim Schaub
 */

/**
 * @class
 * 
 * @requires OpenLayers/Layer.js
 */
OpenLayers.Layer.Image = OpenLayers.Class.create();
OpenLayers.Layer.Image.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Layer, {

    /** By default, Layer.Image will be a baselayer
     * 
     * @type Boolean */
    isBaseLayer: true,
    
    /** @type String */
    url: null,

    /**
     * The image bounds in map units
     * @type OpenLayers.Bounds
     */
    extent: null,
    
    /**
     * The image size in pixels
     * @type OpenLayers.Size
     */
    size: null,

    /** @type OpenLayers.Tile.Image */
    tile: null,

    /**
     * The ratio of height/width represented by a single pixel in the graphic
     * @type Float */
    aspectRatio: null,

    /**
    * @constructor
    *
    * @param {String} name
    * @param {String} url Relative or absolute path to the image
    * @param {OpenLayers.Bounds} extent The extent represented by the image
    * @param {OpenLayers.Size} size The size (in pixels) of the image
    * @param {Object} options Hashtable of extra options to tag onto the layer
    */
    initialize: function(name, url, extent, size, options) {
        this.url = url;
        this.extent = extent;
        this.size = size;
        OpenLayers.Layer.prototype.initialize.apply(this, [name, options]);

        this.aspectRatio = (this.extent.getHeight() / this.size.h) /
                           (this.extent.getWidth() / this.size.w);
    },    

    /**
     * 
     */
    destroy: function() {
        this.tile.destroy();
        this.tile = null;
        OpenLayers.Layer.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * @param {Object} obj
     * 
     * @returns An exact clone of this OpenLayers.Layer.Image
     * @type OpenLayers.Layer.Image
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
     * @param {OpenLayers.Map} map
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

    /** Create the tile for the image or resize it for the new resolution
     * 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} dragging
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
                                                      this.url, this.tileSize);
            } else {
                //just resize the tile and set it's new position
                this.tile.size = this.tileSize.clone();
                this.tile.position = ulPx.clone();
            }
            this.tile.draw();
        }
    }, 

    /**
     * Set the tile size based on the map size.  This also sets layer.imageSize
     * and layer.imageOffset for use by Tile.Image.
     */
    setTileSize: function() {
        var tileWidth = this.extent.getWidth() / this.map.getResolution();
        var tileHeight = this.extent.getHeight() / this.map.getResolution();
        this.tileSize = new OpenLayers.Size(tileWidth, tileHeight);
        this.imageSize = this.tileSize;
        this.imageOffset = new OpenLayers.Pixel(0, 0);
    },

    /**
     * @param {String} newUrl
     */
    setUrl: function(newUrl) {
        this.url = newUrl;
        this.draw();
    },

    /** The url we return is always the same (the image itself never changes)
     *   so we can ignore the bounds parameter (it will always be the same, 
     *   anyways) 
     * 
     * @param {OpenLayers.Bounds} bounds
     */
    getURL: function(bounds) {
        return this.url;
    },
        
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Image"
});
