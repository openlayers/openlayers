/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

 
/**
 * @requires OpenLayers/Layer/HTTPRequest.js
 * @requires OpenLayers/Layer/WMS.js
 *
 * Class: OpenLayers.Layer.WMS
 * 
 * Inherits from: 
 *  - <OpenLayers.Layer.HTTPRequest>
 */
OpenLayers.Layer.WMS.Untiled = OpenLayers.Class.create();
OpenLayers.Layer.WMS.Untiled.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Layer.HTTPRequest, {

    /** 
     * Property: DEFAULT_PARAMS
     * Hashtable of default parameter key/value pairs
     */
    DEFAULT_PARAMS: { service: "WMS",
                      version: "1.1.1",
                      request: "GetMap",
                      styles: "",
                      exceptions: "application/vnd.ogc.se_inimage",
                      format: "image/jpeg"
                     },
    /**
     * APIProperty: reproject
     * Whether or not to use the base layer as a basis for 'staking' the corners
     * of the image geographically.
     */
    reproject: true,

    /** 
     * APIProperty: ratio
     * {Float} the ratio of image/tile size to map size (this is the untiled
     * buffer)
     */
    ratio: 2,

    /**
     * Property: tile
     * {<OpenLayers.Tile.Image>} 
     */
    tile: null,

    /**
     * Property: doneLoading
     * {Boolean} did the image finish loading before a new draw was initiated?
     */
    doneLoading: false,

    /**
    * Constructor: OpenLayers.Layer.WMS.Untiled
    *
    * Parameters:
    * name - {String} 
    * url - {String} 
    * params - {Object} 
    * options - {Object} 
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

        //layer is transparent        
        if (this.params.TRANSPARENT && 
            this.params.TRANSPARENT.toString().toLowerCase() == "true") {
            
            // unless explicitly set in options, make layer an overlay
            if ( (options == null) || (!options.isBaseLayer) ) {
                this.isBaseLayer = false;
            } 
            
            // jpegs can never be transparent, so intelligently switch the 
            //  format, depending on teh browser's capabilities
            if (this.params.FORMAT == "image/jpeg") {
                this.params.FORMAT = OpenLayers.Util.alphaHack() ? "image/gif"
                                                                 : "image/png";
            }
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
     * Makes an exact clone of this OpenLayers.Layer.WMS.Untiled
     * 
     * Parameters:
     * obj - {Object}
     * 
     * Returns:
     * {<OpenLayers.Layer.WMS.Untiled>} 
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
        return this.getFullRequestString( {'BBOX': bounds.toBBOX(),
                                                  'WIDTH': this.tileSize.w,
                                                  'HEIGHT': this.tileSize.h} );
    },
 
    
    /**
     * Method: setURL
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
        var upperParams = OpenLayers.Util.upperCaseObject(newParams);
        var newArguments = [upperParams];
        OpenLayers.Layer.HTTPRequest.prototype.mergeNewParams.apply(this, 
                                                                 newArguments);
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
        this.params.SRS = (projection == "none") ? null : projection;

        return OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(
                                                    this, arguments);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WMS.Untiled"
});
