/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

 
/**
 * @class
 * 
 * @requires OpenLayers/Layer/HTTPRequest.js
 * @requires OpenLayers/Layer/WMS.js
 */
OpenLayers.Layer.WMS.Untiled = OpenLayers.Class.create();
OpenLayers.Layer.WMS.Untiled.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Layer.HTTPRequest, {

    /** Hashtable of default parameter key/value pairs
     * @final @type Object */
    DEFAULT_PARAMS: { service: "WMS",
                      version: "1.1.1",
                      request: "GetMap",
                      styles: "",
                      exceptions: "application/vnd.ogc.se_inimage",
                      format: "image/jpeg"
                     },
    reproject: true,

    /** the ratio of image/tile size to map size (this is the untiled buffer)
     * @type int */
    ratio: 2,

    /** @type OpenLayers.Tile.Image */
    tile: null,

    /** did the image finish loading before a new draw was initiated?
     * @type Boolean */
    doneLoading: false,

    /**
    * @constructor
    *
    * @param {String} name
    * @param {String} url
    * @param {Object} params
    */
    initialize: function(name, url, params, options) {
        var newArguments = new Array();
        //uppercase params
        params = OpenLayers.Util.upperCaseObject(params);
        newArguments.push(name, url, params, options);
        OpenLayers.Layer.HTTPRequest.prototype.initialize.apply(this, 
                                                                newArguments);
        OpenLayers.Util.applyDefaults(
                       this.params, 
                       OpenLayers.Util.upperCaseObject(this.DEFAULT_PARAMS)
                       );

        // unless explicitly set in options, if the layer is transparent, 
        // it will be an overlay        
        if ((options == null) || (options.isBaseLayer == null)) {
            this.isBaseLayer = ((this.params.TRANSPARENT != "true") && 
                                (this.params.TRANSPARENT != true));
        }
    },    

    /**
     * 
     */
    destroy: function() {
        if (this.tile) {
          this.tile.destroy();
          this.tile = null;    
        }
        OpenLayers.Layer.HTTPRequest.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * @param {Object} obj
     * 
     * @returns An exact clone of this OpenLayers.Layer.WMS.Untiled
     * @type OpenLayers.Layer.WMS.Untiled
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.WMS.Untiled(this.name,
                                                   this.url,
                                                   this.params,
                                                   this.options);
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.HTTPRequest.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here
        
        obj.tile = null;
        
        return obj;
    },    
    
    
    /** Once HTTPRequest has set the map, we can load the image div
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Layer.HTTPRequest.prototype.setMap.apply(this, arguments);
    },

    /**
     * Set the tile size based on the map size.  This also sets layer.imageSize
     * and layer.imageOffset for use by Tile.Image.
     */
    setTileSize: function() {
        var tileSize = this.map.getSize();
        tileSize.w = tileSize.w * this.ratio;
        tileSize.h = tileSize.h * this.ratio;
        this.tileSize = tileSize;
        this.imageSize = tileSize;
        this.imageOffset = new OpenLayers.Pixel(0, 0);
    },

    /** When it is not a dragging move (ie when done dragging)
     *   reload and recenter the div.
     * 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} dragging
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
    
    getURL: function(bounds) {
        return this.getFullRequestString( {'BBOX': bounds.toBBOX(),
                                                  'WIDTH': this.tileSize.w,
                                                  'HEIGHT': this.tileSize.h} );
    },
 
    
    /** Once HTTPRequest has updated the url, reload the image div
     * @param {String} newUrl
     */
    setUrl: function(newUrl) {
        OpenLayers.Layer.HTTPRequest.prototype.setUrl.apply(this, arguments);
        this.moveTo();
    },

    /** Once HTTPRequest has updated new params, reload the image div
     * @param {Object} newParams
     */
    mergeNewParams:function(newParams) {
        var upperParams = OpenLayers.Util.upperCaseObject(newParams);
        var newArguments = [upperParams];
        OpenLayers.Layer.HTTPRequest.prototype.mergeNewParams.apply(this, 
                                                                 newArguments);
        //redraw
        this.moveTo(null, true);
    },
    
    /** combine the layer's url with its params and these newParams. 
    *   
    *    Add the SRS parameter from 'projection' -- this is probably
    *     more eloquently done via a setProjection() method, but this 
    *     works for now and always.
    * 
    * @param {Object} newParams
    * 
    * @type String
    */
    getFullRequestString:function(newParams) {
        var projection = this.map.getProjection();
        this.params.SRS = (projection == "none") ? null : projection;

        return OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(
                                                    this, arguments);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WMS.Untiled"
});
