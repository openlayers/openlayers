/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/** 
 * @requires OpenLayers/Layer/XYZ.js
 */ 

/** 
 * Class: OpenLayers.Layer.ArcGISCache   
 * Layer for accessing cached map tiles from an ArcGIS Server style mapcache. 
 * Tile must already be cached for this layer to access it. This does not require 
 * ArcGIS Server itself.
 * 
 * A few attempts have been made at this kind of layer before. See 
 * http://trac.osgeo.org/openlayers/ticket/1967 
 * and 
 * http://trac.osgeo.org/openlayers/browser/sandbox/tschaub/arcgiscache/lib/OpenLayers/Layer/ArcGISCache.js
 *
 * Typically the problem encountered is that the tiles seem to "jump around".
 * This is due to the fact that the actual max extent for the tiles on AGS layers
 * changes at each zoom level due to the way these caches are constructed.
 * We have attempted to use the resolutions, tile size, and tile origin
 * from the cache meta data to make the appropriate changes to the max extent
 * of the tile to compensate for this behavior.  This must be done as zoom levels change
 * and before tiles are requested, which is why methods from base classes are overridden.
 *
 * For reference, you can access mapcache meta data in two ways. For accessing a 
 * mapcache through ArcGIS Server, you can simply go to the landing page for the
 * layer. (ie. http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer)
 * For accessing it directly through HTTP, there should always be a conf.xml file
 * in the root directory. 
 * (ie. http://serverx.esri.com/arcgiscache/DG_County_roads_yesA_backgroundDark/Layers/conf.xml)
 *  
 *Inherits from: 
 *  - <OpenLayers.Layer.XYZ>             
 */    
