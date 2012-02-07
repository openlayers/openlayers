/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/Grid.js
 */

/** 
 * Class: OpenLayers.Layer.UTFGrid
 * MP TODO
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
     * APIProperty: sphericalMecator
     * Whether the tile extents should be set to the defaults for 
     *    spherical mercator. Useful for things like OpenStreetMap.
     *    Default is true as most (all?) utfgrid implementations assume
     *    sperical mercator.
     */
    sphericalMercator: false,

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
     * Constructor: OpenLayers.Layer.UTFGrid
     *
     * Parameters:
     * name - {String}
     * url - {String}
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, url, options) {
        if (options && options.sphericalMercator || this.sphericalMercator) {
            options = OpenLayers.Util.extend({
                maxExtent: new OpenLayers.Bounds(
                    -128 * 156543.03390625,
                    -128 * 156543.03390625,
                    128 * 156543.03390625,
                    128 * 156543.03390625
                ),
                maxResolution: 156543.03390625,
                numZoomLevels: 19,
                units: "m",
                projection: "EPSG:900913"
            }, options);
        }
        url = url || this.url;
        name = name || this.name;
        var newArguments = [name, url, {}, options];
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);
    },
    
    /**
     * APIMethod: clone
     * Create a clone of this layer
     *
     * Parameters:
     * obj - {Object} Is this ever used?
     * 
     * Returns:
     * {<OpenLayers.Layer.UTFGrid>} An exact clone of this OpenLayers.Layer.UTFGrid
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.UTFGrid(this.name,
                                               this.url,
                                               this.getOptions());
        }

        //get all additions from superclasses
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
     * {Number} Number of pixels per grid "cell"
     * Defaults to 4
     */
    utfgridResolution: 4,

    /** 
     * Method: getTileInfo
     * Get tile information for a given location at the current map resolution.
     *
     * Parameters:
     * loc - {<OpenLayers.LonLat} A location in map coordinates.
     *
     * Returns:
     * {Object} An object with 
     *     MP TODO 
     *     "col", "row", "i", and "j" properties.  The col
     *     and row values are zero based tile indexes from the top left.  The
     *     i and j values are the number of pixels to the left and top 
     *     (respectively) of the given location within the target tile.
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
        // MP TODO rounding errors can cause intermittent problems (4.9999 should be 5)
        // flooring will cause big problems (4.999 becomes 4)... do round or toFixed later?
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
            gridColOffset: gridColOffset,
            gridRowOffset: gridRowOffset,
            tile: tile,
            zoom: zoom,
            i: Math.floor((fx - globalCol) * this.tileSize.w),
            j: Math.floor((fy - globalRow) * this.tileSize.h)
        };
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
