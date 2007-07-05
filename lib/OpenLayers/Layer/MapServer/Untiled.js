/* Copyright (c) 2006-2007 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/release-license.txt 
 * for the full text of the license. */
 
/**
 * @requires OpenLayers/Layer/HTTPRequest.js
 * @requires OpenLayers/Layer/MapServer.js
 *
 * Class: OpenLayers.Layer.MapServer.Untiled
 *
 * Inherits from:
 *  - <OpenLayers.Layer.HTTPRequest> 
 */
OpenLayers.Layer.MapServer.Untiled = OpenLayers.Class.create();
OpenLayers.Layer.MapServer.Untiled.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Layer.HTTPRequest, {

    /**
     * Constant: default_params
     * Hashtable of default parameter key/value pairs
     */
    default_params: {
                      mode: "map",
                      map_imagetype: "png"
                     },
    
    /**
     * APIProperty: reproject
     * {Boolean} 'stretch' tiles according to base layer.
     */
    reproject: true,

    /**
     * APIProperty: ratio
     * {Float} the ratio of image/tile size to map size (this is the untiled
     * buffer)
     */
    ratio: 1,

    /** 
     * Property: tile
     * {<OpenLayers.Tile.Image>}
     */
    tile: null,

    /**
     * Propety: doneLoading
     * {Boolean} did the image finish loading before a new draw was initiated?
     */
    doneLoading: false,

    /**
    * Constructor: OpenLayers.Layer.MapServer.Untiled
    *
    * Parameters:
    * name - {String} 
    * url - {String} 
    * params - {Object} 
    */
    initialize: function(name, url, params, options) {
        var newArguments = [];
        newArguments.push(name, url, params, options);
        OpenLayers.Layer.HTTPRequest.prototype.initialize.apply(this, 
                                                                newArguments);
        OpenLayers.Util.applyDefaults(
                       this.params, 
                       this.default_params
                       );

        // unless explicitly set in options, if the layer is transparent, 
        // it will be an overlay        
        if ((options == null) || (options.isBaseLayer == null)) {
            this.isBaseLayer = ((this.params.transparent != "true") && 
                                (this.params.transparent != true));
        }
    },    

    /**
     * APIMethod: destroy 
     */
    destroy: function() {
        if (this.tile) {
          this.tile.destroy();
          this.tile = null;    
        }
        OpenLayers.Layer.HTTPRequest.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * APIMethod: clone
     * obj - {Object} 
     * 
     * Returns:
     * {<OpenLayers.Layer.MapServer.Untiled>} An exact clone of this
     * OpenLayers.Layer.MapServer.Untiled
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.MapServer.Untiled(this.name,
                                                         this.url,
                                                         this.params,
                                                         this.options);
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.HTTPRequest.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    },    
    
    
    /**
     * Method: setMap
     * Once HTTPRequest has set the map, we can load the image div
     * 
     * Parameters:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        OpenLayers.Layer.HTTPRequest.prototype.setMap.apply(this, arguments);
    },
    
    /**
     * Method: setTileSize
     * Set the tile size based on the map size.
     */
    setTileSize: function() {
        var tileSize = this.map.getSize();
        tileSize.w = tileSize.w * this.ratio;
        tileSize.h = tileSize.h * this.ratio;
        this.tileSize = tileSize;
    },

    /**
     * Method: moveTo
     * When it is not a dragging move (ie when done dragging)
     *   reload and recenter the div.
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} 
     * zoomChanged - {Boolean} 
     * dragging - {Boolean} 
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        if (!this.doneLoading) {
            this.events.triggerEvent("loadcancel"); 
            this.doneLoading = true; 
        }
        OpenLayers.Layer.HTTPRequest.prototype.moveTo.apply(this,arguments);
        
        if (bounds == null) {
            bounds = this.map.getExtent();
        }

        var firstRendering = (this.tile == null);

        //does the new bounds to which we need to move fall outside of the 
        // current tile's bounds?
        var outOfBounds = (!firstRendering &&
                           !this.tile.bounds.containsBounds(bounds));

        if ( zoomChanged || firstRendering || (!dragging && outOfBounds) ) {

            //clear out the old tile 
            if (this.tile) {
                this.tile.clear();
            }

            //determine new tile bounds
            var center = bounds.getCenterLonLat();
            var tileWidth = bounds.getWidth() * this.ratio;
            var tileHeight = bounds.getHeight() * this.ratio;
            var tileBounds = 
                new OpenLayers.Bounds(center.lon - (tileWidth / 2),
                                      center.lat - (tileHeight / 2),
                                      center.lon + (tileWidth / 2),
                                      center.lat + (tileHeight / 2));

            //determine new tile size
            this.setTileSize();

            //formulate request url string
            var url = this.getURL(tileBounds); 

            //determine new position (upper left corner of new bounds)
            var ul = new OpenLayers.LonLat(tileBounds.left, tileBounds.top);
            var pos = this.map.getLayerPxFromLonLat(ul);

            if ( this.tile && !this.tile.size.equals(this.tileSize)) {
                this.tile.destroy();
                this.tile = null;
            }

            this.events.triggerEvent("loadstart");
            this.doneLoading = false;
            if (!this.tile) {
                this.tile = new OpenLayers.Tile.Image(this, pos, tileBounds, 
                                                     url, this.tileSize);
                this.tile.draw();
                var onload = function() { 
                    this.doneLoading = true; 
                    this.events.triggerEvent("loadend"); 
                }
                OpenLayers.Event.observe(this.tile.imgDiv, 'load',
                                         onload.bindAsEventListener(this));
            } else {
                this.tile.moveTo(tileBounds, pos);
            } 
    
        }
    },
   
    /**
     * Method: getURL
     *
     * Parameters: 
     * bounds - {<OpenLayers.Bounds>}
     */
    getURL: function(bounds) {
        var url = this.getFullRequestString(
                     {mapext:bounds.toBBOX().replace(/,/g," "),
                      imgext:bounds.toBBOX().replace(/,/g," "),
                      map_size: this.tileSize.w + " " + this.tileSize.h,
                      imgx: this.tileSize.w / 2,
                      imgy: this.tileSize.h / 2,
                      imgxy: this.tileSize.w + " " + this.tileSize.h
                      });
        return url;
    },
 
    
    /**
     * APIMehod: setUrl
     * Once HTTPRequest has updated the url, reload the image div
     *
     * Parameters:
     * newUrl - {String} 
     */
    setUrl: function(newUrl) {
        OpenLayers.Layer.HTTPRequest.prototype.setUrl.apply(this, arguments);
        this.redraw();
    },

    /** 
     * APIMethod: mergeNewParams
     * Once HTTPRequest has updated new params, reload the image div
     *
     * Parameters:
     * newParams - {Object} 
     */
    mergeNewParams:function(newParams) {
        OpenLayers.Layer.HTTPRequest.prototype.mergeNewParams.apply(this, 
                                                                 [newParams]);
        this.redraw();
    },
    
    /** 
    * APIMethod: getFullRequestString
    * combine the layer's url with its params and these newParams. 
    *   
    *    Add the SRS parameter from 'projection' -- this is probably
    *     more eloquently done via a setProjection() method, but this 
    *     works for now and always.
    *
    * Parameters:
    * newParams - {Object} 
    */
    getFullRequestString:function(newParams) {
        var projection = this.map.getProjection();
        this.params.srs = (projection == "none") ? null : projection;

        return OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(
                                                    this, arguments);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.MapServer.Untiled"
});