OpenLayers.Layer.ArcGISCache = OpenLayers.Class(OpenLayers.Layer.XYZ, {  

    /**
     * APIProperty: url
     * {String | Array} The base URL for the layer cache.  You can also
     *     provide a list of URL strings for the layer if your cache is
     *     available from multiple origins.  This must be set before the layer
     *     is drawn.
     */
    url: null,
    
   /**
    * APIProperty: tileOrigin
    * {<OpenLayers.LonLat>} The location of the tile origin for the cache.
    *     An ArcGIS cache has it's origin at the upper-left (lowest x value
    *     and highest y value of the coordinate system).  The units for the
    *     tile origin should be the same as the units for the cached data.
    */
    tileOrigin: null, 
   
   /**
    * APIProperty: tileSize
    * {<OpenLayers.Size>} This size of each tile. Defaults to 256 by 256 pixels.
    */
    tileSize: new OpenLayers.Size(256, 256),
    
   /**
    * APIProperty: useAGS
    * {Boolean} Indicates if we are going to be accessing the ArcGIS Server (AGS)
    *     cache via an AGS MapServer or directly through HTTP. When accessing via
    *     AGS the path structure uses a standard z/y/x structure. But AGS actually
    *     stores the tile images on disk using a hex based folder structure that looks
    *     like "http://example.com/mylayer/L00/R00000000/C00000000.png".  Learn more
    *     about this here:
    *     http://blogs.esri.com/Support/blogs/mappingcenter/archive/2010/08/20/Checking-Your-Local-Cache-Folders.aspx
    *     Defaults to true;
    */    
    useArcGISServer: true,

   /**
    * APIProperty: type
    * {String} Image type for the layer.  This becomes the filename extension
    *     in tile requests.  Default is "png" (generating a url like
    *     "http://example.com/mylayer/L00/R00000000/C00000000.png").
    */
    type: 'png',
    
    /**
    * APIProperty: useScales
    * {Boolean} Optional override to indicate that the layer should use 'scale' information
    *     returned from the server capabilities object instead of 'resolution' information.
    *     This can be important if your tile server uses an unusual DPI for the tiles.
    */
    useScales: false,
    
   /**
    * APIProperty: overrideDPI
    * {Boolean} Optional override to change the OpenLayers.DOTS_PER_INCH setting based 
    *     on the tile information in the server capabilities object.  This can be useful 
    *     if your server has a non-standard DPI setting on its tiles, and you're only using 
    *     tiles with that DPI.  This value is used while OpenLayers is calculating resolution
    *     using scales, and is not necessary if you have resolution information. (This is
    *     typically the case)  Regardless, this setting can be useful, but is dangerous
    *     because it will impact other layers while calculating resolution.  Only use this
    *     if you know what you are doing.  (See OpenLayers.Util.getResolutionFromScale)
    */
    overrideDPI: false,
    
   /**
    * Constructor: OpenLayers.Layer.ArcGISCache 
    * Creates a new instance of this class 
    * 
    * Parameters: 
    * name - {String} 
    * url - {String} 
    * options - {Object} extra layer options
    */ 
    initialize: function(name, url, options) { 
        OpenLayers.Layer.XYZ.prototype.initialize.apply(this, arguments);

        if (this.resolutions) {        
            this.serverResolutions = this.resolutions;
            this.maxExtent = this.getMaxExtentForResolution(this.resolutions[0]);
        }

        // this block steps through translating the values from the server layer JSON 
        // capabilities object into values that we can use.  This is also a helpful
        // reference when configuring this layer directly.
        if (this.layerInfo) {
            // alias the object
            var info = this.layerInfo;
            
            // build our extents
            var startingTileExtent = new OpenLayers.Bounds(
                info.fullExtent.xmin, 
                info.fullExtent.ymin, 
                info.fullExtent.xmax, 
                info.fullExtent.ymax  
            );

            // set our projection based on the given spatial reference.
            // esri uses slightly different IDs, so this may not be comprehensive
            this.projection = 'EPSG:' + info.spatialReference.wkid;
            this.sphericalMercator = (info.spatialReference.wkid == 102100);
            
            // convert esri units into openlayers units (basic feet or meters only)
            this.units = (info.units == "esriFeet") ? 'ft' : 'm';

            // optional extended section based on whether or not the server returned
            // specific tile information
            if (!!info.tileInfo) {            
                // either set the tiles based on rows/columns, or specific width/height
                this.tileSize = new OpenLayers.Size(
                    info.tileInfo.width || info.tileInfo.cols, 
                    info.tileInfo.height || info.tileInfo.rows
                );
                
                // this must be set when manually configuring this layer
                this.tileOrigin = new OpenLayers.LonLat(
                    info.tileInfo.origin.x, 
                    info.tileInfo.origin.y
                );

                var upperLeft = new OpenLayers.Geometry.Point(
                    startingTileExtent.left, 
                    startingTileExtent.top
                );
                
                var bottomRight = new OpenLayers.Geometry.Point(
                    startingTileExtent.right, 
                    startingTileExtent.bottom
                );            
                
                if (this.useScales) {
                    this.scales = [];
                } else {
                    this.resolutions = [];
                }
                
                this.lods = [];
                for(var key in info.tileInfo.lods) {
                    if (info.tileInfo.lods.hasOwnProperty(key)) {
                        var lod = info.tileInfo.lods[key];
                        if (this.useScales) {
                            this.scales.push(lod.scale);
                        } else {
                            this.resolutions.push(lod.resolution);
                        }
                    
                        var start = this.getContainingTileCoords(upperLeft, lod.resolution);
                        lod.startTileCol = start.x;
                        lod.startTileRow = start.y;
                    
                        var end = this.getContainingTileCoords(bottomRight, lod.resolution);
                        lod.endTileCol = end.x;
                        lod.endTileRow = end.y;    
                        this.lods.push(lod);
                    }
                }

                this.maxExtent = this.calculateMaxExtentWithLOD(this.lods[0]);
                this.serverResolutions = this.resolutions;
                if (this.overrideDPI && info.tileInfo.dpi) {
                    // see comment above for 'overrideDPI'
                    OpenLayers.DOTS_PER_INCH = info.tileInfo.dpi;
                }
            } 
       }
    }, 

   /** 
    * Method: getContainingTileCoords
    * Calculates the x/y pixel corresponding to the position of the tile
    *     that contains the given point and for the for the given resolution.
    * 
    * Parameters:
    * point - {<OpenLayers.Geometry.Point>} 
    * res - {Float} The resolution for which to compute the extent.
    * 
    * Returns: 
    * {<OpenLayers.Pixel>} The x/y pixel corresponding to the position 
    * of the upper left tile for the given resolution.
    */
    getContainingTileCoords: function(point, res) {
        return new OpenLayers.Pixel(
           Math.max(Math.floor((point.x - this.tileOrigin.lon) / (this.tileSize.w * res)),0),
           Math.max(Math.floor((this.tileOrigin.lat - point.y) / (this.tileSize.h * res)),0)
        );
    },
    
   /** 
    * Method: calculateMaxExtentWithLOD
    * Given a Level of Detail object from the server, this function
    *     calculates the actual max extent
    * 
    * Parameters: 
    * lod - {Object} a Level of Detail Object from the server capabilities object 
            representing a particular zoom level
    * 
    * Returns: 
    * {<OpenLayers.Bounds>} The actual extent of the tiles for the given zoom level
    */
   calculateMaxExtentWithLOD: function(lod) {
        // the max extent we're provided with just overlaps some tiles
        // our real extent is the bounds of all the tiles we touch

        var numTileCols = (lod.endTileCol - lod.startTileCol) + 1;
        var numTileRows = (lod.endTileRow - lod.startTileRow) + 1;        

        var minX = this.tileOrigin.lon + (lod.startTileCol * this.tileSize.w * lod.resolution);
        var maxX = minX + (numTileCols * this.tileSize.w * lod.resolution);

        var maxY = this.tileOrigin.lat - (lod.startTileRow * this.tileSize.h * lod.resolution);
        var minY = maxY - (numTileRows * this.tileSize.h * lod.resolution);
        return new OpenLayers.Bounds(minX, minY, maxX, maxY);
   },
    
   /** 
    * Method: calculateMaxExtentWithExtent
    * Given a 'suggested' max extent from the server, this function uses
    *     information about the actual tile sizes to determine the actual
    *     extent of the layer.
    * 
    * Parameters: 
    * extent - {<OpenLayers.Bounds>} The 'suggested' extent for the layer
    * res - {Float} The resolution for which to compute the extent.
    * 
    * Returns: 
    * {<OpenLayers.Bounds>} The actual extent of the tiles for the given zoom level
    */
   calculateMaxExtentWithExtent: function(extent, res) {
        var upperLeft = new OpenLayers.Geometry.Point(extent.left, extent.top);
        var bottomRight = new OpenLayers.Geometry.Point(extent.right, extent.bottom);
        var start = this.getContainingTileCoords(upperLeft, res);
        var end = this.getContainingTileCoords(bottomRight, res);
        var lod = {
            resolution: res,
            startTileCol: start.x,
            startTileRow: start.y,
            endTileCol: end.x,
            endTileRow: end.y
        };
        return this.calculateMaxExtentWithLOD(lod);
   },
    
    /** 
    * Method: getUpperLeftTileCoord
    * Calculates the x/y pixel corresponding to the position 
    *     of the upper left tile for the given resolution.
    * 
    * Parameters: 
    * res - {Float} The resolution for which to compute the extent.
    * 
    * Returns: 
    * {<OpenLayers.Pixel>} The x/y pixel corresponding to the position 
    * of the upper left tile for the given resolution.
    */
    getUpperLeftTileCoord: function(res) {
        var upperLeft = new OpenLayers.Geometry.Point(
            this.maxExtent.left,
            this.maxExtent.top);
        return this.getContainingTileCoords(upperLeft, res);
    },

    /** 
    * Method: getLowerRightTileCoord
    * Calculates the x/y pixel corresponding to the position 
    *     of the lower right tile for the given resolution.
    *  
    * Parameters: 
    * res - {Float} The resolution for which to compute the extent.
    * 
    * Returns: 
    * {<OpenLayers.Pixel>} The x/y pixel corresponding to the position
    * of the lower right tile for the given resolution.
    */
    getLowerRightTileCoord: function(res) {
        var bottomRight = new OpenLayers.Geometry.Point(
            this.maxExtent.right,
            this.maxExtent.bottom);
        return this.getContainingTileCoords(bottomRight, res);
    },
    
   /** 
    * Method: getMaxExtentForResolution
    * Since the max extent of a set of tiles can change from zoom level
    *     to zoom level, we need to be able to calculate that max extent 
    *     for a given resolution.
    *
    * Parameters: 
    * res - {Float} The resolution for which to compute the extent.
    * 
    * Returns: 
    * {<OpenLayers.Bounds>} The extent for this resolution
    */ 
    getMaxExtentForResolution: function(res) {
        var start = this.getUpperLeftTileCoord(res);
        var end = this.getLowerRightTileCoord(res);

        var numTileCols = (end.x - start.x) + 1;
        var numTileRows = (end.y - start.y) + 1;

        var minX = this.tileOrigin.lon + (start.x * this.tileSize.w * res);
        var maxX = minX + (numTileCols * this.tileSize.w * res);
        
        var maxY = this.tileOrigin.lat - (start.y * this.tileSize.h * res);
        var minY = maxY - (numTileRows * this.tileSize.h * res);
        return new OpenLayers.Bounds(minX, minY, maxX, maxY);
    },
    
   /** 
    * APIMethod: clone 
    * Returns an exact clone of this OpenLayers.Layer.ArcGISCache
    * 
    * Parameters: 
    * [obj] - {Object} optional object to assign the cloned instance to.
    *  
    * Returns: 
    * {<OpenLayers.Layer.ArcGISCache>} clone of this instance 
    */ 
    clone: function (obj) { 
        if (obj == null) { 
            obj = new OpenLayers.Layer.ArcGISCache(this.name, this.url, this.options);
        }
        return OpenLayers.Layer.XYZ.prototype.clone.apply(this, [obj]);
    },

    /**
     * Method: initGriddedTiles
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     */
    initGriddedTiles: function(bounds) {
        delete this._tileOrigin;
        OpenLayers.Layer.XYZ.prototype.initGriddedTiles.apply(this, arguments);
    },
    
    /**
     * Method: getMaxExtent
     * Get this layer's maximum extent.
     *
     * Returns:
     * {<OpenLayers.Bounds>}
     */
    getMaxExtent: function() {
        var resolution = this.map.getResolution();
        return this.maxExtent = this.getMaxExtentForResolution(resolution);
    },

    /**
     * Method: getTileOrigin
     * Determine the origin for aligning the grid of tiles.  
     *     The origin will be derived from the layer's <maxExtent> property. 
     *
     * Returns:
     * {<OpenLayers.LonLat>} The tile origin.
     */
    getTileOrigin: function() {
        if (!this._tileOrigin) {
            var extent = this.getMaxExtent();
            this._tileOrigin = new OpenLayers.LonLat(extent.left, extent.bottom);
        }
        return this._tileOrigin;
    },

   /**
    * Method: getURL
    * Determine the URL for a tile given the tile bounds.  This is should support
    *     urls that access tiles through an ArcGIS Server MapServer or directly through
    *     the hex folder structure using HTTP.  Just be sure to set the useArcGISServer
    *     property appropriately!  This is basically the same as 
    *     'OpenLayers.Layer.TMS.getURL',  but with the addition of hex addressing,
    *     and tile rounding.
    *
    * Parameters:
    * bounds - {<OpenLayers.Bounds>}
    *
    * Returns:
    * {String} The URL for a tile based on given bounds.
    */
    getURL: function (bounds) {
        var res = this.getResolution(); 

        // tile center
        var originTileX = (this.tileOrigin.lon + (res * this.tileSize.w/2)); 
        var originTileY = (this.tileOrigin.lat - (res * this.tileSize.h/2));

        var center = bounds.getCenterLonLat();
        var point = { x: center.lon, y: center.lat };
        var x = (Math.round(Math.abs((center.lon - originTileX) / (res * this.tileSize.w)))); 
        var y = (Math.round(Math.abs((originTileY - center.lat) / (res * this.tileSize.h)))); 
        var z = this.map.getZoom();

        // this prevents us from getting pink tiles (non-existant tiles)
        if (this.lods) {        
            var lod = this.lods[this.map.getZoom()];
            if ((x < lod.startTileCol || x > lod.endTileCol) 
                || (y < lod.startTileRow || y > lod.endTileRow)) {
                    return null;
            }
        }
        else {
            var start = this.getUpperLeftTileCoord(res);
            var end = this.getLowerRightTileCoord(res);
            if ((x < start.x || x >= end.x)
                || (y < start.y || y >= end.y)) {
                    return null;
            }        
        }

        // Construct the url string
        var url = this.url;
        var s = '' + x + y + z;

        if (OpenLayers.Util.isArray(url)) {
            url = this.selectUrl(s, url);
        }

        // Accessing tiles through ArcGIS Server uses a different path
        // structure than direct access via the folder structure.
        if (this.useArcGISServer) {
            // AGS MapServers have pretty url access to tiles
            url = url + '/tile/${z}/${y}/${x}';
        } else {
            // The tile images are stored using hex values on disk.
            x = 'C' + OpenLayers.Number.zeroPad(x, 8, 16);
            y = 'R' + OpenLayers.Number.zeroPad(y, 8, 16);
            z = 'L' + OpenLayers.Number.zeroPad(z, 2, 10);
            url = url + '/${z}/${y}/${x}.' + this.type;
        }

        // Write the values into our formatted url
        url = OpenLayers.String.format(url, {'x': x, 'y': y, 'z': z});

        return OpenLayers.Util.urlAppend(
            url, OpenLayers.Util.getParameterString(this.params)
        );
    },

    CLASS_NAME: 'OpenLayers.Layer.ArcGISCache' 
}); 
