/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/Grid.js
 */

/**
 * Class: OpenLayers.Layer.KaMap
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.Grid>
 */
OpenLayers.Layer.KaMap = OpenLayers.Class(OpenLayers.Layer.Grid, {

    /** 
     * APIProperty: isBaseLayer
     * {Boolean} KaMap Layer is always a base layer 
     */    
    isBaseLayer: true,

    /**
     * APIProperty: units
     * {?}
     */    
    units: null,

    /**
     * APIProperty: resolution
     * {Float}
     */
    resolution: OpenLayers.DOTS_PER_INCH,
    
    /**
     * Constant: DEFAULT_PARAMS
     * {Object} parameters set by default. The default parameters set 
     * the format via the 'i' parameter to 'jpeg'.    
     */
    DEFAULT_PARAMS: {
        i: 'jpeg',
        map: ''
    },
        
    /**
     * Constructor: OpenLayers.Layer.KaMap
     * 
     * Parameters:
     * name - {String}
     * url - {String}
     * params - {Object} Parameters to be sent to the HTTP server in the
     *    query string for the tile. The format can be set via the 'i'
     *    parameter (defaults to jpg) , and the map should be set via 
     *    the 'map' parameter. It has been reported that ka-Map may behave
     *    inconsistently if your format parameter does not match the format
     *    parameter configured in your config.php. (See ticket #327 for more
     *    information.)
     * options - {Object} Additional options for the layer. Any of the 
     *     APIProperties listed on this layer, and any layer types it
     *     extends, can be overridden through the options parameter. 
     */
    initialize: function(name, url, params, options) {
        var newArguments = [];
        newArguments.push(name, url, params, options);
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);
        this.params = OpenLayers.Util.applyDefaults(
            this.params, this.DEFAULT_PARAMS
        );
    },

    /**
     * Method: getURL
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} 
     * 
     * Returns:
     * {String} A string with the layer's url and parameters and also the 
     *          passed-in bounds and appropriate tile size specified as 
     *          parameters
     */
    getURL: function (bounds) {
        bounds = this.adjustBounds(bounds);
        var mapRes = this.map.getResolution();
        var scale = Math.round((this.map.getScale() * 10000)) / 10000;
        var pX = Math.round(bounds.left / mapRes);
        var pY = -Math.round(bounds.top / mapRes);
        return this.getFullRequestString(
                      { t: pY, 
                        l: pX,
                        s: scale
                      });
    },

    /** 
     * Method: calculateGridLayout
     * ka-Map uses the center point of the map as an origin for 
     * its tiles. Override calculateGridLayout to center tiles 
     * correctly for this case.
     *
     * Parameters:
     * bounds - {<OpenLayers.Bound>}
     * origin - {<OpenLayers.LonLat>}
     * resolution - {Number}
     *
     * Returns:
     * Object containing properties tilelon, tilelat, tileoffsetlat,
     * tileoffsetlat, tileoffsetx, tileoffsety
     */
    calculateGridLayout: function(bounds, origin, resolution) {
        var tilelon = resolution*this.tileSize.w;
        var tilelat = resolution*this.tileSize.h;
        
        var offsetlon = bounds.left;
        var tilecol = Math.floor(offsetlon/tilelon) - this.buffer;
        var tilecolremain = offsetlon/tilelon - tilecol;
        var tileoffsetx = -tilecolremain * this.tileSize.w;
        var tileoffsetlon = tilecol * tilelon;
        
        var offsetlat = bounds.top;  
        var tilerow = Math.ceil(offsetlat/tilelat) + this.buffer;
        var tilerowremain = tilerow - offsetlat/tilelat;
        var tileoffsety = -(tilerowremain+1) * this.tileSize.h;
        var tileoffsetlat = tilerow * tilelat;
        
        return { 
          tilelon: tilelon, tilelat: tilelat,
          tileoffsetlon: tileoffsetlon, tileoffsetlat: tileoffsetlat,
          tileoffsetx: tileoffsetx, tileoffsety: tileoffsety
        };
    },    

    /**
     * APIMethod: clone
     * 
     * Parameters: 
     * obj - {Object}
     * 
     * Returns:
     * {<OpenLayers.Layer.Kamap>} An exact clone of this OpenLayers.Layer.KaMap
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.KaMap(this.name,
                                            this.url,
                                            this.params,
                                            this.getOptions());
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here
        if (this.tileSize != null) {
            obj.tileSize = this.tileSize.clone();
        }
        
        // we do not want to copy reference to grid, so we make a new array
        obj.grid = [];

        return obj;
    },    
    
    /**
     * APIMethod: getTileBounds
     * Returns The tile bounds for a layer given a pixel location.
     *
     * Parameters:
     * viewPortPx - {<OpenLayers.Pixel>} The location in the viewport.
     *
     * Returns:
     * {<OpenLayers.Bounds>} Bounds of the tile at the given pixel location.
     */
    getTileBounds: function(viewPortPx) {
        var resolution = this.getResolution();
        var tileMapWidth = resolution * this.tileSize.w;
        var tileMapHeight = resolution * this.tileSize.h;
        var mapPoint = this.getLonLatFromViewPortPx(viewPortPx);
        var tileLeft = tileMapWidth * Math.floor(mapPoint.lon / tileMapWidth);
        var tileBottom = tileMapHeight * Math.floor(mapPoint.lat / tileMapHeight);
        return new OpenLayers.Bounds(tileLeft, tileBottom,
                                     tileLeft + tileMapWidth,
                                     tileBottom + tileMapHeight);
    },

    CLASS_NAME: "OpenLayers.Layer.KaMap"
});
