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

    /** @type String */
    name: null,

    /** @type String */
    url: null,

    /** @type OpenLayers.Bounds */
    extent: null,
    
    /** @type OpenLayers.Size */
    size: null,

    /** @type Object */
    options: null,

    /** @type OpenLayers.Tile.Image */
    tile: null,

    /**
     * The ratio of height/width represented by a single pixel in the graphic
     * 
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
        this.aspectRatio = (this.extent.getHeight() / this.size.h) /
                           (this.extent.getWidth() / this.size.w);
        OpenLayers.Layer.prototype.initialize.apply(this, [name, options]);

        // unless explicitly set in options, the layer will be a base layer
        if((options == null) || (options.isBaseLayer == null)) {
            this.isBaseLayer = true;
        }
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
     * This is a bad method to have here.  It would be nicer to be able
     * to ask Layer directly.
     */
    shouldCalcResolutions: function() {
        var props = new Array(
            'scales', 'resolutions',
            'maxScale', 'minScale', 
            'maxResolution', 'minResolution', 
            'minExtent', 'maxExtent',
            'numZoomLevels', 'maxZoomLevel'
        );
        for(var i=0; i < props.length; i++) {
            var property = props[i];
            if(this.options[property] != null) {
                return false;
            }
        }
        return true;
    },
        
    
    /**
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        // If nothing to do with resolutions has been set, assume a single
        //  resolution determined by extent/size
        if(this.shouldCalcResolutions()) {
            this.options.resolutions = [this.extent.getWidth() / this.size.w];
        }
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);
    },

    /** When zooming or first rendering, create a new tile for the image.
     * 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} dragging
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

        var firstRendering = (this.tile == null);

        if(zoomChanged || firstRendering) {

            //clear out the old tile
            if(this.tile) {
                this.tile.destroy();
                this.tile = null;
            }
            
            //determine new tile bounds
            var tileBounds = this.extent.clone();

            //determine new tile size
            var tileWidth = this.extent.getWidth() / this.map.getResolution();
            var tileHeight = this.extent.getHeight() /
                             (this.map.getResolution() * this.aspectRatio);
            var tileSize = new OpenLayers.Size(tileWidth, tileHeight);
            
            //determine new position (upper left corner of new bounds)
            var ul = new OpenLayers.LonLat(tileBounds.left, tileBounds.top);
            var pos = this.map.getLayerPxFromLonLat(ul);

            this.tile = new OpenLayers.Tile.Image(this, pos, tileBounds, 
                                                  this.url, tileSize);
            this.tile.draw();
        }
    }, 
    
    /**
     * @param {String} newUrl
     */
    setUrl: function(newUrl) {
        this.url = newUrl;
        this.moveTo();
    },

    /**
     * @param {OpenLayers.Bounds} bounds
     */
    getURL: function(bounds) {
        return this.url;
    },
        
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Image"
});
