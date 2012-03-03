/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/Grid.js
 * @requires OpenLayers/Tile/UTFGrid.js
 */

/** 
 * Class: OpenLayers.Layer.UTFGrid
 * This Layer reads from UTFGrid tiled data sources. 
 * Since UTFGrids are essentially JSON-based ASCII art 
 * with attached attributes, they are not visibly rendered. 
 * In order to use them in the map, 
 * you must add a UTFGrid Control as well.
 *
 * Example:
 *
 * (start code)
 * var world_utfgrid = new OpenLayers.Layer.UTFGrid({
 *     url: "/tiles/world_utfgrid/${z}/${x}/${y}.json",
 *     utfgridResolution: 4,
 *     displayInLayerSwitcher: false
 * );
 * map.addLayer(world_utfgrid);
 * 
 * var control = new OpenLayers.Control.UTFGrid({
 *     layers: [world_utfgrid],
 *     handlerMode: 'move',
 *     callback: function(dataLookup) {
 *         // do something with returned data
 *     }
 * })
 * (end code)
 *
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.Grid>
 */
OpenLayers.Layer.UTFGrid = OpenLayers.Class(OpenLayers.Layer.Grid, {
    
    /**
     * APIProperty: isBaseLayer
     * Default is true, as this is designed to be a base tile source. 
     */
    isBaseLayer: false,
    
    /**
     * APIProperty: projection
     * {<OpenLayers.Projection>}
     * Source projection for the UTFGrids.  Default is "EPSG:900913".
     */
    projection: new OpenLayers.Projection("EPSG:900913"),

    /**
     * APIProperty: zoomOffset
     * {Number} If your cache has more zoom levels than you want to provide
     *     access to with this layer, supply a zoomOffset.  This zoom offset
     *     is added to the current map zoom level to determine the level
     *     for a requested tile.  For example, if you supply a zoomOffset
     *     of 3, when the map is at the zoom 0, tiles will be requested from
     *     level 3 of your cache.  Default is 0 (assumes cache level and map
     *     zoom are equivalent).  Using <zoomOffset> is an alternative to
     *     setting <serverResolutions> if you only want to expose a subset
     *     of the server resolutions.
     */
    zoomOffset: 0,
    
    /**
     * APIProperty: serverResolutions
     * {Array} A list of all resolutions available on the server.  Only set this
     *     property if the map resolutions differ from the server. This
     *     property serves two purposes. (a) <serverResolutions> can include
     *     resolutions that the server supports and that you don't want to
     *     provide with this layer; you can also look at <zoomOffset>, which is
     *     an alternative to <serverResolutions> for that specific purpose.
     *     (b) The map can work with resolutions that aren't supported by
     *     the server, i.e. that aren't in <serverResolutions>. When the
     *     map is displayed in such a resolution data for the closest
     *     server-supported resolution is loaded and the layer div is
     *     stretched as necessary.
     */
    serverResolutions: null,

    /**
     * APIProperty: useJSONP
     * Should we use a JSONP script approach instead of a standard AJAX call?
     *
     * Set to true for using utfgrids from another server. 
     * Avoids same-domain policy restrictions. 
     * Note that this only works if the server accepts 
     * the callback GET parameter and dynamically 
     * wraps the returned json in a function call.
     * 
     * {Boolean} Default is false
     */
    useJSONP: false,

    /**
     * Constructor: OpenLayers.Layer.UTFGrid
     * Create a new UTFGrid layer.
     *
     * Parameters:
     * config - {Object} Configuration properties for the layer.
     *
     * Required configuration properties:
     * url - {String} The url template for UTFGrid tiles.  See the <url> property.
     */
    initialize: function(options) {
        OpenLayers.Layer.Grid.prototype.initialize.apply(
            this, [options.name, options.url, {}, options]
        );
        this.tileOptions = OpenLayers.Util.extend({
            utfgridResolution: this.utfgridResolution
        }, this.tileOptions);
    },
    
    /**
     * APIMethod: clone
     * Create a clone of this layer
     *
     * Parameters:
     * obj - {Object} Only used by a subclass of this layer.
     * 
     * Returns:
     * {<OpenLayers.Layer.UTFGrid>} An exact clone of this OpenLayers.Layer.UTFGrid
     */
    clone: function (obj) {
        if (obj == null) {
            obj = new OpenLayers.Layer.UTFGrid(this.getOptions());
        }

        // get all additions from superclasses
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);

        return obj;
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
        var xyz = this.getXYZ(bounds);
        var url = this.url;
        if (OpenLayers.Util.isArray(url)) {
            var s = '' + xyz.x + xyz.y + xyz.z;
            url = this.selectUrl(s, url);
        }
        
        return OpenLayers.String.format(url, xyz);
    },
    

    /**
     * APIProperty: utfgridResolution
     * {Number}
     * Ratio of the pixel width to the width of a UTFGrid data point.  If an 
     *     entry in the grid represents a 4x4 block of pixels, the 
     *     utfgridResolution would be 4.  Default is 2 (specified in 
     *     <OpenLayers.Tile.UTFGrid>).
     */

    /** 
     * Method: getTileInfo
     * Get tile information for a given location at the current map resolution.
     *
     * Parameters:
     * loc - {<OpenLayers.LonLat} A location in map coordinates.
     *
     * Returns:
     * {Object} An object with the following properties
     *
     *       globalCol: the tile's X  
     *
     *       globalRow: the tile's Y 
     *
     *       gridCol: the viewport grid X
     *
     *       gridRow: the viewpoirt grid Y
     *
     *       tile: the associated OpenLayers.Tile.UTFGrid object
     *
     *       zoom: the tile zoom level
     *
     *       i: the pixel X position relative to the current tile origin
     *
     *       j: the pixel Y position relative to the current tile origin
     */
    getTileInfo: function(loc) {
        var res = this.getServerResolution();

        // Get the global XY for the tile at this zoomlevel
        var fx = (loc.lon - this.tileOrigin.lon) / (res * this.tileSize.w);
        var fy = (this.tileOrigin.lat - loc.lat) / (res * this.tileSize.h);
        var globalCol = Math.floor(fx);
        var globalRow = Math.floor(fy);

        // Get the current grid offset
        var gridOrigin = this.grid[0][0].bounds;
        // Floating point math can cause problems (4.9999 should be 5)
        // flooring will cause big problems (4.999 becomes 4)... 
        // Do round or toFixed later?
        var gridColOffset = 
                (gridOrigin.left - this.tileOrigin.lon) / (res * this.tileSize.w);
        var gridRowOffset = 
                (this.tileOrigin.lat - gridOrigin.top) / (res * this.tileSize.h);

        // Calculate the grid XY for the tile
        var gridCol = globalCol - Math.round(gridColOffset);
        var gridRow = globalRow - Math.round(gridRowOffset);

        var resolutions = this.serverResolutions || this.resolutions;
        var zoom = this.zoomOffset == 0 ?
            OpenLayers.Util.indexOf(resolutions, res) :
            this.getServerZoom() + this.zoomOffset;
        
        var tile = this.grid[gridRow][gridCol];

        return {
            globalCol: globalCol, 
            globalRow: globalRow, 
            gridCol: gridCol, 
            gridRow: gridRow, 
            tile: tile,
            zoom: zoom,
            i: Math.floor((fx - globalCol) * this.tileSize.w),
            j: Math.floor((fy - globalRow) * this.tileSize.h)
        };
    },
    
    /**
     * APIProperty: getFeatureInfo
     * Get details about a feature associated with a map location.  The object
     *     returned will have id and data properties.  If the given location
     *     doesn't correspond to a feature, null will be returned.
     *
     * Parameters:
     * location - {<OpenLayers.LonLat>} map location
     *
     * Returns:
     * {Object} Object representing the feature id and UTFGrid data 
     *     corresponding to the given map location.  Returns null if the given
     *     location doesn't hit a feature.
     */
    getFeatureInfo: function(location) {
        var info = null;
        var tileInfo = this.getTileInfo(location);
        if (tileInfo.tile) {
            info = tileInfo.tile.getFeatureInfo(tileInfo.i, tileInfo.j);
        }
        return info;
    },

    /**
     * APIMethod: getFeatureId
     * Get the identifier for the feature associated with a map location.
     *
     * Parameters:
     * location - {<OpenLayers.LonLat>} map location
     *
     * Returns:
     * {String} The feature identifier corresponding to the given map location.
     *     Returns null if the location doesn't hit a feature.
     */
    getFeatureId: function(location) {
        var id = null;
        var info = this.getTileInfo(location);
        if (info.tile) {
            id = info.tile.getFeatureId(info.i, info.j);
        }
        return id;
    },

    /**
     * APIProperty: tileClass
     * {<OpenLayers.Tile>} The tile class to use for this layer.
     *     Defaults is OpenLayers.Tile.UTFGrid (not Tile.Image)
     */
    tileClass: OpenLayers.Tile.UTFGrid,

    /**
     * Method: getXYZ
     * Calculates x, y and z for the given bounds.
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     *
     * Returns:
     * {Object} - an object with x, y and z properties.
     */
    getXYZ: function(bounds) {
        var res = this.getServerResolution();
        var x = Math.round((bounds.left - this.maxExtent.left) /
            (res * this.tileSize.w));
        var y = Math.round((this.maxExtent.top - bounds.top) /
            (res * this.tileSize.h));
        var resolutions = this.serverResolutions || this.resolutions;
        var z = this.getServerZoom();
        if (this.zoomOffset > 0) {
            z += this.zoomOffset;
        }

        var limit = Math.pow(2, z);
        if (this.wrapDateLine)
        {
           x = ((x % limit) + limit) % limit;
        }

        return {'x': x, 'y': y, 'z': z};
    },
    
    /* APIMethod: setMap
     * When the layer is added to a map, then we can fetch our origin 
     *    (if we don't have one.) 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    setMap: function(map) {
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.tileOrigin) { 
            this.tileOrigin = new OpenLayers.LonLat(this.maxExtent.left,
                                                this.maxExtent.top);
        }                                       
    },

    CLASS_NAME: "OpenLayers.Layer.UTFGrid"
});
