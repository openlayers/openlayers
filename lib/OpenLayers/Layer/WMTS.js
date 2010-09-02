/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/Grid.js
 * @requires OpenLayers/Tile/Image.js
 */

/**
 * Class: OpenLayers.Layer.WMTS
 * Instances of the WMTS class allow viewing of tiles from a service that 
 *     implements the OGC WMTS specification version 1.0.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.Grid>
 */
OpenLayers.Layer.WMTS = OpenLayers.Class(OpenLayers.Layer.Grid, {
    
    /**
     * APIProperty: isBaseLayer
     * {Boolean} The layer will be considered a base layer.  Default is true.
     */
    isBaseLayer: true,

    /**
     * Property: version
     * {String} WMTS version.  Default is "1.0.0".
     */
    version: "1.0.0",
    
    /**
     * APIProperty: requestEncoding
     * {String} Request encoding.  Can be "REST" or "KVP".  Default is "KVP".
     */
    requestEncoding: "KVP",
    
    /**
     * APIProperty: url
     * {String} The base URL for the WMTS service.  Must be provided.
     */
    url: null,

    /**
     * APIProperty: layer
     * {String} The layer identifier advertised by the WMTS service.  Must be 
     *     provided.
     */
    layer: null,
    
    /** 
     * APIProperty: matrixSet
     * {String} One of the advertised matrix set identifiers.  Must be provided.
     */
    matrixSet: null,

    /** 
     * APIProperty: style
     * {String} One of the advertised layer styles.  Must be provided.
     */
    style: null,
    
    /** 
     * APIProperty: format
     * {String} The image MIME type.  Default is "image/jpeg".
     */
    format: "image/jpeg",
    
    /**
     * APIProperty: tileOrigin
     * {<OpenLayers.LonLat>} The top-left corner of the tile matrix in map 
     *     units.  If the tile origin for each matrix in a set is different,
     *     the <matrixIds> should include a topLeftCorner property.  If
     *     not provided, the tile origin will default to the top left corner
     *     of the layer <maxExtent>.
     */
    tileOrigin: null,
    
    /**
     * APIProperty: tileFullExtent
     * {<OpenLayers.Bounds>}  The full extent of the tile set.  If not supplied,
     *     the layer's <maxExtent> property will be used.
     */
    tileFullExtent: null,

    /**
     * APIProperty: formatSuffix
     * {String} For REST request encoding, an image format suffix must be 
     *     included in the request.  If not provided, the suffix will be derived
     *     from the <format> property.
     */
    formatSuffix: null,    

    /**
     * APIProperty: matrixIds
     * {Array} A list of tile matrix identifiers.  If not provided, the matrix
     *     identifiers will be assumed to be integers corresponding to the 
     *     map zoom level.  If a list of strings is provided, each item should
     *     be the matrix identifier that corresponds to the map zoom level.
     *     Additionally, a list of objects can be provided.  Each object should
     *     describe the matrix as presented in the WMTS capabilities.  These
     *     objects should have the propertes shown below.
     * 
     * Matrix properties:
     * identifier - {String} The matrix identifier (required).
     * topLeftCorner - {<OpenLayers.LonLat>} The top left corner of the 
     *     matrix.  Must be provided if different than the layer <tileOrigin>.
     * tileWidth - {Number} The tile width for the matrix.  Must be provided 
     *     if different than the width given in the layer <tileSize>.
     * tileHeight - {Number} The tile height for the matrix.  Must be provided 
     *     if different than the height given in the layer <tileSize>.
     */
    matrixIds: null,
    
    /**
     * APIProperty: dimensions
     * {Array} For RESTful request encoding, extra dimensions may be specified.
     *     Items in this list should be property names in the <params> object.
     *     Values of extra dimensions will be determined from the corresponding
     *     values in the <params> object.
     */
    dimensions: null,
    
    /**
     * APIProperty: params
     * {Object} Extra parameters to include in tile requests.  For KVP 
     *     <requestEncoding>, these properties will be encoded in the request 
     *     query string.  For REST <requestEncoding>, these properties will
     *     become part of the request path, with order determined by the 
     *     <dimensions> list.
     */
    params: null,
    
    /**
     * APIProperty: zoomOffset
     * {Number} If your cache has more levels than you want to provide
     *     access to with this layer, supply a zoomOffset.  This zoom offset
     *     is added to the current map zoom level to determine the level
     *     for a requested tile.  For example, if you supply a zoomOffset
     *     of 3, when the map is at the zoom 0, tiles will be requested from
     *     level 3 of your cache.  Default is 0 (assumes cache level and map
     *     zoom are equivalent).  Additionally, if this layer is to be used
     *     as an overlay and the cache has fewer zoom levels than the base
     *     layer, you can supply a negative zoomOffset.  For example, if a
     *     map zoom level of 1 corresponds to your cache level zero, you would
     *     supply a -1 zoomOffset (and set the maxResolution of the layer
     *     appropriately).  The zoomOffset value has no effect if complete
     *     matrix definitions (including scaleDenominator) are supplied in
     *     the <matrixIds> property.  Defaults to 0 (no zoom offset).
     */
    zoomOffset: 0,
    
    /**
     * Property: formatSuffixMap
     * {Object} a map between WMTS 'format' request parameter and tile image file suffix
     */
    formatSuffixMap: {
        "image/png": "png",
        "image/png8": "png",
        "image/png24": "png",
        "image/png32": "png",
        "png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "jpeg": "jpg",
        "jpg": "jpg"
    },
    
    /**
     * Property: matrix
     * {Object} Matrix definition for the current map resolution.  Updated by
     *     the <updateMatrixProperties> method.
     */
    matrix: null,
    
    /**
     * Constructor: OpenLayers.Layer.WMTS
     * Create a new WMTS layer.
     *
     * Example:
     * (code)
     * var wmts = new OpenLayers.Layer.WMTS({
     *     name: "My WMTS Layer",
     *     url: "http://example.com/wmts", 
     *     layer: "layer_id",
     *     style: "default",
     *     matrixSet: "matrix_id"
     * });
     * (end)
     *
     * Parameters:
     * config - {Object} Configuration properties for the layer.
     *
     * Required configuration properties:
     * url - {String} The base url for the service.  See the <url> property.
     * layer - {String} The layer identifier.  See the <layer> property.
     * style - {String} The layer style identifier.  See the <style> property.
     * matrixSet - {String} The tile matrix set identifier.  See the <matrixSet>
     *     property.
     *
     * Any other documented layer properties can be provided in the config object.
     */
    initialize: function(config) {

        // confirm required properties are supplied
        var required = {
            url: true,
            layer: true,
            style: true,
            matrixSet: true
        };
        for (var prop in required) {
            if (!(prop in config)) {
                throw new Error("Missing property '" + prop + "' in layer configuration.");
            }
        }

        config.params = OpenLayers.Util.upperCaseObject(config.params);
        var args = [config.name, config.url, config.params, config];
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, args);
        

        // determine format suffix (for REST)
        if (!this.formatSuffix) {
            this.formatSuffix = this.formatSuffixMap[this.format] || this.format.split("/").pop();            
        }

        // expand matrixIds (may be array of string or array of object)
        if (this.matrixIds) {
            var len = this.matrixIds.length;
            if (len && typeof this.matrixIds[0] === "string") {
                var ids = this.matrixIds;
                this.matrixIds = new Array(len);
                for (var i=0; i<len; ++i) {
                    this.matrixIds[i] = {identifier: ids[i]};
                }
            }
        }

    },
    
    /**
     * Method: setMap
     */
    setMap: function() {
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        this.updateMatrixProperties();
    },
    
    /**
     * Method: updateMatrixProperties
     * Called when map resolution changes to update matrix related properties.
     */
    updateMatrixProperties: function() {
        this.matrix = this.getMatrix();
        if (this.matrix) {
            if (this.matrix.topLeftCorner) {
                this.tileOrigin = this.matrix.topLeftCorner;
            }
            if (this.matrix.tileWidth && this.matrix.tileHeight) {
                this.tileSize = new OpenLayers.Size(
                    this.matrix.tileWidth, this.matrix.tileHeight
                );
            }
            if (!this.tileOrigin) { 
                this.tileOrigin = new OpenLayers.LonLat(
                    this.maxExtent.left, this.maxExtent.top
                );
            }   
            if (!this.tileFullExtent) { 
                this.tileFullExtent = this.maxExtent;
            }
        }
    },
    
    /**
     * Method: moveTo
     * 
     * Parameters:
     * bound - {<OpenLayers.Bounds>}
     * zoomChanged - {Boolean} Tells when zoom has changed, as layers have to
     *     do some init work in that case.
     * dragging - {Boolean}
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        if (zoomChanged || !this.matrix) {
            this.updateMatrixProperties();
        }
        return OpenLayers.Layer.Grid.prototype.moveTo.apply(this, arguments);
    },

    /**
     * APIMethod: clone
     * 
     * Parameters:
     * obj - {Object}
     * 
     * Returns:
     * {<OpenLayers.Layer.WMTS>} An exact clone of this <OpenLayers.Layer.WMTS>
     */
    clone: function(obj) {
        if (obj == null) {
            obj = new OpenLayers.Layer.WMTS(this.options);
        }
        //get all additions from superclasses
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);
        // copy/set any non-init, non-simple values here
        return obj;
    },
    
    /**
     * Method: getMatrix
     * Get the appropriate matrix definition for the current map resolution.
     */
    getMatrix: function() {
        var matrix;
        if (!this.matrixIds || this.matrixIds.length === 0) {
            matrix = {identifier: this.map.getZoom() + this.zoomOffset};
        } else {
            // get appropriate matrix given the map scale if possible
            if ("scaleDenominator" in this.matrixIds[0]) {
                // scale denominator calculation based on WMTS spec
                var denom = 
                    OpenLayers.METERS_PER_INCH * 
                    OpenLayers.INCHES_PER_UNIT[this.units] * 
                    this.map.getResolution() / 0.28E-3;
                var diff = Number.POSITIVE_INFINITY;
                var delta;
                for (var i=0, ii=this.matrixIds.length; i<ii; ++i) {
                    delta = Math.abs(1 - (this.matrixIds[i].scaleDenominator / denom));
                    if (delta < diff) {
                        diff = delta;
                        matrix = this.matrixIds[i];
                    }
                }
            } else {
                // fall back on zoom as index
                matrix = this.matrixIds[this.map.getZoom() + this.zoomOffset];
            }
        }
        return matrix;
    },
    
    /** 
     * Method: getTileInfo
     * Get tile information for a given location at the current map resolution.
     *
     * Parameters:
     * loc - {<OpenLayers.LonLat} A location in map coordinates.
     *
     * Returns:
     * {Object} An object with "col", "row", "i", and "j" properties.  The col
     *     and row values are zero based tile indexes from the top left.  The
     *     i and j values are the number of pixels to the left and top 
     *     (respectively) of the given location within the target tile.
     */
    getTileInfo: function(loc) {
        var res = this.map.getResolution();
        
        var fx = (loc.lon - this.tileOrigin.lon) / (res * this.tileSize.w);
        var fy = (this.tileOrigin.lat - loc.lat) / (res * this.tileSize.h);

        var col = Math.floor(fx);
        var row = Math.floor(fy);
        
        return {
            col: col, 
            row: row,
            i: Math.floor((fx - col) * this.tileSize.w),
            j: Math.floor((fy - row) * this.tileSize.h)
        };
    },
    
    /**
     * Method: getURL
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * 
     * Returns:
     * {String} A URL for the tile corresponding to the given bounds.
     */
    getURL: function(bounds) {
        bounds = this.adjustBounds(bounds);
        var url = "";
        if (!this.tileFullExtent || this.tileFullExtent.intersectsBounds(bounds)) {            

            var center = bounds.getCenterLonLat();            
            var info = this.getTileInfo(center);
            var matrixId = this.matrix.identifier;

            if (this.requestEncoding.toUpperCase() === "REST") {

                // include 'version', 'layer' and 'style' in tile resource url
                var path = this.version + "/" + this.layer + "/" + this.style + "/";

                // append optional dimension path elements
                if (this.dimensions) {
                    for (var i=0; i<this.dimensions.length; i++) {
                        if (this.params[this.dimensions[i]]) {
                            path = path + this.params[this.dimensions[i]] + "/";
                        }
                    }
                }

                // append other required path elements
                path = path + this.matrixSet + "/" + this.matrix.identifier + 
                    "/" + info.row + "/" + info.col + "." + this.formatSuffix;
                
                if (this.url instanceof Array) {
                    url = this.selectUrl(path, this.url);
                } else {
                    url = this.url;
                }
                if (!url.match(/\/$/)) {
                    url = url + "/";
                }
                url = url + path;

            } else if (this.requestEncoding.toUpperCase() === "KVP") {

                // assemble all required parameters
                var params = {
                    SERVICE: "WMTS",
                    REQUEST: "GetTile",
                    VERSION: this.version,
                    LAYER: this.layer,
                    STYLE: this.style,
                    TILEMATRIXSET: this.matrixSet,
                    TILEMATRIX: this.matrix.identifier,
                    TILEROW: info.row,
                    TILECOL: info.col,
                    FORMAT: this.format
                };
                url = OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(this, [params]);

            }
        }
        return url;    
    },
    
    /**
     * APIMethod: mergeNewParams
     * Extend the existing layer <params> with new properties.  Tiles will be
     *     reloaded with updated params in the request.
     * 
     * Parameters:
     * newParams - {Object} Properties to extend to existing <params>.
     */
    mergeNewParams: function(newParams) {
        if (this.requestEncoding.toUpperCase() === "KVP") {
            return OpenLayers.Layer.Grid.prototype.mergeNewParams.apply(
                this, [OpenLayers.Util.upperCaseObject(newParams)]
            );
        }
    },

    /**
     * Method: addTile
     * Create a tile, initialize it, and add it to the layer div. 
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * position - {<OpenLayers.Pixel>}
     * 
     * Returns:
     * {<OpenLayers.Tile.Image>} The added OpenLayers.Tile.Image
     */
    addTile: function(bounds,position) {
        return new OpenLayers.Tile.Image(this, position, bounds, 
                                         null, this.tileSize);
    },

    CLASS_NAME: "OpenLayers.Layer.WMTS"
});
